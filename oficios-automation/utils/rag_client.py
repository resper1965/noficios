"""
Cliente RAG (Retrieval Augmented Generation) para busca de conhecimento contextual.
Implementa Vector Database com isolamento Multi-Tenant.
"""
import json
import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from google.cloud import aiplatform, firestore
from openai import OpenAI


class VectorDBClient:
    """
    Cliente para Vector Database com suporte Multi-Tenant.
    Usa Vertex AI para embeddings e Firestore para armazenamento.
    """
    
    def __init__(
        self, 
        project_id: Optional[str] = None,
        embedding_model: str = "text-embedding-004"
    ):
        """
        Inicializa o cliente de Vector Database.
        
        Args:
            project_id: ID do projeto GCP
            embedding_model: Modelo de embedding (Vertex AI ou OpenAI)
        """
        self.project_id = project_id or os.getenv('GCP_PROJECT_ID')
        self.embedding_model = embedding_model
        self.db = firestore.Client(project=self.project_id)
        self.knowledge_collection = "knowledge_base"
        
        # Configura cliente de embeddings
        # Prioriza Vertex AI, fallback para OpenAI
        self.use_vertex_ai = os.getenv('USE_VERTEX_AI_EMBEDDINGS', 'true').lower() == 'true'
        
        if self.use_vertex_ai:
            aiplatform.init(project=self.project_id, location="us-central1")
        else:
            openai_key = os.getenv('OPENAI_API_KEY')
            if openai_key:
                self.openai_client = OpenAI(api_key=openai_key)
            else:
                raise ValueError("OPENAI_API_KEY não fornecida")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Gera embedding vetorial de um texto.
        
        Args:
            text: Texto a ser vetorizado
            
        Returns:
            Lista de floats representando o vetor
        """
        if self.use_vertex_ai:
            return self._generate_embedding_vertex(text)
        else:
            return self._generate_embedding_openai(text)
    
    def _generate_embedding_vertex(self, text: str) -> List[float]:
        """Gera embedding usando Vertex AI"""
        from vertexai.language_models import TextEmbeddingModel
        
        model = TextEmbeddingModel.from_pretrained(self.embedding_model)
        embeddings = model.get_embeddings([text])
        
        return embeddings[0].values
    
    def _generate_embedding_openai(self, text: str) -> List[float]:
        """Gera embedding usando OpenAI"""
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        
        return response.data[0].embedding
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calcula similaridade de cosseno entre dois vetores.
        
        Args:
            vec1: Primeiro vetor
            vec2: Segundo vetor
            
        Returns:
            Similaridade (0-1)
        """
        arr1 = np.array(vec1)
        arr2 = np.array(vec2)
        
        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def query_knowledge_base(
        self, 
        query_embedding: List[float], 
        org_id: str, 
        top_k: int = 3,
        min_similarity: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Consulta a base de conhecimento vetorial com isolamento Multi-Tenant.
        
        Args:
            query_embedding: Vetor da query
            org_id: ID da organização (isolamento)
            top_k: Número de resultados
            min_similarity: Similaridade mínima (0-1)
            
        Returns:
            Lista de documentos relevantes com scores
        """
        # Busca todos os documentos da organização
        # CRÍTICO: Filtro obrigatório de org_id
        query = self.db.collection(self.knowledge_collection).where('org_id', '==', org_id)
        
        results = []
        
        for doc in query.stream():
            doc_data = doc.to_dict()
            doc_embedding = doc_data.get('embedding')
            
            if not doc_embedding:
                continue
            
            # Calcula similaridade
            similarity = self.cosine_similarity(query_embedding, doc_embedding)
            
            if similarity >= min_similarity:
                results.append({
                    'doc_id': doc.id,
                    'similarity': similarity,
                    'titulo': doc_data.get('titulo', ''),
                    'conteudo': doc_data.get('conteudo', ''),
                    'tipo': doc_data.get('tipo', 'desconhecido'),
                    'metadata': doc_data.get('metadata', {})
                })
        
        # Ordena por similaridade decrescente
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Retorna top_k
        return results[:top_k]
    
    def add_knowledge_document(
        self,
        org_id: str,
        titulo: str,
        conteudo: str,
        tipo: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Adiciona documento à base de conhecimento.
        
        Args:
            org_id: ID da organização
            titulo: Título do documento
            conteudo: Conteúdo textual
            tipo: Tipo (ex: 'legislacao', 'politica_interna', 'jurisprudencia')
            metadata: Metadados adicionais
            
        Returns:
            ID do documento criado
        """
        # Gera embedding do conteúdo
        embedding = self.generate_embedding(conteudo)
        
        # Prepara documento
        doc_data = {
            'org_id': org_id,  # CRÍTICO: Isolamento
            'titulo': titulo,
            'conteudo': conteudo,
            'tipo': tipo,
            'embedding': embedding,
            'metadata': metadata or {},
            'created_at': firestore.SERVER_TIMESTAMP,
            'embedding_model': self.embedding_model
        }
        
        # Salva no Firestore
        doc_ref = self.db.collection(self.knowledge_collection).document()
        doc_ref.set(doc_data)
        
        return doc_ref.id


class RAGClient:
    """
    Cliente RAG de alto nível para busca e recuperação de conhecimento.
    Orquestra VectorDB e geração de contexto enriquecido.
    """
    
    def __init__(self, project_id: Optional[str] = None):
        """
        Inicializa o cliente RAG.
        
        Args:
            project_id: ID do projeto GCP
        """
        self.vector_db = VectorDBClient(project_id=project_id)
    
    def search_and_retrieve(
        self, 
        query_text: str, 
        org_id: str,
        top_k: int = 3,
        min_similarity: float = 0.7
    ) -> Dict[str, Any]:
        """
        Busca e recupera conhecimento relevante com isolamento Multi-Tenant.
        
        Args:
            query_text: Texto da query (ex: "Bloqueio Judicial de Contas")
            org_id: ID da organização (isolamento)
            top_k: Número de resultados
            min_similarity: Similaridade mínima
            
        Returns:
            Dicionário com resultados e contexto formatado
        """
        # 1. Gera embedding da query
        query_embedding = self.vector_db.generate_embedding(query_text)
        
        # 2. Busca na base de conhecimento (com isolamento de org_id)
        results = self.vector_db.query_knowledge_base(
            query_embedding=query_embedding,
            org_id=org_id,
            top_k=top_k,
            min_similarity=min_similarity
        )
        
        # 3. Formata contexto enriquecido
        contexto_formatado = self._format_context(results)
        
        return {
            'query': query_text,
            'org_id': org_id,
            'num_results': len(results),
            'results': results,
            'contexto_formatado': contexto_formatado,
            'has_relevant_knowledge': len(results) > 0
        }
    
    def _format_context(self, results: List[Dict[str, Any]]) -> str:
        """
        Formata resultados em contexto textual para o LLM.
        
        Args:
            results: Lista de resultados da busca vetorial
            
        Returns:
            Contexto formatado em Markdown
        """
        if not results:
            return "Nenhum conhecimento relevante encontrado na base."
        
        contexto_parts = []
        
        for idx, result in enumerate(results, 1):
            similarity_pct = result['similarity'] * 100
            
            part = f"""
### Documento {idx}: {result['titulo']}
**Tipo:** {result['tipo']}  
**Relevância:** {similarity_pct:.1f}%

{result['conteudo']}
"""
            contexto_parts.append(part)
        
        return "\n---\n".join(contexto_parts)
    
    def add_document(
        self,
        org_id: str,
        titulo: str,
        conteudo: str,
        tipo: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Adiciona documento à base de conhecimento.
        
        Args:
            org_id: ID da organização
            titulo: Título do documento
            conteudo: Conteúdo
            tipo: Tipo do documento
            metadata: Metadados
            
        Returns:
            ID do documento
        """
        return self.vector_db.add_knowledge_document(
            org_id=org_id,
            titulo=titulo,
            conteudo=conteudo,
            tipo=tipo,
            metadata=metadata
        )
    
    def bulk_import_documents(
        self,
        org_id: str,
        documents: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Importa múltiplos documentos em lote.
        
        Args:
            org_id: ID da organização
            documents: Lista de dicionários com titulo, conteudo, tipo
            
        Returns:
            Lista de IDs dos documentos criados
        """
        doc_ids = []
        
        for doc in documents:
            doc_id = self.add_document(
                org_id=org_id,
                titulo=doc['titulo'],
                conteudo=doc['conteudo'],
                tipo=doc.get('tipo', 'documento'),
                metadata=doc.get('metadata')
            )
            doc_ids.append(doc_id)
        
        return doc_ids





