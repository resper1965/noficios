"""
Esquema de dados Pydantic para o sistema de automação de ofícios.
Define estruturas de dados com validação e tipagem forte.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class TipoResposta(str, Enum):
    """Tipos de resposta possíveis para um ofício"""
    NEGATIVA = "NEGATIVA"
    POSITIVA = "POSITIVA"
    DADOS = "DADOS"


class OficioData(BaseModel):
    """
    Modelo Pydantic para dados extraídos de um ofício.
    Inclui campos de Multi-Tenancy e extração de informações.
    Modelo ESTRITO conforme especificação.
    """
    # Multi-Tenancy (obrigatório para todas as entidades)
    org_id: str = Field(..., description="ID da organização (tenant)")
    thread_id: str = Field(..., description="ID do thread do Gmail")
    message_id: str = Field(..., description="ID da mensagem do Gmail")
    
    # Dados Extraídos
    autoridade_nome: str = Field(..., description="Nome da autoridade solicitante")
    processo_numero: Optional[str] = Field(None, description="Número do processo judicial")
    solicitacoes: List[str] = Field(default_factory=list, description="Lista de solicitações do ofício")
    prazo_dias: int = Field(..., description="Prazo em dias para resposta")
    tipo_resposta_provavel: TipoResposta = Field(..., description="Tipo de resposta mais provável")
    confianca: float = Field(..., ge=0.0, le=1.0, description="Nível de confiança da extração (0-1)")
    raw_text: str = Field(..., description="Texto completo do ofício + OCR")
    
    # Cognitive Response - Inferência de Intenção (RAG)
    classificacao_intencao: Optional[str] = Field(
        None, 
        description="Intenção principal do ofício (ex: 'Bloqueio Judicial', 'Solicitação de Dados Pessoais')"
    )
    elementos_necessarios_resposta: Optional[List[str]] = Field(
        None,
        description="Lista de elementos que devem estar na resposta (ex: 'Referência ao Art. 5', 'Confirmação de Prazo')"
    )
    
    # Rastreamento e Atribuição
    assigned_user_id: Optional[str] = Field(
        None,
        description="ID do usuário atualmente responsável pelo ofício"
    )
    llm_prompt_version: Optional[str] = Field(
        None,
        description="Versão do prompt usado para extração no W1 (ex: 'v1.2.0')"
    )
    status: Optional[str] = Field(
        None,
        description="Status atual do ofício (usar OficioStatus enum)"
    )
    
    # Configuração de modelo estrito
    model_config = {"extra": "forbid", "strict": True}
    
    @field_validator('confianca')
    @classmethod
    def validar_confianca(cls, v: float) -> float:
        """Valida que a confiança está no intervalo correto"""
        if not 0.0 <= v <= 1.0:
            raise ValueError('Confiança deve estar entre 0.0 e 1.0')
        return v
    
    @field_validator('prazo_dias')
    @classmethod
    def validar_prazo(cls, v: int) -> int:
        """Valida que o prazo é positivo"""
        if v <= 0:
            raise ValueError('Prazo deve ser maior que zero')
        return v


class AuditTrail(BaseModel):
    """
    Modelo para trilha de auditoria.
    Registra quem modificou o recurso e quando.
    """
    user_id: str = Field(..., description="ID do usuário que realizou a modificação")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Data/hora da modificação")
    action: str = Field(..., description="Ação realizada (criação, atualização, etc)")
    target_id: str = Field(..., description="ID do ofício ou documento afetado pela ação")
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class OficioStatus(str, Enum):
    """Status possíveis para o ciclo de vida de um ofício"""
    AGUARDANDO_PROCESSAMENTO = "AGUARDANDO_PROCESSAMENTO"
    EM_PROCESSAMENTO = "EM_PROCESSAMENTO"
    AGUARDANDO_COMPLIANCE = "AGUARDANDO_COMPLIANCE"
    EM_ANALISE_COMPLIANCE = "EM_ANALISE_COMPLIANCE"
    EM_REVISAO = "EM_REVISAO"  # Novo: Para revisão HITL
    APROVADO_COMPLIANCE = "APROVADO_COMPLIANCE"
    REPROVADO_COMPLIANCE = "REPROVADO_COMPLIANCE"
    AGUARDANDO_RESPOSTA = "AGUARDANDO_RESPOSTA"
    AGUARDANDO_ENVIO = "AGUARDANDO_ENVIO"  # Novo: Aguardando envio final
    RESPONDIDO = "RESPONDIDO"
    ERRO_PROCESSAMENTO = "ERRO_PROCESSAMENTO"
    NA_DLQ = "NA_DLQ"


class KnowledgeDocument(BaseModel):
    """
    Modelo Pydantic para documentos da base de conhecimento (RAG).
    Usado para armazenar legislação, políticas internas e jurisprudência.
    """
    org_id: str = Field(..., description="ID da organização (Multi-Tenancy)")
    document_id: str = Field(..., description="ID único do documento")
    title: str = Field(..., description="Título do documento")
    content_text: str = Field(..., description="Conteúdo textual completo")
    embedding_vector: List[float] = Field(
        ..., 
        description="Vetor de embedding para busca semântica (RAG)"
    )
    tipo: str = Field(
        ...,
        description="Tipo do documento (legislacao, politica_interna, jurisprudencia, template)"
    )
    metadata: Optional[dict] = Field(
        None,
        description="Metadados adicionais (lei, artigo, tags, etc)"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator('embedding_vector')
    @classmethod
    def validar_embedding(cls, v: List[float]) -> List[float]:
        """Valida que o embedding não está vazio"""
        if not v or len(v) == 0:
            raise ValueError('Embedding vector não pode estar vazio')
        return v
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class LegalDocumentType(str, Enum):
    """Tipos de documentos legais"""
    TERMOS_DE_USO = "TERMOS_DE_USO"
    POLITICA_PRIVACIDADE = "POLITICA_PRIVACIDADE"
    POLITICA_COOKIES = "POLITICA_COOKIES"


class LegalDocument(BaseModel):
    """
    Modelo para documentos legais (Termos, Políticas).
    Editável pelo Org Admin, versionado.
    """
    org_id: str = Field(..., description="ID da organização (Multi-Tenancy)")
    type: LegalDocumentType = Field(..., description="Tipo do documento legal")
    version: str = Field(..., description="Versão do documento (ex: '1.0', '2.1')")
    content: str = Field(..., description="Conteúdo em Markdown ou HTML")
    is_active: bool = Field(default=True, description="Se esta versão está ativa")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="ID do usuário que criou")
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class UserPolicyAcceptance(BaseModel):
    """
    Modelo para registro de aceite de políticas por usuário.
    """
    user_id: str = Field(..., description="ID do usuário")
    org_id: str = Field(..., description="ID da organização")
    policy_type: LegalDocumentType = Field(..., description="Tipo de política aceita")
    policy_version: str = Field(..., description="Versão aceita")
    accepted_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = Field(None, description="IP do usuário no momento do aceite")
    user_agent: Optional[str] = Field(None, description="User agent do navegador")
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class OficioCompleto(BaseModel):
    """Modelo completo do ofício no Firestore"""
    oficio_id: str
    org_id: str
    status: OficioStatus
    dados_extraidos: Optional[OficioData] = None
    conteudo_bruto: Optional[str] = None
    anexos_urls: List[str] = Field(default_factory=list)
    audit_trail: List[AuditTrail] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_user_id: Optional[str] = Field(None, description="Usuário responsável")
    llm_prompt_version: Optional[str] = Field(None, description="Versão do prompt LLM")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

