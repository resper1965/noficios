"""
W6: Simulador de Reextração - QA e Desenvolvimento
Cloud Function HTTP para simular ingestão e processamento de ofícios.
Responsabilidades: Facilitar testes, QA e desenvolvimento do frontend.
"""
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict

from flask import Request

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.auth_rbac import rbac_required, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, AuthContext
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


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=False,
    resource_org_id_param='org_id'
)
def handle_simulation(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Handler HTTP para simulação de ingestão de ofício.
    
    Payload esperado:
    {
        "org_id": "org123",
        "target_domain": "empresa.com.br",
        "raw_text": "OFÍCIO N° 123/2024...",
        "simulation_name": "Teste Bloqueio Judicial",
        "llm_prompt_version": "v1.2.0"  # Opcional
    }
    
    Args:
        request: Request HTTP do Flask
        auth_context: Contexto de autenticação injetado pelo decorator
        
    Returns:
        Tupla (response_dict, status_code)
    """
    try:
        logger.info(f"Simulação iniciada por usuário {auth_context.user_id}")
        
        # 1. Parse do payload
        payload = request.get_json(silent=True)
        
        if not payload:
            return {'error': 'Payload JSON inválido'}, 400
        
        org_id = payload.get('org_id')
        target_domain = payload.get('target_domain')
        raw_text = payload.get('raw_text')
        simulation_name = payload.get('simulation_name', 'Simulação Manual')
        llm_prompt_version = payload.get('llm_prompt_version')
        
        if not all([org_id, target_domain, raw_text]):
            return {
                'error': 'Campos obrigatórios: org_id, target_domain, raw_text'
            }, 400
        
        # 2. Valida que o org_id do payload corresponde ao do usuário
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {
                'error': 'Você só pode simular para sua própria organização'
            }, 403
        
        # 3. Valida o domínio e resolve organização
        org_data = firestore_client.get_organization_by_domain(target_domain)
        
        if not org_data:
            return {
                'error': f'Organização não encontrada para o domínio: {target_domain}',
                'message': 'Cadastre o domínio na organização antes de simular'
            }, 404
        
        resolved_org_id = org_data['org_id']
        org_name = org_data.get('name', 'Unknown')
        
        # Verifica se org_id corresponde ao resolvido
        if org_id != resolved_org_id:
            return {
                'error': f'Conflito: org_id fornecido ({org_id}) não corresponde ao resolvido ({resolved_org_id}) para o domínio {target_domain}'
            }, 400
        
        logger.info(f"Simulação para organização: {org_name} (ID: {org_id})")
        logger.info(f"Nome da simulação: {simulation_name}")
        logger.info(f"Tamanho do texto: {len(raw_text)} caracteres")
        
        # 4. Cria registro de simulação no Firestore
        simulation_id = f"SIM_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{auth_context.user_id[:8]}"
        
        oficio_data = {
            'org_id': org_id,
            'thread_id': f'simulation_{simulation_id}',
            'message_id': f'sim_msg_{simulation_id}',
            'status': OficioStatus.AGUARDANDO_PROCESSAMENTO.value,
            'is_simulation': True,  # Marca como simulação
            'simulation_metadata': {
                'simulation_id': simulation_id,
                'simulation_name': simulation_name,
                'simulated_by': auth_context.user_id,
                'simulated_at': datetime.utcnow().isoformat(),
                'target_domain': target_domain
            },
            'conteudo_bruto': raw_text,
            'arquivo_original': {
                'bucket': 'simulation',
                'path': f'simulations/{simulation_id}.txt',
                'size': len(raw_text),
                'content_type': 'text/plain'
            },
            'metadata': {
                'source': 'simulation',
                'ingestion_timestamp': datetime.utcnow().isoformat()
            },
            'audit_trail': [{
                'user_id': auth_context.user_id,
                'timestamp': datetime.utcnow().isoformat(),
                'action': 'simulation_created',
                'target_id': simulation_id
            }]
        }
        
        # Adiciona versão do prompt se fornecida
        if llm_prompt_version:
            oficio_data['llm_prompt_version_override'] = llm_prompt_version
        
        # Registra ofício de simulação
        oficio_id = firestore_client.create_oficio(org_id, oficio_data)
        logger.info(f"Simulação registrada: {oficio_id}")
        
        # 5. Publica mensagem no Pub/Sub para processamento
        message_data = {
            'oficio_id': oficio_id,
            'org_id': org_id,
            'bucket': 'simulation',
            'file_path': f'simulations/{simulation_id}.txt',
            'thread_id': f'simulation_{simulation_id}',
            'message_id': f'sim_msg_{simulation_id}',
            'is_simulation': True,  # Flag crítico para processamento
            'simulation_id': simulation_id,
            'simulation_name': simulation_name,
            'simulated_by': auth_context.user_id
        }
        
        if llm_prompt_version:
            message_data['llm_prompt_version_override'] = llm_prompt_version
        
        # Publica no Pub/Sub
        pubsub_message_id = pubsub_client.publish_message(PUBSUB_TOPIC, message_data)
        logger.info(f"Simulação publicada no Pub/Sub: {pubsub_message_id}")
        
        # 6. Resposta de sucesso
        response = {
            'status': 'success',
            'simulation_id': simulation_id,
            'oficio_id': oficio_id,
            'org_id': org_id,
            'org_name': org_name,
            'target_domain': target_domain,
            'simulation_name': simulation_name,
            'pubsub_message_id': pubsub_message_id,
            'simulated_by': auth_context.user_id,
            'message': 'Simulação criada e enviada para processamento',
            'next_steps': [
                'Aguarde ~30-60 segundos para processamento',
                f'Consulte o status em GET /oficios/{oficio_id}',
                'Logs com tag [SIMULATION] disponíveis no Cloud Logging'
            ]
        }
        
        logger.info(f"Simulação concluída: {simulation_id}")
        
        return response, 201
        
    except Exception as e:
        logger.error(f"Erro ao processar simulação: {e}", exc_info=True)
        return {
            'error': 'Erro ao processar simulação',
            'message': str(e)
        }, 500


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=True  # Platform Admin pode listar todas
)
def handle_list_simulations(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Lista simulações da organização.
    
    Query params:
    - org_id: ID da organização (obrigatório se Platform Admin)
    - limit: Número de resultados (padrão: 20)
    
    Args:
        request: Request HTTP
        auth_context: Contexto de autenticação
        
    Returns:
        Lista de simulações
    """
    try:
        # Obtém org_id
        org_id = request.args.get('org_id')
        
        # Se não for Platform Admin, usa org_id do token
        if not auth_context.is_platform_admin():
            org_id = auth_context.org_id
        
        if not org_id:
            return {
                'error': 'Parâmetro org_id obrigatório para Platform Admin'
            }, 400
        
        # Validação de acesso cross-org
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {
                'error': 'Acesso negado a simulações de outra organização'
            }, 403
        
        limit = int(request.args.get('limit', 20))
        
        # Busca simulações no Firestore
        from google.cloud import firestore
        db = firestore.Client(project=PROJECT_ID)
        
        query = db.collection('oficios') \
            .where('org_id', '==', org_id) \
            .where('is_simulation', '==', True) \
            .limit(limit) \
            .order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Monta resultado
        simulations = []
        for doc in query.stream():
            sim_data = doc.to_dict()
            simulations.append({
                'oficio_id': doc.id,
                'simulation_id': sim_data.get('simulation_metadata', {}).get('simulation_id'),
                'simulation_name': sim_data.get('simulation_metadata', {}).get('simulation_name'),
                'status': sim_data.get('status'),
                'simulated_by': sim_data.get('simulation_metadata', {}).get('simulated_by'),
                'simulated_at': sim_data.get('simulation_metadata', {}).get('simulated_at'),
                'created_at': sim_data.get('created_at'),
                'llm_prompt_version': sim_data.get('llm_prompt_version')
            })
        
        logger.info(f"Listadas {len(simulations)} simulações para org {org_id}")
        
        return {
            'status': 'success',
            'org_id': org_id,
            'count': len(simulations),
            'simulations': simulations
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao listar simulações: {e}", exc_info=True)
        return {
            'error': 'Erro ao listar simulações',
            'message': str(e)
        }, 500


# Entry points para Cloud Functions
def simulate_ingestion(request: Request):
    """Entry point para Cloud Function HTTP (POST)"""
    if request.method == 'POST':
        return handle_simulation(request)
    else:
        return {'error': 'Método não permitido. Use POST.'}, 405


def list_simulations(request: Request):
    """Entry point para Cloud Function HTTP (GET)"""
    if request.method == 'GET':
        return handle_list_simulations(request)
    else:
        return {'error': 'Método não permitido. Use GET.'}, 405





