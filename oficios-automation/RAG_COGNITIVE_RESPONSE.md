## 🧠 Cognitive Response com RAG - Documentação Completa

**Sistema de Suporte à Decisão Legal Baseado em IA e Contexto**

---

## 📋 Visão Geral

O sistema Cognitive Response transforma a plataforma de automação de ofícios em uma **Plataforma de Suporte à Decisão Legal** usando:

- **RAG (Retrieval Augmented Generation)**: Busca vetorial de conhecimento
- **Multi-Tenancy**: Isolamento total de conhecimento por organização
- **Chain-of-Thought**: Inferência de intenção e elementos necessários
- **Composição Inteligente**: Geração de respostas fundamentadas

---

## 🏗️ Arquitetura RAG

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTÃO COM INFERÊNCIA                   │
│  W1: Processamento + Classificação de Intenção              │
│  - OCR + Extração LLM                                        │
│  - classificacao_intencao                                    │
│  - elementos_necessarios_resposta                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    ENRIQUECIMENTO HUMANO                     │
│  W3: Webhook Update (HTTP + RBAC)                           │
│  - dados_de_apoio_compliance                                 │
│  - referencias_legais                                        │
│  - notas_internas                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSCA VETORIAL (RAG)                      │
│  Base de Conhecimento Multi-Tenant                          │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Firestore Collection: knowledge_base           │        │
│  │  - org_id (isolamento)                          │        │
│  │  - titulo, conteudo, tipo                       │        │
│  │  - embedding (vetor)                            │        │
│  │  - metadata                                     │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  Embeddings: Vertex AI ou OpenAI                            │
│  Similaridade: Cosine Similarity                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                COMPOSIÇÃO COGNITIVA (W4)                     │
│  Super-Prompt = Ofício + RAG + Compliance + Referências     │
│  LLM: Groq (Llama 3.1 70B) ou GPT-4o-mini                   │
│  Output: Rascunho de Resposta Fundamentado                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Multi-Tenancy no RAG

### Isolamento Garantido

**Firestore Query com Filtro Obrigatório:**
```python
query = db.collection('knowledge_base').where('org_id', '==', org_id)
```

**Validação na Busca:**
```python
def query_knowledge_base(query_embedding, org_id, top_k=3):
    # CRÍTICO: Filtro obrigatório por org_id
    results = []
    for doc in db.collection('knowledge_base').where('org_id', '==', org_id):
        similarity = cosine_similarity(query_embedding, doc['embedding'])
        if similarity >= min_similarity:
            results.append(doc)
    return sorted(results, key=lambda x: x['similarity'], reverse=True)[:top_k]
```

### Estrutura do Documento de Conhecimento

```json
{
  "doc_id": "auto-generated",
  "org_id": "org123",  // CRÍTICO - Isolamento
  "titulo": "Lei 105/2001 - Sigilo Bancário",
  "conteudo": "Art. 5º O Poder Judiciário...",
  "tipo": "legislacao",
  "embedding": [0.123, -0.456, 0.789, ...],  // Vetor 768 ou 1536 dims
  "metadata": {
    "lei": "105/2001",
    "artigo": "5",
    "tags": ["sigilo", "bancário", "judicial"]
  },
  "created_at": "2024-10-10T10:00:00Z",
  "embedding_model": "text-embedding-004"
}
```

---

## 📊 Schema Estendido

### OficioData (Campos RAG)

```python
class OficioData(BaseModel):
    # ... campos existentes ...
    
    # Cognitive Response - Inferência de Intenção
    classificacao_intencao: Optional[str] = Field(
        None,
        description="Intenção principal do ofício"
    )
    # Exemplos:
    # - "Bloqueio Judicial de Conta Bancária"
    # - "Solicitação de Dados Cadastrais de Cliente"
    # - "Quebra de Sigilo Bancário"
    
    elementos_necessarios_resposta: Optional[List[str]] = Field(
        None,
        description="Elementos obrigatórios na resposta"
    )
    # Exemplos:
    # - "Referência ao Art. 5º da Lei 105/2001"
    # - "Confirmação de Prazo Legal"
    # - "Menção ao Processo Judicial"
```

### Ofício Completo (Firestore)

```json
{
  "oficio_id": "oficio789",
  "org_id": "org123",
  
  "dados_extraidos": {
    "classificacao_intencao": "Bloqueio Judicial de Conta Bancária",
    "elementos_necessarios_resposta": [
      "Referência ao Art. 5º da Lei 105/2001",
      "Confirmação de Prazo Legal"
    ]
  },
  
  "dados_de_apoio_compliance": "Verificar saldo antes de bloqueio...",
  "referencias_legais": ["Lei 105/2001", "CPC Art. 219"],
  "notas_internas": "Cliente possui histórico de bloqueios anteriores",
  
  "composicao_resposta": {
    "rascunho_resposta": "Excelentíssimo Senhor...",
    "rag_documentos_usados": [
      {"titulo": "Lei 105/2001", "similarity": 0.92},
      {"titulo": "Política Interna", "similarity": 0.85}
    ],
    "modelo_llm": "llama-3.1-70b",
    "gerado_em": "2024-10-10T12:00:00Z"
  }
}
```

