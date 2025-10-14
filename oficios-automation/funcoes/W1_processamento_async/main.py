"""
W1: Processamento Assíncrono de Ofícios
Cloud Function acionada por Pub/Sub para processar ofícios.
Responsabilidades: OCR, extração estruturada via LLM, validações e cálculos.
"""
import base64
import json
import logging
import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from google.cloud import pubsub_v1, storage, vision
from dateutil import parser as date_parser

# Importa os utilitários
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.api_clients import FirestoreClient, GroqClient
from utils.schema import OficioData, OficioStatus, TipoResposta
from utils.validation import validate_document_fields

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
DLQ_TOPIC = os.getenv('PUBSUB_TOPIC_DLQ', 'oficios_dlq')
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))

# Versão do prompt LLM para auditabilidade
LLM_CURRENT_PROMPT_VERSION = os.getenv('LLM_PROMPT_VERSION', 'v1.1_RAG_Initial')

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
groq_client = GroqClient()
vision_client = vision.ImageAnnotatorClient()
storage_client = storage.Client(project=PROJECT_ID)
pubsub_publisher = pubsub_v1.PublisherClient()


def validar_cpf(cpf: str) -> bool:
    """
    Valida um CPF brasileiro.
    
    Args:
        cpf: String com o CPF (com ou sem formatação)
        
    Returns:
        True se CPF válido
    """
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Valida primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10 % 11) % 10
    
    if int(cpf[9]) != digito1:
        return False
    
    # Valida segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10 % 11) % 10
    
    if int(cpf[10]) != digito2:
        return False
    
    return True


def validar_cnpj(cnpj: str) -> bool:
    """
    Valida um CNPJ brasileiro.
    
    Args:
        cnpj: String com o CNPJ (com ou sem formatação)
        
    Returns:
        True se CNPJ válido
    """
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Valida primeiro dígito verificador
    peso = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * peso[i] for i in range(12))
    digito1 = (soma % 11)
    digito1 = 0 if digito1 < 2 else 11 - digito1
    
    if int(cnpj[12]) != digito1:
        return False
    
    # Valida segundo dígito verificador
    peso = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * peso[i] for i in range(13))
    digito2 = (soma % 11)
    digito2 = 0 if digito2 < 2 else 11 - digito2
    
    if int(cnpj[13]) != digito2:
        return False
    
    return True


def validar_documentos_no_texto(texto: str) -> Dict[str, list]:
    """
    Encontra e valida CPFs e CNPJs no texto.
    
    Args:
        texto: Texto a ser analisado
        
    Returns:
        Dicionário com listas de documentos válidos e inválidos
    """
    # Padrões regex
    cpf_pattern = r'\b\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[\-\.\s]?\d{2}\b'
    cnpj_pattern = r'\b\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\-\/\.\s]?\d{4}[\-\.\s]?\d{2}\b'
    
    cpfs_encontrados = re.findall(cpf_pattern, texto)
    cnpjs_encontrados = re.findall(cnpj_pattern, texto)
    
    resultado = {
        'cpfs_validos': [],
        'cpfs_invalidos': [],
        'cnpjs_validos': [],
        'cnpjs_invalidos': []
    }
    
    for cpf in cpfs_encontrados:
        if validar_cpf(cpf):
            resultado['cpfs_validos'].append(cpf)
        else:
            resultado['cpfs_invalidos'].append(cpf)
    
    for cnpj in cnpjs_encontrados:
        if validar_cnpj(cnpj):
            resultado['cnpjs_validos'].append(cnpj)
        else:
            resultado['cnpjs_invalidos'].append(cnpj)
    
    return resultado


