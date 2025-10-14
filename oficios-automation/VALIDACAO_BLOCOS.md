# ✅ Validação dos Blocos 1-4

**Data:** 10 de Outubro de 2025  
**Status:** CONFORME ESPECIFICAÇÕES

## 📋 Checklist de Conformidade

### ✅ Bloco 1: Preparação do Ambiente e Schemas (utils/schema.py)

**Arquivo:** `utils/schema.py`

#### Classe TipoResposta (Enum)
- ✅ Valores em UPPERCASE: `NEGATIVA`, `POSITIVA`, `DADOS`
- ✅ Herda de `str, Enum`

```python
class TipoResposta(str, Enum):
    NEGATIVA = "NEGATIVA"
    POSITIVA = "POSITIVA"
    DADOS = "DADOS"
```

#### Classe OficioData (Pydantic BaseModel)
- ✅ Herda de `BaseModel`
- ✅ Modelo **ESTRITO**: `model_config = {"extra": "forbid", "strict": True}`
- ✅ Campo `org_id` (str, obrigatório)
- ✅ Campo `thread_id` (str, do Gmail)
- ✅ Campo `message_id` (str, do Gmail) ← **ADICIONADO**
- ✅ Campo `autoridade_nome` (str)
- ✅ Campo `processo_numero` (str | None)
- ✅ Campo `solicitacoes` (List[str])
- ✅ Campo `prazo_dias` (int)
- ✅ Campo `tipo_resposta_provavel` (TipoResposta)
- ✅ Campo `confianca` (float)
- ✅ Campo `raw_text` (str, texto completo + OCR) ← **ADICIONADO**
- ✅ Validadores: `confianca` (0-1), `prazo_dias` (>0)

```python
class OficioData(BaseModel):
    org_id: str = Field(..., description="ID da organização (tenant)")
    thread_id: str = Field(..., description="ID do thread do Gmail")
    message_id: str = Field(..., description="ID da mensagem do Gmail")
    autoridade_nome: str = Field(...)
    processo_numero: Optional[str] = Field(None)
    solicitacoes: List[str] = Field(default_factory=list)
    prazo_dias: int = Field(...)
    tipo_resposta_provavel: TipoResposta = Field(...)
    confianca: float = Field(..., ge=0.0, le=1.0)
    raw_text: str = Field(..., description="Texto completo do ofício + OCR")
    
    model_config = {"extra": "forbid", "strict": True}
```

#### Classe AuditTrail
- ✅ Campo `user_id` (str)
- ✅ Campo `timestamp` (datetime)
- ✅ Campo `action` (str)

```python
class AuditTrail(BaseModel):
    user_id: str = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str = Field(...)
```

---

### ✅ Bloco 2: Clientes de API (utils/api_clients.py)

**Arquivo:** `utils/api_clients.py`

#### Classe FirestoreClient
- ✅ Inicializado para Firestore
- ✅ `get_oficio(org_id, oficio_id)`: Retorna dados com **filtro obrigatório** de `org_id`
- ✅ `update_oficio(org_id, oficio_id, data)`: Atualiza com **filtro obrigatório** de `org_id`
- ✅ `get_organization_by_domain(domain)`: Busca na coleção `organizations` por domínio

```python
class FirestoreClient:
    def get_oficio(self, org_id: str, oficio_id: str) -> Optional[Dict[str, Any]]:
        # Validação crítica de Multi-Tenancy
        if data.get('org_id') != org_id:
            raise PermissionError(...)
```

#### Classe PubSubClient ← **ADICIONADA**
- ✅ Inicializado para Pub/Sub
- ✅ `publish_message(topic_name, data: dict)`: Publica mensagem codificada

```python
class PubSubClient:
    def __init__(self, project_id: Optional[str] = None):
        self.publisher = pubsub_v1.PublisherClient()
    
    def publish_message(self, topic_name: str, data: dict) -> str:
        message_json = json.dumps(data)
        message_bytes = message_json.encode('utf-8')
        future = self.publisher.publish(topic_path, message_bytes)
        return future.result()
```

#### Classe GroqClient
- ✅ Inicializado para Groq API
- ✅ Modelo: Llama 3.1 8B (`llama-3.1-8b-instant`)
- ✅ `extract_structured_data(text_content, org_id, pydantic_schema)` ← **org_id ADICIONADO**
- ✅ **Chain-of-Thought**: Prompt estruturado em 3 etapas
  1. ANÁLISE: Identifica elementos
  2. JUSTIFICATIVA: Explica raciocínio
  3. EXTRAÇÃO: Gera JSON estruturado

