"""
W7 Admin: Governança e Administração da Plataforma
Cloud Function HTTP para gestão de organizações e configurações.
Responsabilidades: Cadastro de tenants, configuração, métricas.
"""
import json
import logging
import os
import re
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from flask import Request
from google.cloud import firestore, secretmanager

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.auth_rbac import (
    rbac_required, 
    ROLE_ORG_ADMIN, 
    ROLE_PLATFORM_ADMIN, 
    ROLE_USER,
    AuthContext
)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')

# Clientes
db = firestore.Client(project=PROJECT_ID)
secret_client = secretmanager.SecretManagerServiceClient()


def validar_dominio(domain: str) -> bool:
    """Valida formato de domínio"""
    pattern = r'^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, domain))


@rbac_required(
    allowed_roles=[ROLE_PLATFORM_ADMIN],
    allow_cross_org=True
)
def handle_create_organization(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Cria uma nova organização (tenant).
    
    Payload:
    {
        "name": "Empresa XYZ Ltda",
        "email_domains": ["xyz.com.br", "xyz.com"],
        "admin_email": "admin@xyz.com.br",
        "notification_email": "compliance@xyz.com.br",
        "config_llm_model": "llama-3.1-8b-instant"
    }
    """
    try:
        logger.info(f"Criação de organização iniciada por {auth_context.user_id}")
        
        payload = request.get_json(silent=True)
        
        if not payload:
            return {'error': 'Payload JSON inválido'}, 400
        
        # Campos obrigatórios
        name = payload.get('name')
        email_domains = payload.get('email_domains', [])
        admin_email = payload.get('admin_email')
        
        if not all([name, email_domains, admin_email]):
            return {
                'error': 'Campos obrigatórios: name, email_domains, admin_email'
            }, 400
        
        # Valida domínios
        for domain in email_domains:
            if not validar_dominio(domain):
                return {'error': f'Domínio inválido: {domain}'}, 400
        
        # Verifica se domínios já existem
        for domain in email_domains:
            existing = db.collection('organizations').where(
                'email_domains', 'array_contains', domain
            ).limit(1).get()
            
            if existing:
                return {
                    'error': f'Domínio {domain} já cadastrado em outra organização'
                }, 409
        
        logger.info(f"Criando organização: {name}")
        logger.info(f"Domínios: {email_domains}")
        
        # Cria organização
        org_data = {
            'name': name,
            'email_domains': email_domains,
            'admin_email': admin_email,
            'notification_email': payload.get('notification_email', admin_email),
            'settings': {
                'auto_process': True,
                'require_compliance_approval': True,
                'config_llm_model': payload.get('config_llm_model', 'llama-3.1-8b-instant'),
                'notification_enabled': True
            },
            'billing': {
                'llm_tokens_consumed': 0,
                'oficios_processed': 0,
                'storage_bytes': 0
            },
            'created_at': firestore.SERVER_TIMESTAMP,
            'created_by': auth_context.user_id,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'active': True
        }
        
        # Salva no Firestore
        org_ref = db.collection('organizations').document()
        org_ref.set(org_data)
        
        org_id = org_ref.id
        
        logger.info(f"Organização criada: {org_id}")
        
        # Response
        return {
            'status': 'success',
            'org_id': org_id,
            'name': name,
            'email_domains': email_domains,
            'admin_email': admin_email,
            'message': f'Organização {name} criada com sucesso',
            'next_steps': [
                f'Criar usuário admin com custom claim: org_id={org_id}',
                'Popular base de conhecimento via W7',
                'Configurar integração de email'
            ]
        }, 201
        
    except Exception as e:
        logger.error(f"Erro ao criar organização: {e}", exc_info=True)
        return {
            'error': 'Erro ao criar organização',
            'message': str(e)
        }, 500


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=True
)
def handle_update_organization(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Atualiza configurações de uma organização.
    
    Payload:
    {
        "org_id": "org123",
        "notification_email": "novo@empresa.com",
        "config_llm_model": "gpt-4o-mini",
        "settings": { ... }
    }
    """
    try:
        payload = request.get_json(silent=True)
        
        if not payload:
            return {'error': 'Payload JSON inválido'}, 400
        
        org_id = payload.get('org_id')
        
        if not org_id:
            return {'error': 'Campo org_id obrigatório'}, 400
        
        # Validação de acesso
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {
                'error': 'Acesso negado: você só pode atualizar sua própria organização'
            }, 403
        
        # Busca organização
        org_ref = db.collection('organizations').document(org_id)
        org_doc = org_ref.get()
        
        if not org_doc.exists:
            return {'error': f'Organização {org_id} não encontrada'}, 404
        
        # Prepara update
        update_data = {
            'updated_at': firestore.SERVER_TIMESTAMP,
            'updated_by': auth_context.user_id
        }
        
        # Campos permitidos
        if 'notification_email' in payload:
            update_data['notification_email'] = payload['notification_email']
        
        if 'config_llm_model' in payload:
            update_data['settings.config_llm_model'] = payload['config_llm_model']
        
        if 'settings' in payload:
            for key, value in payload['settings'].items():
                update_data[f'settings.{key}'] = value
        
        # Atualiza
        org_ref.update(update_data)
        
        logger.info(f"Organização {org_id} atualizada por {auth_context.user_id}")
        
        return {
            'status': 'success',
            'org_id': org_id,
            'updated_fields': list(update_data.keys()),
            'message': 'Organização atualizada com sucesso'
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao atualizar organização: {e}", exc_info=True)
        return {
            'error': 'Erro ao atualizar organização',
            'message': str(e)
        }, 500


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=True
)
def handle_get_metrics(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Retorna métricas e observabilidade.
    
    Query params:
    - org_id: ID da organização (obrigatório se Platform Admin)
    - period: Período (7d, 30d, 90d)
    """
    try:
        # Obtém org_id
        org_id = request.args.get('org_id')
        
        if not auth_context.is_platform_admin():
            org_id = auth_context.org_id
        
        if not org_id:
            return {'error': 'Parâmetro org_id obrigatório'}, 400
        
        # Validação de acesso
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {'error': 'Acesso negado'}, 403
        
        period = request.args.get('period', '30d')
        
        # Calcula data de início
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(period, 30)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        logger.info(f"Buscando métricas para org {org_id}, período: {period}")
        
        # Busca ofícios do período
        oficios_query = db.collection('oficios') \
            .where('org_id', '==', org_id) \
            .where('created_at', '>=', start_date) \
            .stream()
        
        # Calcula métricas
        total_oficios = 0
        respondidos = 0
        dentro_prazo = 0
        total_confianca = 0
        por_status = {}
        por_prioridade = {}
        por_prompt_version = {}
        com_responsavel = 0
        tempo_processamento_total = 0
        
        for doc in oficios_query:
            oficio = doc.to_dict()
            total_oficios += 1
            
            status = oficio.get('status', 'UNKNOWN')
            por_status[status] = por_status.get(status, 0) + 1
            
            prioridade = oficio.get('prioridade', 'UNKNOWN')
            por_prioridade[prioridade] = por_prioridade.get(prioridade, 0) + 1
            
            llm_version = oficio.get('llm_prompt_version', 'unknown')
            por_prompt_version[llm_version] = por_prompt_version.get(llm_version, 0) + 1
            
            if oficio.get('assigned_user_id'):
                com_responsavel += 1
            
            if status == 'RESPONDIDO':
                respondidos += 1
                
                # Verifica SLA
                data_limite = oficio.get('data_limite')
                respondido_em = oficio.get('respondido_em')
                
                if data_limite and respondido_em:
                    if respondido_em <= data_limite:
                        dentro_prazo += 1
            
            # Confiança
            confianca = oficio.get('confianca_extracao', 0)
            total_confianca += confianca
            
            # Tempo de processamento
            created_at = oficio.get('created_at')
            processado_em = oficio.get('processamento_completo_em')
            
            if created_at and processado_em:
                try:
                    if isinstance(created_at, str):
                        created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    else:
                        created_dt = created_at
                    
                    if isinstance(processado_em, str):
                        processado_dt = datetime.fromisoformat(processado_em.replace('Z', '+00:00'))
                    else:
                        processado_dt = processado_em
                    
                    tempo_seg = (processado_dt - created_dt).total_seconds()
                    tempo_processamento_total += tempo_seg
                except:
                    pass
        
        # Calcula médias
        avg_confianca = total_confianca / total_oficios if total_oficios > 0 else 0
        avg_tempo_processamento = tempo_processamento_total / total_oficios if total_oficios > 0 else 0
        sla_percent = (dentro_prazo / respondidos * 100) if respondidos > 0 else 0
        taxa_atribuicao = (com_responsavel / total_oficios * 100) if total_oficios > 0 else 0
        
        # Busca dados de billing da organização
        org_doc = db.collection('organizations').document(org_id).get()
        billing_data = {}
        
        if org_doc.exists:
            org_data = org_doc.to_dict()
            billing_data = org_data.get('billing', {})
        
        # Monta resposta
        metrics = {
            'org_id': org_id,
            'period': period,
            'period_days': days,
            'start_date': start_date.isoformat(),
            
            # KPIs Principais
            'kpis': {
                'total_oficios': total_oficios,
                'taxa_resposta': (respondidos / total_oficios * 100) if total_oficios > 0 else 0,
                'sla_atingido_percent': round(sla_percent, 2),
                'confianca_media_llm': round(avg_confianca, 3),
                'tempo_medio_processamento_seg': round(avg_tempo_processamento, 2),
                'taxa_atribuicao_percent': round(taxa_atribuicao, 2)
            },
            
            # Distribuições
            'por_status': por_status,
            'por_prioridade': por_prioridade,
            'por_prompt_version': por_prompt_version,
            
            # Billing
            'billing': {
                'llm_tokens_consumed': billing_data.get('llm_tokens_consumed', 0),
                'oficios_processed': billing_data.get('oficios_processed', 0),
                'storage_bytes': billing_data.get('storage_bytes', 0),
                'estimated_cost_usd': billing_data.get('estimated_cost_usd', 0)
            }
        }
        
        logger.info(f"Métricas geradas para org {org_id}: {total_oficios} ofícios")
        
        return {
            'status': 'success',
            'metrics': metrics
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar métricas: {e}", exc_info=True)
        return {
            'error': 'Erro ao buscar métricas',
            'message': str(e)
        }, 500


@rbac_required(
    allowed_roles=[ROLE_PLATFORM_ADMIN],
    allow_cross_org=True
)
def handle_list_organizations(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Lista todas as organizações (Platform Admin).
    
    Query params:
    - active: true/false (filtrar por ativas)
    - limit: Número de resultados (padrão: 100)
    """
    try:
        active_filter = request.args.get('active', 'true').lower() == 'true'
        limit = int(request.args.get('limit', 100))
        
        query = db.collection('organizations')
        
        if active_filter is not None:
            query = query.where('active', '==', active_filter)
        
        query = query.limit(limit).order_by('created_at', direction=firestore.Query.DESCENDING)
        
        organizations = []
        
        for doc in query.stream():
            org_data = doc.to_dict()
            org_data['org_id'] = doc.id
            
            # Remove dados sensíveis
            org_data.pop('secrets', None)
            
            organizations.append(org_data)
        
        logger.info(f"Listadas {len(organizations)} organizações")
        
        return {
            'status': 'success',
            'count': len(organizations),
            'organizations': organizations
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao listar organizações: {e}", exc_info=True)
        return {
            'error': 'Erro ao listar organizações',
            'message': str(e)
        }, 500


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=True
)
def handle_get_audit_trail(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Retorna trilha de auditoria.
    
    Query params:
    - org_id: ID da organização
    - target_id: Filtrar por ID específico (opcional)
    - limit: Número de resultados (padrão: 100)
    """
    try:
        org_id = request.args.get('org_id')
        
        if not auth_context.is_platform_admin():
            org_id = auth_context.org_id
        
        if not org_id:
            return {'error': 'Parâmetro org_id obrigatório'}, 400
        
        # Validação de acesso
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {'error': 'Acesso negado'}, 403
        
        target_id = request.args.get('target_id')
        limit = int(request.args.get('limit', 100))
        
        # Busca ofícios com auditoria
        query = db.collection('oficios').where('org_id', '==', org_id)
        
        if target_id:
            query = query.where('oficio_id', '==', target_id)
        
        query = query.limit(limit).order_by('updated_at', direction=firestore.Query.DESCENDING)
        
        audit_records = []
        
        for doc in query.stream():
            oficio = doc.to_dict()
            audit_trail = oficio.get('audit_trail', [])
            
            for entry in audit_trail:
                audit_records.append({
                    'oficio_id': doc.id,
                    'user_id': entry.get('user_id'),
                    'timestamp': entry.get('timestamp'),
                    'action': entry.get('action'),
                    'target_id': entry.get('target_id', doc.id),
                    'details': entry.get('details')
                })
        
        # Ordena por timestamp
        audit_records.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return {
            'status': 'success',
            'org_id': org_id,
            'count': len(audit_records),
            'audit_trail': audit_records[:limit]
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar auditoria: {e}", exc_info=True)
        return {
            'error': 'Erro ao buscar auditoria',
            'message': str(e)
        }, 500


# Entry points para Cloud Functions
def create_organization(request: Request):
    """POST /admin/organizations"""
    if request.method == 'POST':
        return handle_create_organization(request)
    else:
        return {'error': 'Método não permitido. Use POST.'}, 405


def update_organization(request: Request):
    """PATCH /admin/organizations/:id"""
    if request.method in ['PATCH', 'PUT']:
        return handle_update_organization(request)
    else:
        return {'error': 'Método não permitido. Use PATCH.'}, 405


def list_organizations(request: Request):
    """GET /admin/organizations"""
    if request.method == 'GET':
        return handle_list_organizations(request)
    else:
        return {'error': 'Método não permitido. Use GET.'}, 405


def get_metrics(request: Request):
    """GET /admin/metrics"""
    if request.method == 'GET':
        return handle_get_metrics(request)
    else:
        return {'error': 'Método não permitido. Use GET.'}, 405


def get_audit_trail(request: Request):
    """GET /admin/audit"""
    if request.method == 'GET':
        return handle_get_audit_trail(request)
    else:
        return {'error': 'Método não permitido. Use GET.'}, 405





