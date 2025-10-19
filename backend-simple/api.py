#!/usr/bin/env python3
"""
Backend Python Flask - n.Oficios
API simplificada para rodar na VPS

Endpoints:
- GET  /health - Health check
- POST /gmail/ingest - Processar emails do Gmail (W0)
- POST /process/oficio - Processar ofício (W1)

Autor: BMad Master
Data: 2025-10-18
"""

from flask import Flask, request, jsonify, abort
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import os
import logging
import re
from datetime import datetime
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configuração
GMAIL_SA_FILE = os.getenv('GMAIL_SA_JSON_FILE', '/app/gmail-sa-key.json')
EMAILS_DIR = os.getenv('EMAILS_DIR', '/data/emails')


def load_service_account():
    """Carregar Service Account do arquivo"""
    try:
        if not os.path.exists(GMAIL_SA_FILE):
            raise FileNotFoundError(f'Service Account file not found: {GMAIL_SA_FILE}')
        
        with open(GMAIL_SA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f'Failed to load service account: {e}')
        raise


def create_gmail_service(delegated_email: str):
    """Criar serviço Gmail com delegação"""
    try:
        sa_info = load_service_account()
        
        credentials = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=['https://www.googleapis.com/auth/gmail.readonly']
        )
        
        delegated_credentials = credentials.with_subject(delegated_email)
        
        return build('gmail', 'v1', credentials=delegated_credentials, cache_discovery=False)
    except Exception as e:
        logger.error(f'Failed to create Gmail service: {e}')
        raise


def save_attachment_local(file_path: str, data: bytes):
    """Salvar anexo localmente"""
    try:
        # Criar diretórios necessários
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Salvar arquivo
        with open(file_path, 'wb') as f:
            f.write(data)
        
        logger.info(f'Attachment saved: {file_path} ({len(data)} bytes)')
        return True
    except Exception as e:
        logger.error(f'Failed to save attachment: {e}')
        return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'n-oficios-backend-python',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


def validate_email(email: str) -> str:
    """Validate email format"""
    if not email:
        abort(400, description='Email is required')
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        abort(400, description='Invalid email format')
    
    return email.lower()


def validate_label(label: str) -> str:
    """Validate Gmail label"""
    if not label:
        abort(400, description='Label is required')
    
    if len(label) > 50:
        abort(400, description='Label too long (max 50 characters)')
    
    if not re.match(r'^[A-Z_]+$', label):
        abort(400, description='Label must be uppercase letters and underscores only')
    
    return label


def sanitize_log_data(data: dict) -> dict:
    """Remove sensitive data from logs"""
    sensitive_keys = ['password', 'token', 'secret', 'key', 'credential', 'auth']
    sanitized = {}
    
    for key, value in data.items():
        if any(s in key.lower() for s in sensitive_keys):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value
    
    return sanitized


