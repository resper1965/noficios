"""
W3: Webhook Update - Coleta de Referência Interna
Cloud Function HTTP para atualização de status e injeção de dados de apoio do compliance.
Responsabilidades: Receber updates externos, validar RBAC, enriquecer contexto.
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

from utils.api_clients import FirestoreClient, PubSubClient
from utils.auth_rbac import rbac_required, ROLE_ORG_ADMIN, ROLE_USER, AuthContext
from utils.schema import OficioStatus

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
PUBSUB_TOPIC_RESPOSTA = os.getenv('PUBSUB_TOPIC_RESPOSTA', 'resposta_pronta')

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
pubsub_client = PubSubClient(project_id=PROJECT_ID)


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_USER],
    allow_cross_org=False,
    resource_org_id_param='org_id'
)
def handle_webhook_update(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Handler HTTP para webhook de atualização de ofício.
    
    Payload esperado:
    {
        "org_id": "org123",
        "oficio_id": "oficio789",
        "action": "approve_compliance" | "reject_compliance" | "add_context" | "assign_user",
        "dados_de_apoio_compliance": "Texto livre com informações adicionais...",
        "notas_internas": "Observações do analista...",
        "referencias_legais": ["Art. 5º da Lei 105/2001", ...],
        "assigned_user_id": "user456"  # Novo: Atribuição de responsável
    }
    
    Args:
        request: Request HTTP do Flask
        auth_context: Contexto de autenticação injetado pelo decorator
        
    Returns:
        Tupla (response_dict, status_code)
    """
    try:
        logger.info(f"Webhook update recebido de usuário {auth_context.user_id}")
        
        # 1. Parse do payload
        payload = request.get_json(silent=True)
        
        if not payload:
            return {'error': 'Payload JSON inválido'}, 400
        
        org_id = payload.get('org_id')
        oficio_id = payload.get('oficio_id')
        action = payload.get('action')
        
        if not all([org_id, oficio_id, action]):
            return {
                'error': 'Campos obrigatórios: org_id, oficio_id, action'
            }, 400
        
        logger.info(f"Processando action '{action}' para ofício {oficio_id}")
        
        # 2. Verifica se ofício existe e pertence à organização
        oficio = firestore_client.get_oficio(org_id, oficio_id)
        
        if not oficio:
            return {
                'error': f'Ofício {oficio_id} não encontrado para organização {org_id}'
            }, 404
        
        # 3. Processa a ação
        update_data = {
            'updated_at': datetime.utcnow().isoformat(),
            'last_updated_by': auth_context.user_id
        }
        
        # Adiciona trilha de auditoria
        audit_entry = {
            'user_id': auth_context.user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'action': action
        }
        
        if action == 'approve_compliance':
            # Compliance aprovou, pode compor resposta
            update_data['status'] = OficioStatus.APROVADO_COMPLIANCE.value
            update_data['aprovado_em'] = datetime.utcnow().isoformat()
            update_data['aprovado_por'] = auth_context.user_id
            
            # Injeta dados de apoio se fornecidos
            dados_apoio = payload.get('dados_de_apoio_compliance')
            if dados_apoio:
                update_data['dados_de_apoio_compliance'] = dados_apoio
                logger.info(f"Dados de apoio adicionados ({len(dados_apoio)} chars)")
            
            # Notas internas
            notas = payload.get('notas_internas')
            if notas:
                update_data['notas_internas'] = notas
            
            # Referências legais
            referencias = payload.get('referencias_legais')
            if referencias:
                update_data['referencias_legais'] = referencias
            
            # Publica no Pub/Sub para disparar W4 (composição)
            pubsub_message = {
                'oficio_id': oficio_id,
                'org_id': org_id,
                'action': 'compose_response',
                'triggered_by': auth_context.user_id
            }
            
            message_id = pubsub_client.publish_message(PUBSUB_TOPIC_RESPOSTA, pubsub_message)
            logger.info(f"Mensagem publicada no Pub/Sub para composição: {message_id}")
            
            update_data['pubsub_message_id'] = message_id
            
        elif action == 'reject_compliance':
            # Compliance rejeitou
            update_data['status'] = OficioStatus.REPROVADO_COMPLIANCE.value
            update_data['rejeitado_em'] = datetime.utcnow().isoformat()
            update_data['rejeitado_por'] = auth_context.user_id
            update_data['motivo_rejeicao'] = payload.get('motivo', 'Não especificado')
            
        elif action == 'add_context':
            # Adiciona contexto sem mudar status
            dados_apoio = payload.get('dados_de_apoio_compliance')
            if dados_apoio:
                # Acumula contexto se já existir
                contexto_existente = oficio.get('dados_de_apoio_compliance', '')
                if contexto_existente:
                    update_data['dados_de_apoio_compliance'] = f"{contexto_existente}\n\n---\n\n{dados_apoio}"
                else:
                    update_data['dados_de_apoio_compliance'] = dados_apoio
            
            notas = payload.get('notas_internas')
            if notas:
                update_data['notas_internas'] = notas
            
            referencias = payload.get('referencias_legais')
            if referencias:
                # Acumula referências
                refs_existentes = oficio.get('referencias_legais', [])
                update_data['referencias_legais'] = list(set(refs_existentes + referencias))
        
        elif action == 'assign_user':
            # Atribui ofício a um usuário
            assigned_user_id = payload.get('assigned_user_id')
            
            if not assigned_user_id:
                return {'error': "Campo 'assigned_user_id' obrigatório para action 'assign_user'"}, 400
            
            # Registra atribuição anterior para auditoria
            previous_user = oficio.get('assigned_user_id', 'Nenhum')
            
            update_data['assigned_user_id'] = assigned_user_id
            update_data['assigned_at'] = datetime.utcnow().isoformat()
            update_data['assigned_by'] = auth_context.user_id
            
            # Auditoria detalhada de atribuição
            audit_entry['action'] = f'assign_user'
            audit_entry['details'] = {
                'previous_user': previous_user,
                'new_user': assigned_user_id,
                'assigned_by': auth_context.user_id
            }
            
            logger.info(f"Ofício {oficio_id} atribuído de '{previous_user}' para '{assigned_user_id}' por {auth_context.user_id}")
        
        else:
            return {'error': f"Action '{action}' não reconhecida"}, 400
        
        # Atribuição genérica (pode ser feita em qualquer action)
        # Se assigned_user_id vier no payload (mas não for action assign_user)
        if action != 'assign_user' and 'assigned_user_id' in payload:
            assigned_user_id = payload.get('assigned_user_id')
            if assigned_user_id:
                previous_user = oficio.get('assigned_user_id', 'Nenhum')
                update_data['assigned_user_id'] = assigned_user_id
                update_data['assigned_at'] = datetime.utcnow().isoformat()
                update_data['assigned_by'] = auth_context.user_id
                
                logger.info(f"Ofício {oficio_id} atribuído a '{assigned_user_id}' durante action '{action}'")
        
        # 4. Atualiza no Firestore
        firestore_client.update_oficio(
            org_id, 
            oficio_id, 
            update_data, 
            user_id=auth_context.user_id
        )
        
        logger.info(f"Ofício {oficio_id} atualizado com sucesso")
        
        # 5. Resposta
        response = {
            'status': 'success',
            'oficio_id': oficio_id,
            'org_id': org_id,
            'action': action,
            'updated_by': auth_context.user_id,
            'new_status': update_data.get('status', oficio.get('status')),
            'message': f'Ação {action} executada com sucesso'
        }
        
        if 'pubsub_message_id' in update_data:
            response['pubsub_message_id'] = update_data['pubsub_message_id']
        
        return response, 200
        
    except PermissionError as e:
        logger.error(f"Erro de permissão: {e}")
        return {'error': 'Acesso negado', 'message': str(e)}, 403
        
    except Exception as e:
        logger.error(f"Erro ao processar webhook: {e}", exc_info=True)
        return {
            'error': 'Erro interno',
            'message': f'Erro ao processar webhook: {str(e)}'
        }, 500


# Entry point para Cloud Functions (HTTP)
def webhook_update(request: Request):
    """Entry point para Cloud Function HTTP"""
    return handle_webhook_update(request)

