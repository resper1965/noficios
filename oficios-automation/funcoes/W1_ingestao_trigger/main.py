"""
W1: Gatilho de Ingestão (Gateway)
Cloud Function acionada por evento Cloud Storage quando um novo ofício chega.
Responsabilidades: Identificar o tenant, registrar ofício e disparar processamento.
"""
import base64
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict

from google.cloud import pubsub_v1, storage

# Importa os utilitários (ajuste o path conforme necessário)
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.api_clients import FirestoreClient, PubSubClient
from utils.schema import OficioStatus

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
PUBSUB_TOPIC = os.getenv('PUBSUB_TOPIC_PROCESSAMENTO', 'oficios_para_processamento')

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
pubsub_client = PubSubClient(project_id=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


def extrair_dominio_do_filename(filename: str) -> str:
    """
    Extrai o domínio do nome do arquivo.
    
    Formato esperado: YYYYMMDD-alguma-coisa-dominio.com.eml
    Exemplo: 20241010-oficio-urgente-empresa.com.br.eml
    
    Args:
        filename: Nome do arquivo (sem path)
        
    Returns:
        Domínio extraído (ex: empresa.com.br)
    """
    # Remove extensão .eml se presente
    if filename.endswith('.eml'):
        filename = filename[:-4]
    
    # Padrão: YYYYMMDD-texto-dominio.com ou YYYYMMDD-texto-dominio.com.br
    # Procura por padrão de domínio (palavra.palavra ou palavra.palavra.palavra)
    pattern = r'([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})?)(?:\.|$)'
    matches = re.findall(pattern, filename)
    
    if not matches:
        raise ValueError(f"Não foi possível extrair domínio do filename: {filename}")
    
    # Pega o último match (mais provável de ser o domínio)
    domain = matches[-1].lower()
    
    return domain


def handle_ingestion(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Cloud Function acionada por evento Cloud Storage.
    
    Args:
        event: Dados do evento Cloud Storage
        context: Contexto da execução
        
    Returns:
        Dicionário com status da operação
    """
    try:
        logger.info(f"Iniciando ingestão. Event ID: {context.event_id}")
        
        # 1. Extrai informações do evento
        bucket_name = event['bucket']
        file_path = event['name']
        file_size = event.get('size', 0)
        content_type = event.get('contentType', 'application/octet-stream')
        
        # Obtém apenas o nome do arquivo (sem path)
        filename = file_path.split('/')[-1]
        
        logger.info(f"Arquivo detectado: gs://{bucket_name}/{file_path}")
        logger.info(f"Nome do arquivo: {filename}")
        logger.info(f"Tamanho: {file_size} bytes, Tipo: {content_type}")
        
        # 2. Extrai domínio do nome do arquivo
        # Formato esperado: YYYYMMDD-alguma-coisa-dominio.com.eml
        try:
            domain = extrair_dominio_do_filename(filename)
        except ValueError as e:
            logger.error(f"Erro ao extrair domínio do filename: {e}")
            return {'status': 'error', 'message': str(e)}
        
        logger.info(f"Domínio extraído: {domain}")
        
        # Thread ID e Message ID serão extraídos do conteúdo do email posteriormente
        # Por ora, usamos o filename como identificador temporário
        thread_id = filename.replace('.eml', '')
        message_id = context.event_id
        
        # 3. Resolve a organização pelo domínio
        org_data = firestore_client.get_organization_by_domain(domain)
        
        if not org_data:
            error_msg = f"Organização não encontrada para o domínio: {domain}"
            logger.error(error_msg)
            return {
                'status': 'error',
                'message': error_msg,
                'domain': domain
            }
        
        org_id = org_data['org_id']
        org_name = org_data.get('name', 'Unknown')
        logger.info(f"Organização identificada: {org_name} (ID: {org_id})")
        
        # 4. Prepara os metadados do ofício
        oficio_data = {
            'org_id': org_id,
            'thread_id': thread_id,
            'message_id': message_id,
            'status': OficioStatus.AGUARDANDO_PROCESSAMENTO.value,
            'arquivo_original': {
                'bucket': bucket_name,
                'path': file_path,
                'filename': filename,
                'size': file_size,
                'content_type': content_type
            },
            'anexos_urls': [f"gs://{bucket_name}/{file_path}"],
            'metadata': {
                'source': 'email',
                'domain': domain,
                'ingestion_timestamp': datetime.utcnow().isoformat(),
                'event_id': context.event_id
            },
            'audit_trail': [{
                'user_id': 'system',
                'timestamp': datetime.utcnow().isoformat(),
                'action': 'ingestion'
            }]
        }
        
        # 5. Registra o ofício no Firestore
        oficio_id = firestore_client.create_oficio(org_id, oficio_data)
        logger.info(f"Ofício registrado no Firestore: {oficio_id}")
        
        # 6. Publica mensagem no Pub/Sub para processamento assíncrono
        message_data = {
            'oficio_id': oficio_id,
            'org_id': org_id,
            'bucket': bucket_name,
            'file_path': file_path,
            'thread_id': thread_id,
            'message_id': message_id
        }
        
        # Usa o PubSubClient
        pubsub_message_id = pubsub_client.publish_message(PUBSUB_TOPIC, message_data)
        logger.info(f"Mensagem publicada no Pub/Sub: {pubsub_message_id}")
        
        # 7. Retorna sucesso
        response = {
            'status': 'success',
            'oficio_id': oficio_id,
            'org_id': org_id,
            'domain': domain,
            'pubsub_message_id': pubsub_message_id,
            'message': f'Ofício {oficio_id} registrado e enviado para processamento'
        }
        
        logger.info(f"Ingestão concluída com sucesso: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Erro durante ingestão: {e}", exc_info=True)
        return {
            'status': 'error',
            'message': f'Erro ao processar ingestão: {str(e)}'
        }


# Entry point para Cloud Functions
def ingest_oficio(event, context):
    """Entry point para Cloud Function (Storage Trigger)"""
    return handle_ingestion(event, context)

