"""
Clientes de API para interação com serviços externos.
Implementa comunicação com Firestore, Pub/Sub e Groq LLM.
"""
import base64
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Type

from google.cloud import firestore, pubsub_v1, secretmanager, storage
from groq import Groq
from pydantic import BaseModel
import hashlib
import logging

from .schema import OficioCompleto, OficioStatus, AuditTrail


class FirestoreClient:
    """Cliente para interação com o Firestore com suporte a Multi-Tenancy"""
    
    def __init__(self, project_id: Optional[str] = None):
        """
        Inicializa o cliente do Firestore.
        
        Args:
            project_id: ID do projeto GCP. Se None, usa variável de ambiente.
        """
        self.db = firestore.Client(project=project_id)
        self.oficios_collection = "oficios"
        self.organizations_collection = "organizations"
    
    def get_oficio(self, org_id: str, oficio_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um ofício específico com filtro obrigatório de org_id.
        
        Args:
            org_id: ID da organização (tenant)
            oficio_id: ID do ofício
            
        Returns:
            Dicionário com os dados do ofício ou None se não encontrado
        """
        doc_ref = self.db.collection(self.oficios_collection).document(oficio_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        
        # Validação crítica de Multi-Tenancy
        if data.get('org_id') != org_id:
            raise PermissionError(
                f"Acesso negado: ofício {oficio_id} não pertence à organização {org_id}"
            )
        
        return data
    
    def update_oficio(
        self, 
        org_id: str, 
        oficio_id: str, 
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> bool:
        """
        Atualiza um ofício existente com validação de Multi-Tenancy.
        
        Args:
            org_id: ID da organização (tenant)
            oficio_id: ID do ofício
            data: Dados a serem atualizados
            user_id: ID do usuário que está fazendo a atualização (para auditoria)
            
        Returns:
            True se atualização bem-sucedida
        """
        # Verifica se o ofício pertence à organização
        existing = self.get_oficio(org_id, oficio_id)
        if not existing:
            raise ValueError(f"Ofício {oficio_id} não encontrado para org {org_id}")
        
        # Adiciona timestamp de atualização
        data['updated_at'] = datetime.utcnow()
        
        # Adiciona trilha de auditoria se user_id fornecido
        if user_id:
            audit_entry = {
                'user_id': user_id,
                'timestamp': datetime.utcnow(),
                'action': 'update',
                'org_id': org_id,
                'changes': list(data.keys())
            }
            
            # Adiciona à trilha de auditoria existente
            if 'audit_trail' not in data:
                data['audit_trail'] = firestore.ArrayUnion([audit_entry])
            else:
                existing_trail = existing.get('audit_trail', [])
                existing_trail.append(audit_entry)
                data['audit_trail'] = existing_trail
        
        # Realiza a atualização
        doc_ref = self.db.collection(self.oficios_collection).document(oficio_id)
        doc_ref.update(data)
        
        return True
    
    def create_oficio(self, org_id: str, data: Dict[str, Any]) -> str:
        """
        Cria um novo ofício no Firestore.
        
        Args:
            org_id: ID da organização
            data: Dados do ofício
            
        Returns:
            ID do ofício criado
        """
        data['org_id'] = org_id
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        data['status'] = data.get('status', OficioStatus.AGUARDANDO_PROCESSAMENTO.value)
        
        doc_ref = self.db.collection(self.oficios_collection).document()
        doc_ref.set(data)
        
        return doc_ref.id
    
    def get_organization_by_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma organização pelo domínio de e-mail.
        
        Args:
            domain: Domínio do e-mail (ex: "empresa.com.br")
            
        Returns:
            Dicionário com dados da organização ou None
        """
        query = self.db.collection(self.organizations_collection).where(
            'email_domains', 'array_contains', domain
        ).limit(1)
        
        results = list(query.stream())
        
        if not results:
            return None
        
        org_doc = results[0]
        org_data = org_doc.to_dict()
        org_data['org_id'] = org_doc.id
        
        return org_data
    
    def list_oficios_by_org(
        self, 
        org_id: str, 
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Lista ofícios de uma organização com filtros opcionais.
        
        Args:
            org_id: ID da organização
            status: Status para filtrar (opcional)
            limit: Número máximo de resultados
            
        Returns:
            Lista de ofícios
        """
        query = self.db.collection(self.oficios_collection).where('org_id', '==', org_id)
        
        if status:
            query = query.where('status', '==', status)
        
        query = query.limit(limit).order_by('created_at', direction=firestore.Query.DESCENDING)
        
        results = []
        for doc in query.stream():
            data = doc.to_dict()
            data['oficio_id'] = doc.id
            results.append(data)
        
        return results
    
    def log_audit_event(
        self,
        user_id: str,
        org_id: str,
        action: str,
        target_id: str,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Registra evento de auditoria centralizado.
        
        Args:
            user_id: ID do usuário que realizou a ação
            org_id: ID da organização (isolamento)
            action: Ação realizada
            target_id: ID do recurso afetado
            details: Detalhes adicionais da ação
            
        Returns:
            ID do documento de auditoria criado
        """
        audit_data = {
            'user_id': user_id,
            'org_id': org_id,
            'action': action,
            'target_id': target_id,
            'details': details or {},
            'timestamp': firestore.SERVER_TIMESTAMP,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Salva na coleção de auditoria
        audit_ref = self.db.collection('audit_trail').document()
        audit_ref.set(audit_data)
        
        return audit_ref.id
    
    def get_secret(self, org_id: str, secret_name: str) -> str:
        """
        Busca segredo no Google Secret Manager com escopo de organização.
        
        Args:
            org_id: ID da organização
            secret_name: Nome do segredo (ex: 'groq_api_key', 'gmail_credentials')
            
        Returns:
            Valor do segredo
            
        Raises:
            ValueError: Se segredo não encontrado
        """
        try:
            client = secretmanager.SecretManagerServiceClient()
            
            # Nome do segredo com prefixo de org_id para isolamento
            # Formato: projects/{project}/secrets/{org_id}_{secret_name}/versions/latest
            project_id = self.db.project or os.getenv('GCP_PROJECT_ID')
            secret_path = f"projects/{project_id}/secrets/{org_id}_{secret_name}/versions/latest"
            
            # Acessa o segredo
            response = client.access_secret_version(name=secret_path)
            secret_value = response.payload.data.decode('UTF-8')
            
            return secret_value
            
        except Exception as e:
            # Fallback para variável de ambiente global (desenvolvimento)
            env_var_name = secret_name.upper()
            fallback_value = os.getenv(env_var_name)
            
            if fallback_value:
                return fallback_value
            
            raise ValueError(f"Segredo {org_id}_{secret_name} não encontrado: {e}")
    
    def get_latest_policy(self, org_id: str, policy_type: str) -> Optional[Dict[str, Any]]:
        """
        Busca a política mais recente e ativa de uma organização.
        
        Args:
            org_id: ID da organização
            policy_type: Tipo da política (TERMOS_DE_USO, POLITICA_PRIVACIDADE, etc)
            
        Returns:
            Dicionário com dados da política ou None
        """
        query = self.db.collection('legal_documents') \
            .where('org_id', '==', org_id) \
            .where('type', '==', policy_type) \
            .where('is_active', '==', True) \
            .order_by('created_at', direction=firestore.Query.DESCENDING) \
            .limit(1)
        
        results = list(query.stream())
        
        if not results:
            return None
        
        doc = results[0]
        policy_data = doc.to_dict()
        policy_data['document_id'] = doc.id
        
        return policy_data
    
    def update_policy(
        self,
        org_id: str,
        policy_type: str,
        content: str,
        version: str,
        user_id: str
    ) -> str:
        """
        Atualiza uma política (cria nova versão e desativa antiga).
        Protegido por RBAC no endpoint HTTP.
        
        Args:
            org_id: ID da organização
            policy_type: Tipo da política
            content: Novo conteúdo (Markdown/HTML)
            version: Versão (ex: '2.0')
            user_id: ID do usuário criando a política
            
        Returns:
            ID do documento criado
        """
        # Desativa versões anteriores
        old_policies = self.db.collection('legal_documents') \
            .where('org_id', '==', org_id) \
            .where('type', '==', policy_type) \
            .where('is_active', '==', True) \
            .stream()
        
        for old_doc in old_policies:
            old_doc.reference.update({'is_active': False})
        
        # Cria nova versão
        policy_data = {
            'org_id': org_id,
            'type': policy_type,
            'version': version,
            'content': content,
            'is_active': True,
            'created_at': firestore.SERVER_TIMESTAMP,
            'created_by': user_id
        }
        
        doc_ref = self.db.collection('legal_documents').document()
        doc_ref.set(policy_data)
        
        # Log de auditoria
        self.log_audit_event(
            user_id=user_id,
            org_id=org_id,
            action=f'UPDATE_POLICY_{policy_type}',
            target_id=doc_ref.id,
            details={'version': version}
        )
        
        return doc_ref.id
    
    def register_policy_acceptance(
        self,
        user_id: str,
        org_id: str,
        policy_type: str,
        policy_version: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Registra aceite de política por usuário.
        
        Args:
            user_id: ID do usuário
            org_id: ID da organização
            policy_type: Tipo da política
            policy_version: Versão aceita
            ip_address: IP do usuário
            user_agent: User agent do navegador
            
        Returns:
            ID do registro de aceite
        """
        acceptance_data = {
            'user_id': user_id,
            'org_id': org_id,
            'policy_type': policy_type,
            'policy_version': policy_version,
            'accepted_at': firestore.SERVER_TIMESTAMP,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        doc_ref = self.db.collection('policy_acceptances').document()
        doc_ref.set(acceptance_data)
        
        return doc_ref.id
    
    def check_policy_acceptance(
        self,
        user_id: str,
        org_id: str,
        policy_type: str,
        required_version: str
    ) -> bool:
        """
        Verifica se usuário aceitou versão específica de política.
        
        Args:
            user_id: ID do usuário
            org_id: ID da organização
            policy_type: Tipo da política
            required_version: Versão requerida
            
        Returns:
            True se usuário aceitou a versão requerida
        """
        query = self.db.collection('policy_acceptances') \
            .where('user_id', '==', user_id) \
            .where('org_id', '==', org_id) \
            .where('policy_type', '==', policy_type) \
            .where('policy_version', '==', required_version) \
            .limit(1)
        
        results = list(query.stream())
        
        return len(results) > 0


class RawTextStorageClient:
    """
    Cliente para armazenamento seguro de raw_text (LGPD compliance).
    Bucket restrito com acesso controlado via IAM e URLs assinadas.
    """
    
    def __init__(self, project_id: str):
        """
        Inicializa o cliente de armazenamento seguro.
        
        Args:
            project_id: ID do projeto GCP
        """
        self.storage_client = storage.Client()
        self.bucket_name = f"{project_id}-raw-oficios-restricted"
        self.project_id = project_id
        
        # Garante que o bucket existe
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Cria bucket se não existir (região São Paulo)."""
        try:
            self.bucket = self.storage_client.get_bucket(self.bucket_name)
        except Exception:
            # Cria bucket na região southamerica-east1 (São Paulo)
            self.bucket = self.storage_client.create_bucket(
                self.bucket_name,
                location="southamerica-east1"
            )
            logging.info(f"Bucket {self.bucket_name} criado (LGPD: Soberania de dados - São Paulo)")
    
    def upload_raw_text(
        self,
        org_id: str,
        oficio_id: str,
        raw_text: str
    ) -> Dict[str, str]:
        """
        Faz upload do raw_text para bucket restrito.
        
        Args:
            org_id: ID da organização
            oficio_id: ID do ofício
            raw_text: Texto completo a ser armazenado
            
        Returns:
            Dict com storage_path, sha256, e preview truncado
        """
        # Gera hash SHA256 para integridade
        sha256_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
        
        # Caminho no bucket: org_id/oficio_id/raw_text.txt
        blob_path = f"{org_id}/{oficio_id}/raw_text.txt"
        blob = self.bucket.blob(blob_path)
        
        # Upload com metadata
        blob.metadata = {
            'org_id': org_id,
            'oficio_id': oficio_id,
            'sha256': sha256_hash,
            'lgpd_category': 'personal_data',
            'access_level': 'restricted'
        }
        
        blob.upload_from_string(raw_text, content_type='text/plain')
        
        # Preview truncado (primeiros 500 caracteres)
        preview = raw_text[:500] + ('...' if len(raw_text) > 500 else '')
        
        storage_path = f"gs://{self.bucket_name}/{blob_path}"
        
        logging.info(
            f"Raw text armazenado com segurança: {storage_path} "
            f"(LGPD Art. 46 - Segurança)"
        )
        
        return {
            'storage_path': storage_path,
            'sha256': sha256_hash,
            'preview': preview,
            'size_bytes': len(raw_text.encode('utf-8'))
        }
    
    def generate_signed_url(
        self,
        storage_path: str,
        expiration_minutes: int = 60
    ) -> str:
        """
        Gera URL assinada temporária para acesso ao raw_text.
        
        Args:
            storage_path: Caminho completo (gs://bucket/path)
            expiration_minutes: Tempo de validade em minutos
            
        Returns:
            URL assinada temporária
        """
        # Extrai bucket e blob path
        path_parts = storage_path.replace('gs://', '').split('/', 1)
        bucket_name = path_parts[0]
        blob_path = path_parts[1]
        
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        # Gera URL assinada (válida por X minutos)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET"
        )
        
        logging.info(
            f"URL assinada gerada para {blob_path} "
            f"(válida por {expiration_minutes} minutos)"
        )
        
        return url
    
    def get_raw_text(self, storage_path: str) -> str:
        """
        Recupera raw_text do bucket (uso interno).
        
        Args:
            storage_path: Caminho completo (gs://bucket/path)
            
        Returns:
            Conteúdo do texto
        """
        path_parts = storage_path.replace('gs://', '').split('/', 1)
        bucket_name = path_parts[0]
        blob_path = path_parts[1]
        
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        return blob.download_as_text()


class PubSubClient:
    """Cliente para interação com Google Cloud Pub/Sub"""
    
    def __init__(self, project_id: Optional[str] = None):
        """
        Inicializa o cliente Pub/Sub.
        
        Args:
            project_id: ID do projeto GCP. Se None, usa variável de ambiente.
        """
        self.project_id = project_id or os.getenv('GCP_PROJECT_ID')
        if not self.project_id:
            raise ValueError("GCP_PROJECT_ID não fornecido")
        
        self.publisher = pubsub_v1.PublisherClient()
    
    def publish_message(self, topic_name: str, data: dict) -> str:
        """
        Publica uma mensagem em um tópico Pub/Sub.
        
        Args:
            topic_name: Nome do tópico (sem o path completo)
            data: Dicionário com os dados a serem publicados
            
        Returns:
            Message ID da mensagem publicada
        """
        # Constrói o path completo do tópico
        topic_path = self.publisher.topic_path(self.project_id, topic_name)
        
        # Serializa o dict para JSON e codifica em bytes
        message_json = json.dumps(data)
        message_bytes = message_json.encode('utf-8')
        
        # Publica a mensagem
        future = self.publisher.publish(topic_path, message_bytes)
        
        # Aguarda confirmação e retorna o message ID
        message_id = future.result()
        
        return message_id


class GroqClient:
    """Cliente para interação com a API Groq (LLM)"""
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        org_id: Optional[str] = None,
        use_secret_manager: bool = True
    ):
        """
        Inicializa o cliente Groq.
        
        Args:
            api_key: Chave de API Groq. Se None, busca do Secret Manager ou env
            org_id: ID da organização (para buscar key específica no Secret Manager)
            use_secret_manager: Se True, tenta buscar do Secret Manager primeiro
        """
        self.org_id = org_id
        
        # Tenta obter API key do Secret Manager se org_id fornecido
        if use_secret_manager and org_id:
            try:
                firestore_client = FirestoreClient()
                self.api_key = firestore_client.get_secret(org_id, 'groq_api_key')
            except:
                # Fallback para variável de ambiente global
                self.api_key = api_key or os.getenv('GROQ_API_KEY')
        else:
            self.api_key = api_key or os.getenv('GROQ_API_KEY')
        
        if not self.api_key:
            raise ValueError("GROQ_API_KEY não fornecida (Secret Manager ou variável de ambiente)")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.1-8b-instant"  # Modelo Llama 3.1 8B
    
    def extract_structured_data(
        self, 
        text_content: str,
        org_id: str,
        pydantic_schema: Type[BaseModel],
        system_prompt: Optional[str] = None
    ) -> BaseModel:
        """
        Extrai dados estruturados de texto usando LLM com schema Pydantic.
        Usa Chain-of-Thought para melhorar a acurácia.
        
        Args:
            text_content: Conteúdo de texto do ofício
            org_id: ID da organização (para contexto)
            pydantic_schema: Classe Pydantic que define o schema esperado
            system_prompt: Prompt de sistema customizado (opcional)
            
        Returns:
            Instância do modelo Pydantic com dados extraídos
        """
        # Schema JSON do modelo Pydantic
        schema_json = pydantic_schema.model_json_schema()
        
        # Prompt padrão com Chain-of-Thought se não fornecido
        if not system_prompt:
            system_prompt = f"""Você é um assistente especializado em extrair informações estruturadas de ofícios judiciais brasileiros.

Use o seguinte processo de raciocínio (Chain-of-Thought):

1. **ANÁLISE**: Leia o texto cuidadosamente e identifique os elementos principais
2. **JUSTIFICATIVA**: Explique seu raciocínio para cada campo extraído
3. **EXTRAÇÃO**: Gere o JSON final com os dados estruturados

Schema esperado:
{json.dumps(schema_json, indent=2, ensure_ascii=False)}

Contexto: Este ofício pertence à organização ID: {org_id}

IMPORTANTE: Retorne APENAS o JSON final na seção de EXTRAÇÃO. Use NEGATIVA/POSITIVA/DADOS em maiúsculas para tipo_resposta_provavel."""
        
        user_prompt = f"""Extraia as informações do seguinte ofício usando Chain-of-Thought:

=== TEXTO DO OFÍCIO ===
{text_content}
=======================

Siga o processo:
1. ANÁLISE: [Identifique os elementos]
2. JUSTIFICATIVA: [Explique o raciocínio]
3. EXTRAÇÃO: [JSON estruturado]

Retorne o JSON final conforme o schema."""
        
        try:
            # Chamada à API Groq
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,  # Baixa temperatura para maior precisão
                max_tokens=2048,
                response_format={"type": "json_object"}
            )
            
            # Extrai o JSON da resposta
            response_text = completion.choices[0].message.content
            response_json = json.loads(response_text)
            
            # Valida e converte para o modelo Pydantic
            result = pydantic_schema.model_validate(response_json)
            
            return result
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Erro ao decodificar JSON da resposta do LLM: {e}")
        except Exception as e:
            raise RuntimeError(f"Erro ao chamar API Groq: {e}")
    
    def classify_text(self, text: str, categories: List[str]) -> str:
        """
        Classifica um texto em uma das categorias fornecidas.
        
        Args:
            text: Texto a ser classificado
            categories: Lista de categorias possíveis
            
        Returns:
            Categoria selecionada
        """
        prompt = f"""Classifique o seguinte texto em uma das categorias: {', '.join(categories)}

Texto: {text}

Retorne APENAS o nome da categoria, sem explicações adicionais."""
        
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=50
        )
        
        return completion.choices[0].message.content.strip()

