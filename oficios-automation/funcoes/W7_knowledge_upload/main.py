"""
W7: Knowledge Upload - Governança de Conhecimento (RAG Indexing)
Cloud Function HTTP para upload e vetorização de documentos de conhecimento.
Responsabilidades: Upload de arquivos, extração de texto, vetorização e indexação.
"""
import base64
import io
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Request
from google.cloud import storage

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.auth_rbac import rbac_required, ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, AuthContext
from utils.rag_client import RAGClient
from utils.schema import KnowledgeDocument

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
KNOWLEDGE_BUCKET = os.getenv('KNOWLEDGE_BUCKET', f'{PROJECT_ID}-knowledge-docs')

# Clientes
rag_client = RAGClient(project_id=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


def extract_text_from_file(file_content: bytes, content_type: str, filename: str) -> str:
    """
    Extrai texto de um arquivo (PDF ou TXT).
    
    Args:
        file_content: Conteúdo do arquivo em bytes
        content_type: MIME type do arquivo
        filename: Nome do arquivo
        
    Returns:
        Texto extraído
    """
    logger.info(f"Extraindo texto de {filename} (tipo: {content_type})")
    
    # Texto simples
    if content_type in ['text/plain', 'text/markdown'] or filename.endswith('.txt') or filename.endswith('.md'):
        try:
            text = file_content.decode('utf-8')
            logger.info(f"Texto extraído: {len(text)} caracteres")
            return text
        except UnicodeDecodeError:
            # Tenta outras encodings
            for encoding in ['latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    text = file_content.decode(encoding)
                    logger.info(f"Texto extraído com encoding {encoding}: {len(text)} caracteres")
                    return text
                except:
                    continue
            raise ValueError("Não foi possível decodificar o arquivo de texto")
    
    # PDF
    elif content_type == 'application/pdf' or filename.endswith('.pdf'):
        try:
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            
            text = '\n\n'.join(text_parts)
            logger.info(f"PDF extraído: {len(pdf_reader.pages)} páginas, {len(text)} caracteres")
            return text
            
        except ImportError:
            raise ValueError("PyPDF2 não instalado. Execute: pip install PyPDF2")
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF: {e}")
            raise ValueError(f"Erro ao processar PDF: {str(e)}")
    
    else:
        raise ValueError(f"Tipo de arquivo não suportado: {content_type}. Use PDF ou TXT.")


def save_file_to_storage(
    file_content: bytes,
    org_id: str,
    filename: str,
    content_type: str
) -> str:
    """
    Salva arquivo no Cloud Storage para backup.
    
    Args:
        file_content: Conteúdo do arquivo
        org_id: ID da organização
        filename: Nome do arquivo
        content_type: MIME type
        
    Returns:
        URL do arquivo (gs://)
    """
    try:
        bucket = storage_client.bucket(KNOWLEDGE_BUCKET)
        
        # Path: org_id/timestamp_filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        blob_path = f"{org_id}/{timestamp}_{filename}"
        
        blob = bucket.blob(blob_path)
        blob.upload_from_string(file_content, content_type=content_type)
        
        file_url = f"gs://{KNOWLEDGE_BUCKET}/{blob_path}"
        logger.info(f"Arquivo salvo: {file_url}")
        
        return file_url
        
    except Exception as e:
        logger.error(f"Erro ao salvar arquivo no Storage: {e}")
        # Não é crítico, continua sem backup
        return ""


def process_and_vectorize(
    org_id: str,
    title: str,
    content_text: str,
    tipo: str,
    metadata: Optional[Dict[str, Any]] = None,
    file_url: str = ""
) -> str:
    """
    Processa e vetoriza um documento de conhecimento.
    
    Args:
        org_id: ID da organização
        title: Título do documento
        content_text: Conteúdo textual
        tipo: Tipo do documento
        metadata: Metadados adicionais
        file_url: URL do arquivo no Storage
        
    Returns:
        ID do documento criado
    """
    logger.info(f"Processando documento: {title} (org: {org_id})")
    logger.info(f"Tamanho do conteúdo: {len(content_text)} caracteres")
    
    # Valida tamanho mínimo
    if len(content_text) < 50:
        raise ValueError("Conteúdo muito curto (mínimo: 50 caracteres)")
    
    # Limita tamanho máximo (para embeddings)
    MAX_LENGTH = 50000  # ~50KB de texto
    if len(content_text) > MAX_LENGTH:
        logger.warning(f"Conteúdo truncado de {len(content_text)} para {MAX_LENGTH} caracteres")
        content_text = content_text[:MAX_LENGTH]
    
    # Adiciona file_url aos metadados
    if metadata is None:
        metadata = {}
    
    if file_url:
        metadata['file_url'] = file_url
    
    metadata['content_length'] = len(content_text)
    metadata['indexed_at'] = datetime.utcnow().isoformat()
    
    # Usa RAGClient para gerar embedding e salvar
    try:
        document_id = rag_client.add_document(
            org_id=org_id,
            titulo=title,
            conteudo=content_text,
            tipo=tipo,
            metadata=metadata
        )
        
        logger.info(f"Documento vetorizado e indexado: {document_id}")
        return document_id
        
    except Exception as e:
        logger.error(f"Erro ao vetorizar documento: {e}")
        raise


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=False,
    resource_org_id_param='org_id'
)
def handle_knowledge_upload(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Handler HTTP para upload de documentos de conhecimento.
    
    Payload esperado (multipart/form-data ou JSON):
    {
        "org_id": "org123",
        "titulo": "Lei 105/2001 - Sigilo Bancário",
        "tipo": "legislacao",
        "metadata": {"lei": "105/2001", "artigo": "5"},
        "file": <binary> ou "content_text": <string>
    }
    
    Args:
        request: Request HTTP do Flask
        auth_context: Contexto de autenticação injetado pelo decorator
        
    Returns:
        Tupla (response_dict, status_code)
    """
    try:
        logger.info(f"Upload de conhecimento iniciado por usuário {auth_context.user_id}")
        
        # 1. Parse do payload
        # Tenta multipart/form-data primeiro (upload de arquivo)
        if request.files:
            # Upload de arquivo
            if 'file' not in request.files:
                return {'error': 'Campo "file" não encontrado'}, 400
            
            file = request.files['file']
            
            if file.filename == '':
                return {'error': 'Arquivo não selecionado'}, 400
            
            # Lê conteúdo do arquivo
            file_content = file.read()
            filename = file.filename
            content_type = file.content_type or 'application/octet-stream'
            
            # Obtém metadados do form
            org_id = request.form.get('org_id')
            titulo = request.form.get('titulo')
            tipo = request.form.get('tipo', 'documento')
            
            try:
                metadata = json.loads(request.form.get('metadata', '{}'))
            except:
                metadata = {}
            
            # Extrai texto do arquivo
            try:
                content_text = extract_text_from_file(file_content, content_type, filename)
            except Exception as e:
                return {
                    'error': 'Erro ao extrair texto do arquivo',
                    'message': str(e)
                }, 400
            
            # Salva arquivo no Storage (backup)
            file_url = save_file_to_storage(file_content, org_id, filename, content_type)
            metadata['original_filename'] = filename
            
        else:
            # JSON com conteúdo direto
            payload = request.get_json(silent=True)
            
            if not payload:
                return {'error': 'Payload JSON inválido ou arquivo não fornecido'}, 400
            
            org_id = payload.get('org_id')
            titulo = payload.get('titulo')
            tipo = payload.get('tipo', 'documento')
            content_text = payload.get('content_text')
            metadata = payload.get('metadata', {})
            file_url = ""
            
            if not content_text:
                return {'error': 'Campo "content_text" obrigatório quando não há arquivo'}, 400
        
        # 2. Valida campos obrigatórios
        if not all([org_id, titulo]):
            return {
                'error': 'Campos obrigatórios: org_id, titulo'
            }, 400
        
        # 3. Valida que o org_id do payload corresponde ao do usuário
        if org_id != auth_context.org_id and not auth_context.is_platform_admin():
            return {
                'error': 'Você só pode fazer upload de documentos para sua própria organização'
            }, 403
        
        logger.info(f"Processando documento: {titulo} (tipo: {tipo})")
        logger.info(f"Tamanho: {len(content_text)} caracteres")
        
        # 4. Processa e vetoriza o documento
        try:
            document_id = process_and_vectorize(
                org_id=org_id,
                title=titulo,
                content_text=content_text,
                tipo=tipo,
                metadata=metadata,
                file_url=file_url
            )
        except Exception as e:
            logger.error(f"Erro ao processar documento: {e}")
            return {
                'error': 'Erro ao processar e vetorizar documento',
                'message': str(e)
            }, 500
        
        # 5. Resposta de sucesso
        response = {
            'status': 'success',
            'document_id': document_id,
            'org_id': org_id,
            'titulo': titulo,
            'tipo': tipo,
            'content_length': len(content_text),
            'uploaded_by': auth_context.user_id,
            'file_url': file_url if file_url else None,
            'message': 'Documento vetorizado e indexado com sucesso'
        }
        
        logger.info(f"Upload concluído: {document_id}")
        
        return response, 201
        
    except Exception as e:
        logger.error(f"Erro ao processar upload: {e}", exc_info=True)
        return {
            'error': 'Erro interno',
            'message': f'Erro ao processar upload: {str(e)}'
        }, 500


@rbac_required(
    allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN],
    allow_cross_org=True  # Platform Admin pode listar de qualquer org
)
def handle_list_documents(request: Request, auth_context: AuthContext) -> tuple[Dict[str, Any], int]:
    """
    Lista documentos de conhecimento da organização.
    
    Query params:
    - org_id: ID da organização (obrigatório se Platform Admin)
    - tipo: Filtrar por tipo (opcional)
    - limit: Número de resultados (padrão: 50)
    
    Args:
        request: Request HTTP
        auth_context: Contexto de autenticação
        
    Returns:
        Lista de documentos
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
                'error': 'Acesso negado a documentos de outra organização'
            }, 403
        
        # Parâmetros de filtro
        tipo = request.args.get('tipo')
        limit = int(request.args.get('limit', 50))
        
        # Busca no Firestore via RAGClient
        from google.cloud import firestore
        db = firestore.Client(project=PROJECT_ID)
        
        query = db.collection('knowledge_base').where('org_id', '==', org_id)
        
        if tipo:
            query = query.where('tipo', '==', tipo)
        
        query = query.limit(limit).order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Monta resultado
        documents = []
        for doc in query.stream():
            doc_data = doc.to_dict()
            # Remove embedding da resposta (muito grande)
            doc_data.pop('embedding', None)
            doc_data['document_id'] = doc.id
            documents.append(doc_data)
        
        logger.info(f"Listados {len(documents)} documentos para org {org_id}")
        
        return {
            'status': 'success',
            'org_id': org_id,
            'count': len(documents),
            'documents': documents
        }, 200
        
    except Exception as e:
        logger.error(f"Erro ao listar documentos: {e}", exc_info=True)
        return {
            'error': 'Erro ao listar documentos',
            'message': str(e)
        }, 500


# Entry points para Cloud Functions
def upload_knowledge_document(request: Request):
    """Entry point para Cloud Function HTTP (POST)"""
    if request.method == 'POST':
        return handle_knowledge_upload(request)
    else:
        return {'error': 'Método não permitido. Use POST.'}, 405


def list_knowledge_documents(request: Request):
    """Entry point para Cloud Function HTTP (GET)"""
    if request.method == 'GET':
        return handle_list_documents(request)
    else:
        return {'error': 'Método não permitido. Use GET.'}, 405