def calcular_prioridade_legacy(prazo_dias: int, tipo_resposta: TipoResposta) -> str:
    """
    DEPRECATED: Use validate_document_fields do validation.py
    
    Calcula a prioridade baseada no prazo e tipo de resposta.
    
    Args:
        prazo_dias: Prazo em dias
        tipo_resposta: Tipo de resposta esperado
        
    Returns:
        Prioridade: 'ALTA', 'MEDIA' ou 'BAIXA'
    """
    # Respostas com dados são sempre de alta prioridade
    if tipo_resposta == TipoResposta.DADOS:
        if prazo_dias <= 5:
            return 'ALTA'
        elif prazo_dias <= 15:
            return 'MEDIA'
        else:
            return 'BAIXA'
    
    # Respostas positivas/negativas
    if prazo_dias <= 3:
        return 'ALTA'
    elif prazo_dias <= 10:
        return 'MEDIA'
    else:
        return 'BAIXA'


def realizar_ocr(bucket: str, file_path: str) -> str:
    """
    Realiza OCR em um arquivo usando Google Cloud Vision.
    
    Args:
        bucket: Nome do bucket GCS
        file_path: Caminho do arquivo no bucket
        
    Returns:
        Texto extraído
    """
    logger.info(f"Realizando OCR em gs://{bucket}/{file_path}")
    
    # Construir URI do GCS
    gcs_uri = f"gs://{bucket}/{file_path}"
    
    # Prepara o request para a API Vision
    image = vision.Image()
    image.source.image_uri = gcs_uri
    
    # Chama a API para detecção de texto
    response = vision_client.document_text_detection(image=image)
    
    if response.error.message:
        raise Exception(f"Erro no OCR: {response.error.message}")
    
    # Extrai o texto completo
    texto = response.full_text_annotation.text if response.full_text_annotation else ""
    
    logger.info(f"OCR concluído. Texto extraído: {len(texto)} caracteres")
    
    return texto


