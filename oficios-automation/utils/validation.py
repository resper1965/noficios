"""
Módulo de validação de dados de ofícios.
Funções auxiliares para validação de documentos e cálculos de prioridade.
"""
import re
from datetime import datetime, timedelta
from typing import Dict, Tuple

from .schema import OficioData


def validar_cpf(cpf: str) -> bool:
    """
    Valida um CPF brasileiro usando o algoritmo de dígitos verificadores.
    
    Args:
        cpf: String com o CPF (com ou sem formatação)
        
    Returns:
        True se CPF válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais (CPF inválido)
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
    Valida um CNPJ brasileiro usando o algoritmo de dígitos verificadores.
    
    Args:
        cnpj: String com o CNPJ (com ou sem formatação)
        
    Returns:
        True se CNPJ válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verifica se todos os dígitos são iguais (CNPJ inválido)
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


def extrair_e_validar_documentos(texto: str) -> Dict[str, list]:
    """
    Encontra e valida CPFs e CNPJs em um texto.
    
    Args:
        texto: Texto a ser analisado
        
    Returns:
        Dicionário com listas de CPFs e CNPJs válidos e inválidos
    """
    # Padrões regex para CPF e CNPJ
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


def calcular_data_limite(data_recebimento: datetime, prazo_dias: int) -> str:
    """
    Calcula a data limite baseada na data de recebimento e prazo em dias.
    
    Args:
        data_recebimento: Data de recebimento do ofício
        prazo_dias: Prazo em dias para resposta
        
    Returns:
        Data limite em formato ISO 8601
    """
    data_limite = data_recebimento + timedelta(days=prazo_dias)
    return data_limite.isoformat()


def calcular_prioridade(data_limite_iso: str) -> str:
    """
    Calcula a prioridade baseada no tempo até a data limite.
    
    Args:
        data_limite_iso: Data limite em formato ISO 8601
        
    Returns:
        Prioridade: 'ALTA', 'MEDIA' ou 'BAIXA'
    """
    data_limite = datetime.fromisoformat(data_limite_iso.replace('Z', '+00:00'))
    agora = datetime.utcnow()
    
    # Calcula horas até o vencimento
    horas_restantes = (data_limite - agora).total_seconds() / 3600
    
    # Menos de 72 horas = ALTA prioridade
    if horas_restantes < 72:
        return 'ALTA'
    # Entre 72h e 168h (7 dias) = MEDIA prioridade
    elif horas_restantes < 168:
        return 'MEDIA'
    # Mais de 7 dias = BAIXA prioridade
    else:
        return 'BAIXA'


def validate_document_fields(data: OficioData) -> Tuple[bool, Dict[str, any]]:
    """
    Valida os campos de documento do OficioData e calcula informações adicionais.
    
    Esta função:
    1. Valida CPF/CNPJ presentes no raw_text
    2. Calcula data_limite_iso baseada no prazo_dias
    3. Calcula prioridade baseada na data_limite
    
    Args:
        data: Instância de OficioData
        
    Returns:
        Tupla (is_valid, informacoes_adicionais)
        - is_valid: True se todas as validações passaram
        - informacoes_adicionais: Dict com documentos validados, data_limite_iso e prioridade
    """
    # 1. Valida documentos no texto
    documentos_validados = extrair_e_validar_documentos(data.raw_text)
    
    # Também verifica no nome da autoridade
    docs_autoridade = extrair_e_validar_documentos(data.autoridade_nome)
    
    # Combina os resultados
    for key in documentos_validados.keys():
        documentos_validados[key].extend(docs_autoridade[key])
        # Remove duplicatas
        documentos_validados[key] = list(set(documentos_validados[key]))
    
    # Verifica se há documentos inválidos (warning, não bloqueia)
    tem_documentos_invalidos = (
        len(documentos_validados['cpfs_invalidos']) > 0 or 
        len(documentos_validados['cnpjs_invalidos']) > 0
    )
    
    # 2. Calcula data_limite_iso
    # Se não tiver data_recebimento, usa agora
    data_recebimento = datetime.utcnow()
    data_limite_iso = calcular_data_limite(data_recebimento, data.prazo_dias)
    
    # 3. Calcula prioridade
    prioridade = calcular_prioridade(data_limite_iso)
    
    # Monta informações adicionais
    informacoes_adicionais = {
        'documentos_validados': documentos_validados,
        'data_limite_iso': data_limite_iso,
        'prioridade': prioridade,
        'data_recebimento_iso': data_recebimento.isoformat(),
        'tem_documentos_invalidos': tem_documentos_invalidos
    }
    
    # Validação é bem-sucedida se não há erros críticos
    # Documentos inválidos são apenas warning
    is_valid = True
    
    return is_valid, informacoes_adicionais


def validar_formato_email(email: str) -> bool:
    """
    Valida formato básico de e-mail.
    
    Args:
        email: String com e-mail
        
    Returns:
        True se formato válido
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def extrair_dominio_email(email: str) -> str:
    """
    Extrai o domínio de um endereço de e-mail.
    
    Args:
        email: Endereço de e-mail
        
    Returns:
        Domínio do e-mail
    """
    if '@' in email:
        return email.split('@')[1].lower()
    return email.lower()