@app.route('/gmail/ingest', methods=['POST'])
@limiter.limit("10 per minute")
def gmail_ingest():
    """
    Processar emails do Gmail com label INGEST
    
    Request:
    {
        "email": "resper@ness.com.br",
        "label": "INGEST",
        "query": "optional custom query"
    }
    
    Response:
    {
        "status": "ok",
        "scanned": 5,
        "processed": 3,
        "email": "resper@ness.com.br",
        "label": "INGEST"
    }
    """
    try:
        data = request.get_json() or {}
        
        # Validate inputs
        email = validate_email(data.get('email', 'resper@ness.com.br'))
        label = validate_label(data.get('label', 'INGEST'))
        custom_query = data.get('query')
        
        # Sanitize log data
        log_data = sanitize_log_data({'email': email, 'label': label})
        logger.info(f'Gmail ingest started', extra=log_data)
        
        # Criar serviço Gmail
        gmail = create_gmail_service(email)
        
        # Construir query
        if custom_query:
            query = custom_query
        else:
            query = f'label:{label} has:attachment newer_than:7d'
        
        logger.info(f'Gmail query: {query}')
        
        # Buscar mensagens
        results = gmail.users().messages().list(
            userId='me',
            q=query,
            maxResults=50
        ).execute()
        
        messages = results.get('messages', [])
        logger.info(f'Found {len(messages)} messages')
        
        if not messages:
            return jsonify({
                'status': 'ok',
                'scanned': 0,
                'processed': 0,
                'email': email,
                'label': label,
                'message': 'No messages found with specified criteria'
            }), 200
        
        # Processar cada mensagem
        processed_count = 0
        attachments_saved = []
        
        for msg_ref in messages:
            try:
                msg_id = msg_ref['id']
                
                # Obter mensagem completa
                message = gmail.users().messages().get(
                    userId='me',
                    id=msg_id,
                    format='full'
                ).execute()
                
                # Extrair informações
                payload = message.get('payload', {})
                headers = payload.get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                thread_id = message.get('threadId', msg_id)
                
                logger.info(f'Processing message: {subject} ({msg_id})')
                
                # Processar anexos
                parts = []
                stack = [payload]
                while stack:
                    part = stack.pop()
                    if 'parts' in part:
                        stack.extend(part['parts'])
                    else:
                        parts.append(part)
                
                # Salvar anexos
                for part in parts:
                    filename = part.get('filename', '')
                    if not filename:
                        continue
                    
                    body = part.get('body', {})
                    attachment_id = body.get('attachmentId')
                    
                    if attachment_id:
                        # Baixar anexo
                        attachment = gmail.users().messages().attachments().get(
                            userId='me',
                            messageId=msg_id,
                            id=attachment_id
                        ).execute()
                        
                        import base64
                        file_data = base64.urlsafe_b64decode(attachment['data'])
                        
                        # Salvar localmente
                        date_prefix = datetime.utcnow().strftime('%Y%m%d')
                        safe_filename = "".join(c for c in filename if c.isalnum() or c in ('-', '_', '.', ' ')).strip()
                        file_path = os.path.join(
                            EMAILS_DIR,
                            'ness.com.br',
                            thread_id,
                            f'{date_prefix}-{safe_filename}'
                        )
                        
                        if save_attachment_local(file_path, file_data):
                            attachments_saved.append({
                                'message_id': msg_id,
                                'subject': subject,
                                'filename': safe_filename,
                                'path': file_path,
                                'size': len(file_data)
                            })
                            processed_count += 1
                
            except Exception as e:
                logger.error(f'Error processing message {msg_id}: {e}')
                continue
        
        # Resultado
        result = {
            'status': 'ok',
            'scanned': len(messages),
            'processed': processed_count,
            'attachments': len(attachments_saved),
            'email': email,
            'label': label,
            'query': query,
            'saved_files': attachments_saved[:10]  # Primeiros 10
        }
        
        logger.info(f'Gmail ingest completed: {result}')
        
        return jsonify(result), 200
        
    except HttpError as e:
        logger.error(f'Gmail API error: {e}')
        return jsonify({
            'error': 'Gmail API error',
            'details': str(e),
            'code': e.resp.status if hasattr(e, 'resp') else 500
        }), 500
        
    except Exception as e:
        logger.error(f'Gmail ingest error: {e}')
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@app.route('/status', methods=['GET'])
def status():
    """Status geral do backend"""
    try:
        # Verificar se Service Account existe
        sa_exists = os.path.exists(GMAIL_SA_FILE)
        
        # Verificar diretório de emails
        emails_dir_exists = os.path.exists(EMAILS_DIR)
        emails_dir_writable = os.access(EMAILS_DIR, os.W_OK) if emails_dir_exists else False
        
        # Contar arquivos salvos
        total_files = 0
        if emails_dir_exists:
            for root, dirs, files in os.walk(EMAILS_DIR):
                total_files += len(files)
        
        return jsonify({
            'status': 'ok',
            'checks': {
                'service_account': sa_exists,
                'emails_directory': emails_dir_exists,
                'emails_writable': emails_dir_writable
            },
            'stats': {
                'total_attachments_saved': total_files
            },
            'config': {
                'emails_dir': EMAILS_DIR,
                'sa_file_configured': sa_exists
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


# Rota raiz
@app.route('/', methods=['GET'])
def index():
    """Informações da API"""
    return jsonify({
        'service': 'n.Oficios Backend Python',
        'version': '1.0.0',
        'endpoints': {
            'GET /health': 'Health check',
            'GET /status': 'Backend status and stats',
            'POST /gmail/ingest': 'Process Gmail emails with INGEST label'
        },
        'documentation': 'See PLANEJAMENTO_VPS_COMPLETO.md'
    }), 200


if __name__ == '__main__':
    # Modo desenvolvimento
    port = int(os.getenv('PORT', 8000))
    logger.info(f'Starting backend on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)