def processar_oficio(
    oficio_id: str, 
    org_id: str, 
    bucket: str, 
    file_path: str,
    is_simulation: bool = False,
    llm_prompt_version_override: Optional[str] = None
) -> None:
    """
    Processa um ofício: OCR, extração estruturada, validações.
    
    Args:
        oficio_id: ID do ofício
        org_id: ID da organização
        bucket: Bucket do arquivo
        file_path: Caminho do arquivo
        is_simulation: Se True, marca logs como [SIMULATION]
        llm_prompt_version_override: Versão específica do prompt (para testes)
    """
    log_prefix = "[SIMULATION] " if is_simulation else ""
    logger.info(f"{log_prefix}Processando ofício {oficio_id} (org: {org_id})")
    
    # 1. Atualiza status para EM_PROCESSAMENTO
    firestore_client.update_oficio(
        org_id,
        oficio_id,
        {'status': OficioStatus.EM_PROCESSAMENTO.value},
        user_id='system'
    )
    
    # 2. Realiza OCR do documento
    try:
        texto_extraido = realizar_ocr(bucket, file_path)
        
        # Salva o texto bruto no Firestore
        firestore_client.update_oficio(
            org_id,
            oficio_id,
            {'conteudo_bruto': texto_extraido},
            user_id='system'
        )
    except Exception as e:
        logger.error(f"Erro no OCR: {e}")
        raise
    
    # 3. Extração estruturada via LLM (Groq) com Chain-of-Thought + Inferência de Intenção
    logger.info("Iniciando extração estruturada via LLM com inferência cognitiva")
    
    # Obtém dados do ofício para contexto
    oficio_bruto = firestore_client.get_oficio(org_id, oficio_id)
    thread_id = oficio_bruto.get('thread_id', 'unknown')
    message_id = oficio_bruto.get('message_id', 'unknown')
    
    # Prompt customizado com inferência de intenção para RAG
    system_prompt_rag = f"""Você é um assistente especializado em análise de ofícios judiciais brasileiros.

Use o seguinte processo de raciocínio (Chain-of-Thought):

1. **ANÁLISE**: Leia o texto cuidadosamente e identifique os elementos principais
2. **JUSTIFICATIVA**: Explique seu raciocínio para cada campo extraído
3. **INFERÊNCIA COGNITIVA**: Identifique a intenção principal e elementos necessários para a resposta
4. **EXTRAÇÃO**: Gere o JSON final com os dados estruturados

Contexto: Este ofício pertence à organização ID: {org_id}

CAMPOS OBRIGATÓRIOS:
- org_id, thread_id, message_id (já fornecidos)
- autoridade_nome, solicitacoes, prazo_dias
- tipo_resposta_provavel (NEGATIVA/POSITIVA/DADOS em UPPERCASE)
- confianca (0.0 a 1.0)
- raw_text (texto completo)

CAMPOS DE INFERÊNCIA COGNITIVA (novos):
- classificacao_intencao: Identifique a intenção principal do ofício em uma frase curta
  Exemplos: "Bloqueio Judicial de Conta Bancária", "Solicitação de Dados Cadastrais de Cliente", 
  "Quebra de Sigilo Bancário", "Informações sobre Transações Financeiras"
  
- elementos_necessarios_resposta: Liste os elementos que DEVEM estar na resposta
  Exemplos: ["Referência ao Art. 5º da Lei 105/2001", "Confirmação de Prazo Legal", 
  "Menção ao Processo Judicial", "Protocolo de Atendimento"]

Retorne APENAS o JSON final na seção de EXTRAÇÃO."""
    
    try:
        # Extrai dados estruturados usando Chain-of-Thought + Inferência
        dados_extraidos = groq_client.extract_structured_data(
            text_content=texto_extraido,
            org_id=org_id,
            pydantic_schema=OficioData,
            system_prompt=system_prompt_rag
        )
        
        logger.info(f"Dados extraídos com confiança {dados_extraidos.confianca}")
        logger.info(f"Tipo de resposta: {dados_extraidos.tipo_resposta_provavel}")
        logger.info(f"Intenção classificada: {dados_extraidos.classificacao_intencao}")
        logger.info(f"Elementos necessários: {dados_extraidos.elementos_necessarios_resposta}")
        
    except Exception as e:
        logger.error(f"Erro na extração LLM: {e}")
        raise
    
    # 4. Validações de CPF/CNPJ e cálculo de prioridade
    # Usa a função validate_document_fields do validation.py
    logger.info("Validando documentos e calculando prioridade...")
    
    is_valid, informacoes_adicionais = validate_document_fields(dados_extraidos)
    
    if not is_valid:
        logger.error("Validação de documentos falhou")
        raise ValueError("Validação de documentos falhou")
    
    documentos_validados = informacoes_adicionais['documentos_validados']
    data_limite_iso = informacoes_adicionais['data_limite_iso']
    prioridade = informacoes_adicionais['prioridade']
    data_recebimento_iso = informacoes_adicionais['data_recebimento_iso']
    
    logger.info(f"Documentos validados: CPFs válidos={len(documentos_validados['cpfs_validos'])}, "
                f"CNPJs válidos={len(documentos_validados['cnpjs_validos'])}")
    logger.info(f"Data limite: {data_limite_iso}, Prioridade: {prioridade}")
    
    if informacoes_adicionais.get('tem_documentos_invalidos'):
        logger.warning("Atenção: Foram encontrados documentos inválidos no texto")
    
    # 5. Determina versão do prompt LLM (para auditabilidade)
    llm_version = llm_prompt_version_override or LLM_CURRENT_PROMPT_VERSION
    
    logger.info(f"{log_prefix}Versão do prompt LLM: {llm_version}")
    
    # 6. Atualiza o Firestore com todos os dados processados
    update_data = {
        'status': OficioStatus.AGUARDANDO_COMPLIANCE.value,
        'dados_extraidos': dados_extraidos.model_dump(mode='json'),
        'documentos_validados': documentos_validados,
        'data_recebimento': data_recebimento_iso,
        'data_limite': data_limite_iso,
        'prioridade': prioridade,
        'processamento_completo_em': datetime.utcnow().isoformat(),
        'confianca_extracao': dados_extraidos.confianca,
        'llm_prompt_version': llm_version,  # Auditabilidade
        'is_simulation': is_simulation  # Marca se é simulação
    }
    
    firestore_client.update_oficio(org_id, oficio_id, update_data, user_id='system')
    
    logger.info(f"{log_prefix}Ofício {oficio_id} processado com sucesso!")
    logger.info(f"{log_prefix}Resumo: Prioridade={prioridade}, Tipo={dados_extraidos.tipo_resposta_provavel}, "
                f"Prazo={dados_extraidos.prazo_dias} dias, LLM={llm_version}")