---

## 🔄 Workflows Modificados

### W1: Processamento + Inferência Cognitiva

**Antes:**
```python
# Apenas extração básica
dados = groq_client.extract_structured_data(texto, org_id, OficioData)
```

**Depois:**
```python
# Extração + Inferência de Intenção
system_prompt = """
1. ANÁLISE: Identifique elementos
2. JUSTIFICATIVA: Explique raciocínio
3. INFERÊNCIA COGNITIVA: Classifique intenção
4. EXTRAÇÃO: Gere JSON

CAMPOS DE INFERÊNCIA:
- classificacao_intencao: Intenção principal em frase curta
- elementos_necessarios_resposta: Lista de elementos obrigatórios
"""

dados = groq_client.extract_structured_data(texto, org_id, OficioData, system_prompt)
```

### W3: Webhook de Enriquecimento

**Endpoint HTTP com RBAC:**
```http
POST /webhook_update
Authorization: Bearer <JWT>

{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "approve_compliance",
  "dados_de_apoio_compliance": "Verificar Art. 5º...",
  "referencias_legais": ["Lei 105/2001"],
  "notas_internas": "Cliente possui histórico..."
}
```

**Ações Disponíveis:**
- `approve_compliance`: Aprova e dispara W4
- `reject_compliance`: Rejeita
- `add_context`: Adiciona contexto sem mudar status

### W4: Composição Cognitiva

**Fluxo Completo:**

1. **Busca RAG**
```python
rag_results = rag_client.search_and_retrieve(
    query_text=oficio.classificacao_intencao,
    org_id=org_id,
    top_k=3,
    min_similarity=0.7
)
```

2. **Construção do Super-Prompt**
```python
super_prompt = f"""
## OFÍCIO
Autoridade: {oficio.autoridade_nome}
Solicitações: {oficio.solicitacoes}
Elementos Necessários: {oficio.elementos_necessarios_resposta}

## BASE DE CONHECIMENTO (RAG)
{rag_results['contexto_formatado']}

## ORIENTAÇÕES DO COMPLIANCE
{oficio.dados_de_apoio_compliance}

## REFERÊNCIAS LEGAIS
{oficio.referencias_legais}

Gere rascunho de resposta fundamentado.
"""
```

3. **Geração via LLM**
```python
# Opção 1: Groq (rápido, baixo custo)
rascunho = groq_client.generate(super_prompt, model="llama-3.1-70b")

# Opção 2: GPT-4o-mini (melhor qualidade)
rascunho = openai_client.generate(super_prompt, model="gpt-4o-mini")
```

---

## 📚 Tipos de Conhecimento

### 1. Legislação
```json
{
  "tipo": "legislacao",
  "titulo": "Lei 105/2001 - Art. 5º",
  "conteudo": "Art. 5º O Poder Judiciário...",
  "metadata": {"lei": "105/2001", "artigo": "5"}
}
```

### 2. Política Interna
```json
{
  "tipo": "politica_interna",
  "titulo": "Política de Atendimento a Ofícios",
  "conteudo": "1. RECEBIMENTO...",
  "metadata": {"departamento": "compliance", "versao": "2.0"}
}
```

### 3. Jurisprudência
```json
{
  "tipo": "jurisprudencia",
  "titulo": "STJ REsp 1234567",
  "conteudo": "EMENTA: SIGILO BANCÁRIO...",
  "metadata": {"tribunal": "STJ", "ano": "2023"}
}
```

### 4. Templates
```json
{
  "tipo": "template",
  "titulo": "Template - Bloqueio Judicial",
  "conteudo": "Excelentíssimo Senhor...",
  "metadata": {"categoria": "bloqueio_judicial"}
}
```

---

## 🚀 Setup e Uso

### 1. Instalação de Dependências

```bash
pip install google-cloud-aiplatform openai numpy scipy
```

### 2. Configuração

```bash
# Variáveis de ambiente
export GCP_PROJECT_ID="seu-projeto"
export USE_VERTEX_AI_EMBEDDINGS="true"  # ou "false" para OpenAI
export OPENAI_API_KEY="sk-..."  # se usar OpenAI
export USE_GPT4_FOR_RESPONSE="false"  # "true" para maior qualidade
```

### 3. Popular Base de Conhecimento

```bash
python scripts/populate_knowledge_base.py
```

**Interativo:**
```
Informe o org_id da organização: org123
📊 Documentos a importar: 6

[1/6] Processando: Lei 105/2001 - Art. 5º
   Tipo: legislacao
   Tamanho: 450 caracteres
   ✅ Documento salvo: KnowDoc_xyz123

...

🔍 TESTE DE BUSCA
Informe uma query de teste: bloqueio judicial

📚 Encontrados 3 resultados relevantes:
1. Lei 105/2001 - Art. 5º
   Relevância: 92.3%
   Tipo: legislacao
```

