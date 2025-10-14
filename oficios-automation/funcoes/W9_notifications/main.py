"""
W9 Notifications: Registro de tokens FCM com auditoria (LGPD)
Cloud Function HTTP protegida por RBAC (verificação local) para registrar/revogar tokens Web Push.
"""
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from flask import Request
from google.cloud import firestore
import firebase_admin
from firebase_admin import auth as fb_auth, credentials as fb_credentials

# Inicializa Firebase Admin SDK com credenciais padrão do ambiente
try:
    firebase_admin.get_app()
except ValueError:
    cred = fb_credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

# Constantes de papeis
ROLE_PLATFORM_ADMIN = "platform_admin"
ROLE_ORG_ADMIN = "org_admin"
ROLE_USER = "user"


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv('GCP_PROJECT_ID')
db = firestore.Client(project=PROJECT_ID)


def _cors_headers(request: Request) -> Dict[str, str]:
    allowed_origins_raw = os.getenv(
        'ALLOWED_CORS_ORIGINS',
        'https://oficios-portal-frontend-491078993287.southamerica-east1.run.app'
    )
    # Suporta separadores vírgula/pipe/ponto-e-vírgula/espaço
    tokens: list[str] = []
    for sep in [',', ';', '|']:
        if sep in allowed_origins_raw:
            tokens = [t.strip() for t in allowed_origins_raw.split(sep) if t.strip()]
            break
    if not tokens:
        tokens = [t.strip() for t in allowed_origins_raw.split(' ') if t.strip()]
    if not tokens:
        tokens = [allowed_origins_raw.strip()]

    req_origin = (request.headers.get('Origin') or '').strip()
    origin = req_origin if req_origin in tokens else tokens[0]

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '3600',
    }


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get('Authorization', '')
    parts = auth_header.split(' ')
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise ValueError("Authorization inválido. Use 'Bearer <token>'")
    return parts[1]


def _verify_token_and_get_context(request: Request) -> Dict[str, Any]:
    token = _extract_bearer_token(request)
    decoded = fb_auth.verify_id_token(token)
    user_id = decoded.get('uid')
    org_id = decoded.get('org_id')
    role = decoded.get('role', ROLE_USER)
    if not user_id or not org_id:
        raise ValueError('Token sem uid/org_id')
    return {'user_id': user_id, 'org_id': org_id, 'role': role}


def _check_roles(role: str, allowed_roles: Tuple[str, ...]) -> None:
    if role not in allowed_roles:
        raise PermissionError(f"Role {role} sem permissão")


def handle_register_fcm_token(request: Request, context: Dict[str, Any]) -> Tuple[Dict[str, Any], int, Dict[str, str]]:
    """
    Registra/atualiza token FCM para o usuário autenticado dentro do seu org_id.
    - Método: POST (OPTIONS para preflight CORS)
    - Body JSON: { "fcm_token": "...", "user_agent": "..." }
    - Auditoria: ACTION = FCM_TOKEN_REGISTERED
    """
    headers = _cors_headers(request)

    if request.method == 'OPTIONS':
        return {}, 204, headers

    try:
        payload = request.get_json(silent=True) or {}
        fcm_token = (payload.get('fcm_token') or '').strip()
        user_agent = (payload.get('user_agent') or '').strip()

        if not fcm_token:
            return ({'error': 'fcm_token obrigatório'}, 400, headers)

        org_id = context['org_id']
        user_id = context['user_id']

        # Busca token existente para este org/token
        existing = list(
            db.collection('notification_tokens')
              .where('org_id', '==', org_id)
              .where('fcm_token', '==', fcm_token)
              .limit(1)
              .stream()
        )

        token_data = {
            'fcm_token': fcm_token,
            'user_id': user_id,
            'org_id': org_id,
            'user_agent': user_agent,
            'active': True,
            'updated_at': firestore.SERVER_TIMESTAMP,
        }

        if existing:
            doc_ref = existing[0].reference
            doc_ref.update(token_data)
            doc_id = doc_ref.id
            created = False
        else:
            token_data['created_at'] = firestore.SERVER_TIMESTAMP
            doc_ref = db.collection('notification_tokens').document()
            doc_ref.set(token_data)
            doc_id = doc_ref.id
            created = True

        # Auditoria direta (sem depender de utils/api_clients)
        audit_data = {
            'user_id': user_id,
            'org_id': org_id,
            'action': 'FCM_TOKEN_REGISTERED',
            'target_id': doc_id,
            'details': {'user_agent': user_agent, 'created': created},
            'timestamp': firestore.SERVER_TIMESTAMP,
            'created_at': datetime.utcnow().isoformat(),
        }
        db.collection('audit_trail').document().set(audit_data)

        return ({
            'status': 'success',
            'token_id': doc_id,
            'created': created,
        }, 200, headers)

    except Exception as e:
        logger.error(f"Erro ao registrar token FCM: {e}", exc_info=True)
        return ({'error': 'Erro interno', 'message': str(e)}, 500, headers)


# Entry point Cloud Function
def register_fcm_token(request: Request):
    headers = _cors_headers(request)
    if request.method == 'OPTIONS':
        return {}, 204, headers
    if request.method != 'POST':
        return {'error': 'Método não permitido. Use POST.'}, 405, headers

    try:
        ctx = _verify_token_and_get_context(request)
        _check_roles(ctx['role'], (ROLE_USER, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN))
    except PermissionError as e:
        return {'error': 'Acesso negado', 'message': str(e)}, 403, headers
    except Exception as e:
        return {'error': 'Autenticação falhou', 'message': str(e)}, 401, headers

    return handle_register_fcm_token(request, ctx)