def enviar_para_dlq(message_data: Dict[str, Any], error: str, attempt: int) -> None:
    """
    Envia uma mensagem para a Dead Letter Queue.
    
    Args:
        message_data: Dados da mensagem original
        error: Descrição do erro
        attempt: Número da tentativa que falhou
    """
    logger.warning(f"Enviando ofício para DLQ após {attempt} tentativas")
    
    topic_path = pubsub_publisher.topic_path(PROJECT_ID, DLQ_TOPIC)
    
    dlq_data = {
        **message_data,
        'error': error,
        'failed_at': datetime.utcnow().isoformat(),
        'attempts': attempt
    }
    
    message_bytes = json.dumps(dlq_data).encode('utf-8')
    future = pubsub_publisher.publish(topic_path, message_bytes)
    message_id = future.result()
    
    logger.info(f"Mensagem enviada para DLQ: {message_id}")
    
    # Atualiza o status no Firestore
    try:
        oficio_id = message_data.get('oficio_id')
        org_id = message_data.get('org_id')
        
        if oficio_id and org_id:
            firestore_client.update_oficio(
                org_id,
                oficio_id,
                {
                    'status': OficioStatus.NA_DLQ.value,
                    'erro': error,
                    'dlq_message_id': message_id
                },
                user_id='system'
            )
    except Exception as e:
        logger.error(f"Erro ao atualizar status DLQ no Firestore: {e}")


def handle_pubsub_message(event: Dict[str, Any], context: Any) -> None:
    """
    Handler principal para mensagens Pub/Sub.
    
    Args:
        event: Dados do evento Pub/Sub
        context: Contexto da execução
    """
    try:
        # Decodifica a mensagem Pub/Sub
        if 'data' in event:
            message_data = json.loads(base64.b64decode(event['data']).decode('utf-8'))
        else:
            raise ValueError("Mensagem Pub/Sub sem campo 'data'")
        
        oficio_id = message_data.get('oficio_id')
        org_id = message_data.get('org_id')
        bucket = message_data.get('bucket')
        file_path = message_data.get('file_path')
        is_simulation = message_data.get('is_simulation', False)
        llm_prompt_version_override = message_data.get('llm_prompt_version_override')
        
        # Valida campos obrigatórios
        if not all([oficio_id, org_id, bucket, file_path]):
            raise ValueError(f"Mensagem com campos faltando: {message_data}")
        
        # Obtém o número de tentativas
        attributes = event.get('attributes', {})
        delivery_attempt = int(attributes.get('googclient.deliveryAttempt', 1))
        
        log_prefix = "[SIMULATION] " if is_simulation else ""
        logger.info(f"{log_prefix}Processando mensagem (tentativa {delivery_attempt}): {message_data}")
        
        # Processa o ofício
        processar_oficio(
            oficio_id, 
            org_id, 
            bucket, 
            file_path,
            is_simulation=is_simulation,
            llm_prompt_version_override=llm_prompt_version_override
        )
        
        logger.info(f"Processamento concluído para ofício {oficio_id}")
        
    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {e}", exc_info=True)
        
        # Verifica se deve enviar para DLQ
        delivery_attempt = int(event.get('attributes', {}).get('googclient.deliveryAttempt', 1))
        
        if delivery_attempt >= MAX_RETRIES:
            enviar_para_dlq(message_data, str(e), delivery_attempt)
        else:
            # Re-raise para que o Pub/Sub faça retry
            logger.info(f"Tentativa {delivery_attempt}/{MAX_RETRIES}, permitindo retry")
            raise


# Entry point para Cloud Functions
def process_oficio_async(event, context):
    """Entry point para Cloud Function (Pub/Sub Trigger)"""
    return handle_pubsub_message(event, context)

