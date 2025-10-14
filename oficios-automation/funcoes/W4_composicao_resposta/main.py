"""
W4: Composição Cognitiva de Resposta (RAG-Enhanced)
Cloud Function acionada por Pub/Sub para compor respostas usando RAG.
Responsabilidades: Buscar conhecimento, compor resposta inteligente, gerar documento.
"""
import base64
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

from google.cloud import pubsub_v1

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.api_clients import FirestoreClient, GroqClient
from utils.rag_client import RAGClient
from utils.schema import OficioData, OficioStatus

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
USE_GPT4_FOR_RESPONSE = os.getenv('USE_GPT4_FOR_RESPONSE', 'false').lower() == 'true'

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
groq_client = GroqClient()
rag_client = RAGClient(project_id=PROJECT_ID)


def construir_super_prompt(
    oficio_data: OficioData,
    contexto_rag: str,
    dados_apoio_compliance: Optional[str] = None,
    referencias_legais: Optional[list] = None,
    notas_internas: Optional[str] = None
) -> str:
    """
    Constrói o super-prompt para composição cognitiva da resposta.
    
    Args:
        oficio_data: Dados estruturados do ofício
        contexto_rag: Contexto recuperado do RAG
        dados_apoio_compliance: Dados injetados pelo compliance
        referencias_legais: Referências legais fornecidas
        notas_internas: Notas do analista
        
    Returns:
        Prompt formatado para o LLM
    """
    prompt = f"""# TAREFA: Composição de Resposta a Ofício Judicial

Você é um assistente jurídico especializado em compor respostas a ofícios judiciais brasileiros.
Sua tarefa é gerar um **rascunho detalhado e fundamentado** de resposta ao ofício descrito abaixo.

## INFORMAÇÕES DO OFÍCIO

**Autoridade Solicitante:** {oficio_data.autoridade_nome}
**Processo Número:** {oficio_data.processo_numero or 'Não informado'}
**Prazo:** {oficio_data.prazo_dias} dias
**Classificação:** {oficio_data.classificacao_intencao}

**Solicitações:**
"""
    
    for idx, solicitacao in enumerate(oficio_data.solicitacoes, 1):
        prompt += f"{idx}. {solicitacao}\n"
    
    # Elementos necessários na resposta
    if oficio_data.elementos_necessarios_resposta:
        prompt += "\n**Elementos Obrigatórios na Resposta:**\n"
        for elemento in oficio_data.elementos_necessarios_resposta:
            prompt += f"- {elemento}\n"
    
    # Contexto do RAG (conhecimento legal/política)
    prompt += f"""

## BASE DE CONHECIMENTO RELEVANTE

{contexto_rag}

"""
    
    # Referências legais
    if referencias_legais:
        prompt += "\n**Referências Legais Aplicáveis:**\n"
        for ref in referencias_legais:
            prompt += f"- {ref}\n"
    
    # Dados de apoio do compliance
    if dados_apoio_compliance:
        prompt += f"""

## ORIENTAÇÕES DO COMPLIANCE

{dados_apoio_compliance}

"""
    
    # Notas internas
    if notas_internas:
        prompt += f"""

## NOTAS DO ANALISTA

{notas_internas}

"""
    
    # Instruções finais
    prompt += """

## INSTRUÇÕES DE COMPOSIÇÃO

1. **Tom e Formalidade:** Use linguagem formal e técnica apropriada para comunicação judicial
2. **Estrutura:**
   - Cabeçalho com destinatário e referência ao processo
   - Introdução reconhecendo o ofício recebido
   - Corpo com respostas pontuais a cada solicitação
   - Fundamentação legal citando artigos e legislação aplicável
   - Conclusão com disponibilidade para esclarecimentos
3. **Fundamentação:** Cite a base de conhecimento e referências legais fornecidas
4. **Completude:** Certifique-se de incluir TODOS os elementos obrigatórios listados
5. **Formato:** Markdown limpo e bem estruturado

## RASCUNHO DE RESPOSTA

Gere o rascunho completo da resposta abaixo:
"""
    
    return prompt