### 4. Deploy das Funções

```bash
# W3: Webhook HTTP
cd funcoes/W3_webhook_update
gcloud functions deploy webhook_update \
  --gen2 \
  --runtime python311 \
  --region southamerica-east1 \
  --trigger-http \
  --allow-unauthenticated=false \
  --entry-point webhook_update

# W4: Composição (Pub/Sub)
cd ../W4_composicao_resposta
gcloud functions deploy compose_response \
  --gen2 \
  --runtime python311 \
  --region southamerica-east1 \
  --trigger-topic resposta_pronta \
  --entry-point compose_response \
  --memory 2GB \
  --timeout 540s \
  --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,USE_GPT4_FOR_RESPONSE=false
```

---

## 🧪 Testes

### Teste do RAG Client

```python
from utils.rag_client import RAGClient

rag = RAGClient()

# Adicionar documento
doc_id = rag.add_document(
    org_id="org123",
    titulo="Teste Lei",
    conteudo="Artigo de teste...",
    tipo="legislacao"
)

# Buscar
results = rag.search_and_retrieve(
    query_text="artigo de teste",
    org_id="org123"
)

print(f"Encontrados: {results['num_results']} documentos")
```

### Teste do Webhook (W3)

```bash
curl -X POST https://REGION-PROJECT.cloudfunctions.net/webhook_update \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org123",
    "oficio_id": "oficio789",
    "action": "approve_compliance",
    "dados_de_apoio_compliance": "Verificar saldo antes de bloqueio",
    "referencias_legais": ["Lei 105/2001"]
  }'
```

---

## 📈 Métricas e Qualidade

### Métricas do RAG

- **Recall@3**: % de documentos relevantes nos top 3
- **Similaridade Média**: Média das similaridades
- **Taxa de Uso**: % de respostas que usaram RAG

### Qualidade das Respostas

- **Completude**: Todos os elementos necessários presentes?
- **Fundamentação**: Referências legais citadas corretamente?
- **Coerência**: Resposta lógica e bem estruturada?

### Monitoramento

```python
# Exemplo de logging
logger.info(f"RAG Query: {query}")
logger.info(f"Documentos: {num_docs}, Similaridade Média: {avg_similarity:.2f}")
logger.info(f"Modelo: {model}, Tokens: {num_tokens}")
```

---

## 💰 Custos Estimados

### Por 1000 Ofícios/Mês

| Componente | Uso | Custo |
|------------|-----|-------|
| Vertex AI Embeddings | 6K chamadas | $0.60 |
| Firestore | 20K reads | $0.72 |
| Groq (Llama 3.1 70B) | 1K chamadas | Variável* |
| Cloud Functions W3/W4 | 2K invocações | $0.80 |
| **Total (infra)** | | **~$2.12** |

*Groq: Verificar pricing atual

### Alternativa GPT-4

Se `USE_GPT4_FOR_RESPONSE=true`:
- GPT-4o-mini: ~$0.15/1K tokens input, ~$0.60/1K tokens output
- Estimativa: ~$30-50 adicionais/1K ofícios

---

## 🔍 Troubleshooting

### Problema: Embeddings não gerados

```python
# Verificar configuração
print(os.getenv('USE_VERTEX_AI_EMBEDDINGS'))
print(os.getenv('OPENAI_API_KEY'))

# Testar manualmente
from utils.rag_client import VectorDBClient
client = VectorDBClient()
embedding = client.generate_embedding("teste")
print(f"Embedding gerado: {len(embedding)} dimensões")
```

### Problema: Busca não retorna resultados

```python
# Verificar documentos na base
from google.cloud import firestore
db = firestore.Client()
docs = list(db.collection('knowledge_base').where('org_id', '==', 'org123').limit(10).stream())
print(f"Documentos encontrados: {len(docs)}")
```

### Problema: Similaridade sempre baixa

- Verificar se embedding model é consistente
- Revisar conteúdo dos documentos (muito curto?)
- Ajustar `min_similarity` (padrão: 0.7)

---

## 📚 Próximos Passos

### Fase 1: RAG Básico ✅
- [x] Vector Database com Multi-Tenancy
- [x] Embeddings (Vertex AI/OpenAI)
- [x] Busca por similaridade
- [x] W1 com inferência de intenção
- [x] W3 webhook de enriquecimento
- [x] W4 composição cognitiva

### Fase 2: Otimizações
- [ ] Cache de embeddings
- [ ] Reranking de resultados
- [ ] Hybrid search (vetorial + keyword)
- [ ] Fine-tuning do modelo de embeddings

### Fase 3: Inteligência Avançada
- [ ] Feedback loop (respostas aprovadas → treino)
- [ ] Detecção de novos padrões
- [ ] Sugestão automática de templates
- [ ] Análise de sentimento em respostas

---

**Sistema pronto para produção! 🚀**

Com isolamento Multi-Tenant, fundamentação legal via RAG e composição inteligente de respostas.





