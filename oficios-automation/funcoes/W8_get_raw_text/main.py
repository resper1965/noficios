"""
W8: Get Raw Text (LGPD Compliant Access)

Endpoint HTTP protegido que fornece acesso controlado ao raw_text armazenado
no bucket restrito, gerando URLs assinadas temporárias.

LGPD Compliance:
- Art. 37: Registro de todas as operações de acesso a dados pessoais
- Art. 46: Medidas de segurança técnicas (URLs assinadas temporárias)
- Art. 48: Comunicação de incidente de segurança (auditoria)

Acesso permitido apenas para:
- ROLE_ORG_ADMIN (da mesma org_id)
- Usuário atribuído ao ofício (assigned_user_id)
"""

import functions_framework
import os
import logging
from flask import jsonify, Request

# Importa módulos de utilidade
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.auth_rbac import rbac_required
from google.cloud import firestore, storage
from datetime import timedelta

# Configuração de logging
logging.basicConfig(level=logging.INFO)


@functions_framework.http
@rbac_required(allowed_roles=['ROLE_ORG_ADMIN', 'ROLE_USER'])
def get_raw_text_access(request: Request, auth_context=None):
    """
    Gera URL assinada temporária para acesso ao raw_text.
    
    Proteção LGPD:
    - Valida permissões (Org Admin ou usuário atribuído)
    - Gera URL válida por apenas 60 minutos
    - Registra acesso em AuditTrail (Art. 37)
    
    Query Params:
        oficio_id (str): ID do ofício
        
    Returns:
        JSON com signed_url temporária
    """
    try:
        # Extrai contexto de autenticação (injetado pelo decorador RBAC)
        if auth_context is None:
            return jsonify({'error': 'Contexto de autenticação ausente'}), 401
        user_id = auth_context.user_id
        org_id = auth_context.org_id
        role = auth_context.role
        
        # Extrai parâmetros
        oficio_id = request.args.get('oficio_id')
        
        if not oficio_id:
            return jsonify({
                'error': 'oficio_id é obrigatório'
            }), 400
        
        # Inicializa clientes nativos (evita dependência cruzada)
        db = firestore.Client()
        storage_client = storage.Client()
        
        # Busca ofício no Firestore
        oficio_doc = db.collection('oficios').document(oficio_id).get()
        
        if not oficio_doc.exists:
            return jsonify({
                'error': 'Ofício não encontrado'
            }), 404
        
        oficio_data = oficio_doc.to_dict()
        
        # ═══════════════════════════════════════════════════════════
        # VALIDAÇÃO DE ACESSO (LGPD - Princípio da Necessidade)
        # ═══════════════════════════════════════════════════════════
        
        # Verifica se o ofício pertence à mesma organização
        if oficio_data.get('org_id') != org_id:
            logging.warning(
                f"[LGPD] Tentativa de acesso cross-org bloqueada: "
                f"user={user_id}, oficio_org={oficio_data.get('org_id')}, user_org={org_id}"
            )
            return jsonify({
                'error': 'Acesso negado: ofício de outra organização'
            }), 403
        
        # Se não for ORG_ADMIN, verifica se é o usuário atribuído
        if role != 'ROLE_ORG_ADMIN':
            assigned_user = oficio_data.get('assigned_user_id')
            
            if assigned_user != user_id:
                logging.warning(
                    f"[LGPD] Acesso negado ao raw_text: "
                    f"user={user_id} não é assigned_user={assigned_user}"
                )
                return jsonify({
                    'error': 'Acesso negado: você não está atribuído a este ofício'
                }), 403
        
        # Obtém caminho do raw_text no bucket
        storage_path = oficio_data.get('raw_text_storage_path')
        
        if not storage_path:
            return jsonify({
                'error': 'Raw text não disponível para este ofício'
            }), 404
        
        # ═══════════════════════════════════════════════════════════
        # GERA URL ASSINADA TEMPORÁRIA (60 minutos)
        # ═══════════════════════════════════════════════════════════
        
        # Resolve bucket e path
        def _parse_storage_path(path: str):
            p = path.strip()
            if p.startswith('gs://'):
                p = p[5:]
            if '/' not in p:
                raise ValueError('storage_path inválido')
            bucket_name, blob_name = p.split('/', 1)
            return bucket_name, blob_name

        bucket_name, blob_name = _parse_storage_path(storage_path)
        blob = storage_client.bucket(bucket_name).blob(blob_name)
        signed_url = blob.generate_signed_url(
            version='v4',
            expiration=timedelta(minutes=60),
            method='GET'
        )
        
        # ═══════════════════════════════════════════════════════════
        # AUDITORIA (LGPD Art. 37)
        # ═══════════════════════════════════════════════════════════
        
        db.collection('audit_trail').add({
            'user_id': user_id,
            'org_id': org_id,
            'action': 'ACCESS_RAW_TEXT',
            'target_id': oficio_id,
            'details': {
                'role': role,
                'storage_path': storage_path,
                'url_expiration_minutes': 60,
                'lgpd_compliance': 'Art. 37 - Registro de operação'
            },
            'created_at': firestore.SERVER_TIMESTAMP
        })
        
        logging.info(
            f"[LGPD] Acesso ao raw_text concedido: "
            f"user={user_id}, oficio={oficio_id}, role={role}"
        )
        
        return jsonify({
            'oficio_id': oficio_id,
            'signed_url': signed_url,
            'expires_in_minutes': 60,
            'sha256': oficio_data.get('raw_text_sha256'),
            'preview': oficio_data.get('dados_extraidos', {}).get('raw_text_preview'),
            'lgpd_notice': 'Acesso registrado em AuditTrail (LGPD Art. 37). URL válida por 60 minutos.'
        }), 200
        
    except Exception as e:
        logging.error(f"Erro ao gerar acesso ao raw_text: {e}")
        return jsonify({
            'error': 'Erro interno ao processar requisição',
            'details': str(e)
        }), 500


@functions_framework.http
def healthcheck(request: Request):
    """Healthcheck endpoint."""
    return jsonify({'status': 'healthy', 'service': 'W8_get_raw_text_access'}), 200