def compor_resposta_rag(
    oficio_id: str,
    org_id: str
) -> Dict[str, Any]:
    """
    Compõe resposta usando RAG e contexto enriquecido.
    
    Args:
        oficio_id: ID do ofício
        org_id: ID da organização
        
    Returns:
        Dicionário com resposta gerada e metadados
    """
    logger.info(f"Iniciando composição cognitiva para ofício {oficio_id}")
    
    # 1. Busca dados do ofício
    oficio = firestore_client.get_oficio(org_id, oficio_id)
    
    if not oficio:
        raise ValueError(f"Ofício {oficio_id} não encontrado")
    
    # Valida status
    if oficio.get('status') != OficioStatus.APROVADO_COMPLIANCE.value:
        logger.warning(f"Ofício {oficio_id} não está em status APROVADO_COMPLIANCE")
    
    # Reconstrói OficioData
    dados_extraidos = oficio.get('dados_extraidos', {})
    oficio_data = OficioData(**dados_extraidos)
    
    logger.info(f"Classificação de intenção: {oficio_data.classificacao_intencao}")
    
    # 2. Busca conhecimento relevante via RAG
    logger.info("Buscando conhecimento na base vetorial...")
    
    query_text = oficio_data.classificacao_intencao or ' '.join(oficio_data.solicitacoes)
    
    rag_results = rag_client.search_and_retrieve(
        query_text=query_text,
        org_id=org_id,
        top_k=3,
        min_similarity=0.7
    )
    
    logger.info(f"RAG: {rag_results['num_results']} documentos relevantes encontrados")
    
    # 3. Coleta dados de apoio do compliance
    dados_apoio = oficio.get('dados_de_apoio_compliance')
    referencias_legais = oficio.get('referencias_legais', [])
    notas_internas = oficio.get('notas_internas')
    
    # 4. Constrói super-prompt
    super_prompt = construir_super_prompt(
        oficio_data=oficio_data,
        contexto_rag=rag_results['contexto_formatado'],
        dados_apoio_compliance=dados_apoio,
        referencias_legais=referencias_legais,
        notas_internas=notas_internas
    )
    
    logger.info(f"Super-prompt construído: {len(super_prompt)} caracteres")
    
    # 5. Gera resposta via LLM
    logger.info("Gerando resposta via LLM...")
    
    # Usa GPT-4 se configurado (melhor qualidade para documentos legais)
    if USE_GPT4_FOR_RESPONSE:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um assistente jurídico especializado."},
                {"role": "user", "content": super_prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        rascunho_resposta = completion.choices[0].message.content
    else:
        # Usa Groq (mais rápido, menor custo)
        completion = groq_client.client.chat.completions.create(
            model="llama-3.1-70b-versatile",  # Modelo maior para respostas
            messages=[
                {"role": "system", "content": "Você é um assistente jurídico especializado."},
                {"role": "user", "content": super_prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        rascunho_resposta = completion.choices[0].message.content
    
    logger.info(f"Resposta gerada: {len(rascunho_resposta)} caracteres")
    
    # 6. Metadados da composição
    composicao_metadata = {
        'rascunho_resposta': rascunho_resposta,
        'rag_documentos_usados': [
            {'titulo': r['titulo'], 'similarity': r['similarity']} 
            for r in rag_results['results']
        ],
        'num_rag_docs': rag_results['num_results'],
        'modelo_llm': 'gpt-4o-mini' if USE_GPT4_FOR_RESPONSE else 'llama-3.1-70b',
        'tem_dados_compliance': bool(dados_apoio),
        'tem_referencias_legais': bool(referencias_legais),
        'gerado_em': datetime.utcnow().isoformat()
    }
    
    return composicao_metadata


def handle_pubsub_message(event: Dict[str, Any], context: Any) -> None:
    """
    Handler principal para mensagens Pub/Sub.
    
    Args:
        event: Dados do evento Pub/Sub
        context: Contexto da execução
    """
    try:
        # Decodifica mensagem
        if 'data' in event:
            message_data = json.loads(base64.b64decode(event['data']).decode('utf-8'))
        else:
            raise ValueError("Mensagem Pub/Sub sem campo 'data'")
        
        oficio_id = message_data.get('oficio_id')
        org_id = message_data.get('org_id')
        action = message_data.get('action')
        
        if not all([oficio_id, org_id, action]):
            raise ValueError(f"Mensagem com campos faltando: {message_data}")
        
        logger.info(f"Processando action '{action}' para ofício {oficio_id}")
        
        # Atualiza status
        firestore_client.update_oficio(
            org_id,
            oficio_id,
            {'status': OficioStatus.AGUARDANDO_RESPOSTA.value},
            user_id='system'
        )
        
        # Compõe resposta usando RAG
        composicao = compor_resposta_rag(oficio_id, org_id)
        
        # Salva rascunho no Firestore
        update_data = {
            'status': OficioStatus.AGUARDANDO_RESPOSTA.value,
            'composicao_resposta': composicao,
            'rascunho_resposta': composicao['rascunho_resposta'],
            'resposta_gerada_em': datetime.utcnow().isoformat()
        }
        
        firestore_client.update_oficio(org_id, oficio_id, update_data, user_id='system')
        
        logger.info(f"Composição concluída para ofício {oficio_id}")
        logger.info(f"Usados {composicao['num_rag_docs']} documentos do RAG")
        
        # TODO: Próximos passos
        # - Gerar documento no Google Docs (se aplicável)
        # - Enviar e-mail via Gmail API
        # - Atualizar status para RESPONDIDO
        
    except Exception as e:
        logger.error(f"Erro ao compor resposta: {e}", exc_info=True)
        
        # Tenta atualizar status de erro
        try:
            if oficio_id and org_id:
                firestore_client.update_oficio(
                    org_id,
                    oficio_id,
                    {
                        'status': OficioStatus.ERRO_PROCESSAMENTO.value,
                        'erro_composicao': str(e)
                    },
                    user_id='system'
                )
        except:
            pass
        
        raise


# Entry point para Cloud Functions
def compose_response(event, context):
    """Entry point para Cloud Function (Pub/Sub Trigger)"""
    return handle_pubsub_message(event, context)