```python
class GroqClient:
    def extract_structured_data(
        self, 
        text_content: str,
        org_id: str,  # ← ADICIONADO
        pydantic_schema: Type[BaseModel],
        system_prompt: Optional[str] = None
    ) -> BaseModel:
        # Prompt com Chain-of-Thought
        system_prompt = f"""
        Use o seguinte processo de raciocínio (Chain-of-Thought):
        
        1. **ANÁLISE**: Leia o texto cuidadosamente
        2. **JUSTIFICATIVA**: Explique seu raciocínio
        3. **EXTRAÇÃO**: Gere o JSON final
        
        Contexto: Este ofício pertence à organização ID: {org_id}
        """
```

---

### ✅ Bloco 3: Função de Gateway W1 (funcoes/W1_ingestao_trigger/main.py)

**Arquivo:** `funcoes/W1_ingestao_trigger/main.py`

#### Importações
- ✅ Importa `FirestoreClient`, `PubSubClient`
- ✅ Importa schemas: `OficioStatus`

#### Extração de Domínio ← **CORRIGIDA**
- ✅ Extrai domínio do **nome do arquivo** (não do path)
- ✅ Formato: `YYYYMMDD-alguma-coisa-dominio.com.eml`
- ✅ Exemplo: `20241010-oficio-urgente-empresa.com.br.eml` → `empresa.com.br`

```python
def extrair_dominio_do_filename(filename: str) -> str:
    """
    Formato esperado: YYYYMMDD-alguma-coisa-dominio.com.eml
    """
    # Remove .eml
    # Procura padrão de domínio
    pattern = r'([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})?)(?:\.|$)'
    matches = re.findall(pattern, filename)
    return matches[-1].lower()
```

#### Lógica da Função
- ✅ 1. Extrai domínio do nome do arquivo
- ✅ 2. Usa `FirestoreClient.get_organization_by_domain()` para obter `org_id`
- ✅ 3. Se `org_id` não encontrado: **loga erro e para**
- ✅ 4. Cria registro no Firestore com `status: AGUARDANDO_PROCESSAMENTO`
- ✅ 5. Publica mensagem no Pub/Sub (`oficios_para_processamento`) com `oficio_id` e `org_id`

```python
def handle_ingestion(event, context):
    # 1. Extrai domínio do filename
    filename = file_path.split('/')[-1]
    domain = extrair_dominio_do_filename(filename)
    
    # 2. Resolve organização
    org_data = firestore_client.get_organization_by_domain(domain)
    
    if not org_data:
        # 3. Se não encontrado: erro e para
        logger.error(f"Organização não encontrada para o domínio: {domain}")
        return {'status': 'error', 'message': error_msg, 'domain': domain}
    
    # 4. Registra no Firestore
    oficio_data = {
        'org_id': org_id,
        'status': OficioStatus.AGUARDANDO_PROCESSAMENTO.value,
        ...
    }
    oficio_id = firestore_client.create_oficio(org_id, oficio_data)
    
    # 5. Publica no Pub/Sub
    message_data = {'oficio_id': oficio_id, 'org_id': org_id, ...}
    pubsub_client.publish_message(PUBSUB_TOPIC, message_data)
```

---

### ✅ Bloco 4: Funções Auxiliares (utils/validation.py)

**Arquivo:** `utils/validation.py` ← **CRIADO**

#### Função validate_document_fields ← **IMPLEMENTADA**
- ✅ Recebe `data: OficioData`
- ✅ Retorna `Tuple[bool, Dict[str, any]]`

##### Funcionalidade 1: Valida CPF/CNPJ
- ✅ Algoritmo de dígito verificador completo
- ✅ Busca no `raw_text` e `autoridade_nome`
- ✅ Retorna listas: `cpfs_validos`, `cpfs_invalidos`, `cnpjs_validos`, `cnpjs_invalidos`

```python
def validar_cpf(cpf: str) -> bool:
    # Remove formatação
    # Valida tamanho (11 dígitos)
    # Rejeita dígitos repetidos
    # Calcula dígitos verificadores
    ...

def validar_cnpj(cnpj: str) -> bool:
    # Remove formatação
    # Valida tamanho (14 dígitos)
    # Rejeita dígitos repetidos
    # Calcula dígitos verificadores
    ...
```

##### Funcionalidade 2: Converte prazo_dias em data_limite_iso
- ✅ Retorna formato ISO 8601
- ✅ `data_limite = data_recebimento + timedelta(days=prazo_dias)`

