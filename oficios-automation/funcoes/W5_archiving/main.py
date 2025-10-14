"""
W5: Arquivamento e Trilhas - Gestão de Ciclo de Vida
Cloud Function acionada por Pub/Sub após envio da resposta.
Responsabilidades: Arquivar anexos, organizar estrutura, atualizar trilhas.
"""
import base64
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

from google.cloud import firestore, storage

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.api_clients import FirestoreClient

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
ARCHIVE_BUCKET = os.getenv('ARCHIVE_BUCKET', f'{PROJECT_ID}-oficios-archive')

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)
db = firestore.Client(project=PROJECT_ID)


def criar_estrutura_arquivamento(org_id: str, oficio_id: str, data_referencia: datetime) -> str:
    """
    Cria estrutura de pastas para arquivamento.
    
    Formato: /Oficios/{org_id}/{YYYY}/{MM}/{oficio_id}/
    
    Args:
        org_id: ID da organização
        oficio_id: ID do ofício
        data_referencia: Data de referência para organização
        
    Returns:
        Path da estrutura criada
    """
    year = data_referencia.strftime('%Y')
    month = data_referencia.strftime('%m')
    
    archive_path = f"Oficios/{org_id}/{year}/{month}/{oficio_id}/"
    
    logger.info(f"Estrutura de arquivamento: {archive_path}")
    
    return archive_path


def arquivar_anexo(
    source_bucket: str,
    source_path: str,
    dest_bucket: str,
    dest_path: str
) -> str:
    """
    Move/copia anexo para estrutura de arquivamento.
    
    Args:
        source_bucket: Bucket de origem
        source_path: Path de origem
        dest_bucket: Bucket de destino (archive)
        dest_path: Path de destino
        
    Returns:
        URL permanente (gs://)
    """
    try:
        # Bucket de origem e destino
        source_bucket_obj = storage_client.bucket(source_bucket)
        dest_bucket_obj = storage_client.bucket(dest_bucket)
        
        # Blob de origem
        source_blob = source_bucket_obj.blob(source_path)
        
        # Copia para destino
        dest_bucket_obj.copy_blob(source_blob, dest_bucket_obj, dest_path)
        
        permanent_url = f"gs://{dest_bucket}/{dest_path}"
        
        logger.info(f"Anexo arquivado: {permanent_url}")
        
        # (Opcional) Deletar original após confirmação
        # source_blob.delete()
        
        return permanent_url
        
    except Exception as e:
        logger.error(f"Erro ao arquivar anexo: {e}")
        # Retorna URL original em caso de erro
        return f"gs://{source_bucket}/{source_path}"


def processar_arquivamento(oficio_id: str, org_id: str) -> Dict[str, Any]:
    """
    Processa arquivamento completo de um ofício.
    
    Args:
        oficio_id: ID do ofício
        org_id: ID da organização
        
    Returns:
        Dicionário com resultado do arquivamento
    """
    logger.info(f"Iniciando arquivamento de ofício {oficio_id} (org: {org_id})")
    
    # 1. Busca dados do ofício
    oficio = firestore_client.get_oficio(org_id, oficio_id)
    
    if not oficio:
        raise ValueError(f"Ofício {oficio_id} não encontrado")
    
    # 2. Determina data de referência
    respondido_em = oficio.get('respondido_em') or oficio.get('created_at')
    
    if isinstance(respondido_em, str):
        data_ref = datetime.fromisoformat(respondido_em.replace('Z', '+00:00'))
    else:
        data_ref = respondido_em or datetime.utcnow()
    
    # 3. Cria estrutura de arquivamento
    archive_path = criar_estrutura_arquivamento(org_id, oficio_id, data_ref)
    
    # 4. Processa anexos
    arquivo_original = oficio.get('arquivo_original', {})
    anexos_urls = oficio.get('anexos_urls', [])
    
    anexos_arquivados = []
    
    # Arquiva arquivo original
    if arquivo_original:
        source_bucket = arquivo_original.get('bucket')
        source_path = arquivo_original.get('path')
        
        if source_bucket and source_path:
            dest_path = f"{archive_path}{os.path.basename(source_path)}"
            
            permanent_url = arquivar_anexo(
                source_bucket,
                source_path,
                ARCHIVE_BUCKET,
                dest_path
            )
            
            anexos_arquivados.append({
                'tipo': 'original',
                'url_original': f"gs://{source_bucket}/{source_path}",
                'url_permanente': permanent_url,
                'filename': os.path.basename(source_path)
            })
    
    # Arquiva outros anexos (se houver)
    for idx, anexo_url in enumerate(anexos_urls):
        if anexo_url.startswith('gs://'):
            # Parse gs://bucket/path
            parts = anexo_url.replace('gs://', '').split('/', 1)
            if len(parts) == 2:
                source_bucket, source_path = parts
                filename = os.path.basename(source_path)
                dest_path = f"{archive_path}anexo_{idx}_{filename}"
                
                permanent_url = arquivar_anexo(
                    source_bucket,
                    source_path,
                    ARCHIVE_BUCKET,
                    dest_path
                )
                
                anexos_arquivados.append({
                    'tipo': 'anexo',
                    'url_original': anexo_url,
                    'url_permanente': permanent_url,
                    'filename': filename
                })
    
    logger.info(f"Arquivados {len(anexos_arquivados)} anexos")
    
    # 5. Atualiza Firestore com links permanentes
    update_data = {
        'archive': {
            'archive_path': archive_path,
            'archive_bucket': ARCHIVE_BUCKET,
            'anexos_arquivados': anexos_arquivados,
            'archived_at': datetime.utcnow().isoformat(),
            'archived': True
        }
    }
    
    firestore_client.update_oficio(org_id, oficio_id, update_data, user_id='system')
    
    # 6. Registra auditoria
    firestore_client.log_audit_event(
        user_id='system',
        org_id=org_id,
        action='ARCHIVED',
        target_id=oficio_id,
        details={
            'archive_path': archive_path,
            'num_anexos': len(anexos_arquivados)
        }
    )
    
    logger.info(f"Ofício {oficio_id} arquivado com sucesso em {archive_path}")
    
    return {
        'oficio_id': oficio_id,
        'org_id': org_id,
        'archive_path': archive_path,
        'anexos_arquivados': len(anexos_arquivados),
        'permanent_urls': [a['url_permanente'] for a in anexos_arquivados]
    }


def handle_pubsub_message(event: Dict[str, Any], context: Any) -> None:
    """
    Handler principal para mensagens Pub/Sub.
    
    Args:
        event: Dados do evento Pub/Sub
        context: Contexto da execução
    """
    try:
        # Decodifica mensagem
        if 'data' in event:
            message_data = json.loads(base64.b64decode(event['data']).decode('utf-8'))
        else:
            raise ValueError("Mensagem Pub/Sub sem campo 'data'")
        
        oficio_id = message_data.get('oficio_id')
        org_id = message_data.get('org_id')
        
        if not all([oficio_id, org_id]):
            raise ValueError(f"Mensagem com campos faltando: {message_data}")
        
        logger.info(f"Processando arquivamento: {oficio_id}")
        
        # Processa arquivamento
        result = processar_arquivamento(oficio_id, org_id)
        
        logger.info(f"Arquivamento concluído: {result}")
        
    except Exception as e:
        logger.error(f"Erro ao arquivar: {e}", exc_info=True)
        raise


# Entry point para Cloud Functions
def handle_archiving(event, context):
    """Entry point para Cloud Function (Pub/Sub Trigger)"""
    return handle_pubsub_message(event, context)