```python
def calcular_data_limite(data_recebimento: datetime, prazo_dias: int) -> str:
    data_limite = data_recebimento + timedelta(days=prazo_dias)
    return data_limite.isoformat()
```

##### Funcionalidade 3: Calcula prioridade
- ✅ Baseada em `data_limite_iso`
- ✅ **< 72h = ALTA**
- ✅ 72h a 168h (7 dias) = MEDIA
- ✅ > 168h = BAIXA

```python
def calcular_prioridade(data_limite_iso: str) -> str:
    horas_restantes = (data_limite - agora).total_seconds() / 3600
    
    if horas_restantes < 72:
        return 'ALTA'
    elif horas_restantes < 168:
        return 'MEDIA'
    else:
        return 'BAIXA'
```

##### Função completa:
```python
def validate_document_fields(data: OficioData) -> Tuple[bool, Dict[str, any]]:
    # 1. Valida documentos
    documentos_validados = extrair_e_validar_documentos(data.raw_text)
    
    # 2. Calcula data_limite_iso
    data_limite_iso = calcular_data_limite(datetime.utcnow(), data.prazo_dias)
    
    # 3. Calcula prioridade
    prioridade = calcular_prioridade(data_limite_iso)
    
    # Retorna
    return (True, {
        'documentos_validados': documentos_validados,
        'data_limite_iso': data_limite_iso,
        'prioridade': prioridade,
        'data_recebimento_iso': datetime.utcnow().isoformat(),
        'tem_documentos_invalidos': bool(...)
    })
```

#### Chamada no W1_processamento_async
- ✅ Importa `from utils.validation import validate_document_fields`
- ✅ Chama dentro do processamento:

```python
# No W1_processamento_async/main.py
is_valid, informacoes_adicionais = validate_document_fields(dados_extraidos)

documentos_validados = informacoes_adicionais['documentos_validados']
data_limite_iso = informacoes_adicionais['data_limite_iso']
prioridade = informacoes_adicionais['prioridade']
```

---

## 📊 Resumo de Alterações

### Arquivos Criados
1. ✅ `utils/validation.py` (NOVO)

### Arquivos Modificados
1. ✅ `utils/schema.py`
   - TipoResposta: lowercase → **UPPERCASE**
   - OficioData: Adicionados `message_id` e `raw_text`
   - OficioData: Adicionado `model_config` para modo estrito
   - AuditTrail: Simplificado conforme spec

2. ✅ `utils/api_clients.py`
   - **Adicionada** classe `PubSubClient`
   - GroqClient: Adicionado parâmetro `org_id`
   - GroqClient: Implementado **Chain-of-Thought** no prompt

3. ✅ `funcoes/W1_ingestao_trigger/main.py`
   - Extração de domínio: path → **nome do arquivo**
   - Formato: `YYYYMMDD-alguma-coisa-dominio.com.eml`
   - Usa `PubSubClient` ao invés de `pubsub_v1` direto

4. ✅ `funcoes/W1_processamento_async/main.py`
   - Importa `validate_document_fields`
   - Usa `validate_document_fields` para validações
   - Remove funções duplicadas (agora em `validation.py`)
   - Ajustado para novos valores de `TipoResposta`

---

## ✅ Validação Completa

### Conformidade
- ✅ **Bloco 1**: 100% conforme
- ✅ **Bloco 2**: 100% conforme
- ✅ **Bloco 3**: 100% conforme
- ✅ **Bloco 4**: 100% conforme

### Testes de Linter
```bash
$ read_lints oficios-automation/
> No linter errors found.
```

### Estrutura Final
```
oficios-automation/
├── utils/
│   ├── schema.py          ✅ Bloco 1
│   ├── api_clients.py     ✅ Bloco 2
│   ├── validation.py      ✅ Bloco 4 (NOVO)
│   └── auth_rbac.py       ✅ (Existente)
│
└── funcoes/
    ├── W1_ingestao_trigger/
    │   └── main.py        ✅ Bloco 3
    └── W1_processamento_async/
        └── main.py        ✅ Usa Bloco 4
```

---

## 🎯 Status Final

**✅ TODOS OS BLOCOS 1-4 ESTÃO CONFORMES ÀS ESPECIFICAÇÕES**

- Schema estrito com todos os campos obrigatórios
- TipoResposta em UPPERCASE
- PubSubClient como classe separada
- Chain-of-Thought implementado no Groq
- Extração de domínio do nome do arquivo
- validation.py completo com todas as funções
- validate_document_fields implementado e integrado
- Sem erros de linter

**Pronto para deploy!** 🚀





