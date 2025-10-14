"""
W2: Monitoramento de SLA - Alertas Inteligentes
Cloud Function acionada por Cloud Scheduler (Cron) para monitorar prazos.
Responsabilidades: Verificar ofícios próximos do vencimento, enviar alertas direcionados.
"""
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List

from google.cloud import firestore

# Importa os utilitários
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from utils.api_clients import FirestoreClient
from utils.schema import OficioStatus

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
PROJECT_ID = os.getenv('GCP_PROJECT_ID')
ALERT_WEBHOOK_URL = os.getenv('ALERT_WEBHOOK_URL', '')  # Slack/Teams webhook

# Clientes
firestore_client = FirestoreClient(project_id=PROJECT_ID)
db = firestore.Client(project=PROJECT_ID)


def calcular_horas_restantes(data_limite_iso: str) -> float:
    """
    Calcula horas restantes até a data limite.
    
    Args:
        data_limite_iso: Data limite em formato ISO 8601
        
    Returns:
        Horas restantes (pode ser negativo se vencido)
    """
    try:
        data_limite = datetime.fromisoformat(data_limite_iso.replace('Z', '+00:00'))
        agora = datetime.utcnow()
        delta = data_limite - agora
        return delta.total_seconds() / 3600
    except Exception as e:
        logger.error(f"Erro ao calcular horas restantes: {e}")
        return 999  # Valor alto para evitar alertas falsos


def classificar_urgencia(horas_restantes: float, prioridade: str) -> str:
    """
    Classifica urgência baseada em horas restantes e prioridade.
    
    Args:
        horas_restantes: Horas até o vencimento
        prioridade: Prioridade do ofício (ALTA, MEDIA, BAIXA)
        
    Returns:
        Urgência: CRITICO, URGENTE, ATENCAO, OK
    """
    # Vencido
    if horas_restantes < 0:
        return 'VENCIDO'
    
    # Crítico: menos de 24h
    if horas_restantes < 24:
        return 'CRITICO'
    
    # Urgente: menos de 48h e prioridade ALTA
    if horas_restantes < 48 and prioridade == 'ALTA':
        return 'URGENTE'
    
    # Atenção: menos de 72h
    if horas_restantes < 72:
        return 'ATENCAO'
    
    return 'OK'


def buscar_usuario_info(user_id: str, org_id: str) -> Dict[str, Any]:
    """
    Busca informações do usuário no Firestore.
    
    Args:
        user_id: ID do usuário
        org_id: ID da organização
        
    Returns:
        Dicionário com email, nome, etc.
    """
    try:
        # Busca na coleção users
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return {
                'user_id': user_id,
                'email': user_data.get('email', ''),
                'name': user_data.get('name', user_id),
                'notification_enabled': user_data.get('notification_enabled', True)
            }
        else:
            return {
                'user_id': user_id,
                'email': '',
                'name': user_id,
                'notification_enabled': True
            }
    except Exception as e:
        logger.error(f"Erro ao buscar usuário {user_id}: {e}")
        return {
            'user_id': user_id,
            'email': '',
            'name': user_id,
            'notification_enabled': True
        }


def enviar_alerta(
    oficio: Dict[str, Any],
    urgencia: str,
    destinatarios: List[Dict[str, Any]],
    sem_responsavel: bool = False
) -> bool:
    """
    Envia alerta para destinatários.
    
    Args:
        oficio: Dados do ofício
        urgencia: Nível de urgência
        destinatarios: Lista de destinatários com email/nome
        sem_responsavel: Se True, alerta é marcado como SEM RESPONSÁVEL
        
    Returns:
        True se alerta enviado com sucesso
    """
    try:
        oficio_id = oficio.get('oficio_id')
        dados_extraidos = oficio.get('dados_extraidos', {})
        autoridade = dados_extraidos.get('autoridade_nome', 'Desconhecida')
        processo = dados_extraidos.get('processo_numero', 'N/A')
        data_limite = oficio.get('data_limite', '')
        horas_restantes = calcular_horas_restantes(data_limite)
        
        # Emoji por urgência
        emoji_map = {
            'VENCIDO': '🔴',
            'CRITICO': '⚠️',
            'URGENTE': '🟠',
            'ATENCAO': '🟡',
            'OK': '🟢'
        }
        emoji = emoji_map.get(urgencia, '⚪')
        
        # Monta mensagem
        if sem_responsavel:
            titulo = f"{emoji} ALERTA: Ofício SEM RESPONSÁVEL - {urgencia}"
        else:
            titulo = f"{emoji} ALERTA SLA: {urgencia}"
        
        mensagem = f"""
{titulo}

📋 Ofício ID: {oficio_id}
👤 Autoridade: {autoridade}
📑 Processo: {processo}
⏰ Prazo: {abs(horas_restantes):.1f}h {'VENCIDAS' if horas_restantes < 0 else 'restantes'}
📅 Data Limite: {data_limite[:10]}

{'⚠️ ATENÇÃO: Este ofício NÃO possui responsável atribuído!' if sem_responsavel else ''}

Destinatários:
"""
        for dest in destinatarios:
            mensagem += f"- {dest['name']} ({dest['email']})\n"
        
        mensagem += f"\n🔗 Acesse o portal para gerenciar: /dashboard"
        
        # Log do alerta
        logger.warning(f"ALERTA {urgencia}: {oficio_id} - {autoridade}")
        logger.info(f"Destinatários: {[d['email'] for d in destinatarios]}")
        
        # Envia para webhook (Slack/Teams) se configurado
        if ALERT_WEBHOOK_URL:
            import requests
            payload = {
                'text': mensagem,
                'urgencia': urgencia,
                'oficio_id': oficio_id,
                'sem_responsavel': sem_responsavel
            }
            
            response = requests.post(ALERT_WEBHOOK_URL, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"Alerta enviado para webhook: {oficio_id}")
            else:
                logger.error(f"Erro ao enviar para webhook: {response.status_code}")
        
        # TODO: Integrar com serviço de e-mail (SendGrid, SES, etc)
        # send_email(to=destinatarios, subject=titulo, body=mensagem)
        
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar alerta: {e}", exc_info=True)
        return False


def monitorar_organizacao(org_id: str, org_name: str) -> Dict[str, int]:
    """
    Monitora ofícios de uma organização.
    
    Args:
        org_id: ID da organização
        org_name: Nome da organização
        
    Returns:
        Estatísticas de alertas
    """
    logger.info(f"Monitorando organização: {org_name} ({org_id})")
    
    stats = {
        'total_oficios': 0,
        'vencidos': 0,
        'criticos': 0,
        'urgentes': 0,
        'sem_responsavel': 0,
        'alertas_enviados': 0
    }
    
    # Status que requerem monitoramento
    status_monitorados = [
        OficioStatus.AGUARDANDO_COMPLIANCE.value,
        OficioStatus.EM_ANALISE_COMPLIANCE.value,
        OficioStatus.EM_REVISAO.value,
        OficioStatus.AGUARDANDO_RESPOSTA.value,
        OficioStatus.AGUARDANDO_ENVIO.value
    ]
    
    # Busca ofícios da organização
    query = db.collection('oficios').where('org_id', '==', org_id)
    
    # Busca info do Admin Org (fallback para alertas)
    org_doc = db.collection('organizations').document(org_id).get()
    org_admin_email = ''
    
    if org_doc.exists:
        org_data = org_doc.to_dict()
        org_admin_email = org_data.get('admin_email', '')
    
    for oficio_doc in query.stream():
        oficio = oficio_doc.to_dict()
        oficio['oficio_id'] = oficio_doc.id
        
        status = oficio.get('status')
        
        # Pula se não está em status monitorado
        if status not in status_monitorados:
            continue
        
        stats['total_oficios'] += 1
        
        # Calcula urgência
        data_limite = oficio.get('data_limite', '')
        prioridade = oficio.get('prioridade', 'MEDIA')
        
        if not data_limite:
            logger.warning(f"Ofício {oficio_doc.id} sem data_limite")
            continue
        
        horas_restantes = calcular_horas_restantes(data_limite)
        urgencia = classificar_urgencia(horas_restantes, prioridade)
        
        # Contabiliza
        if urgencia == 'VENCIDO':
            stats['vencidos'] += 1
        elif urgencia == 'CRITICO':
            stats['criticos'] += 1
        elif urgencia == 'URGENTE':
            stats['urgentes'] += 1
        
        # Pula se não requer alerta
        if urgencia == 'OK':
            continue
        
        # Verifica atribuição
        assigned_user_id = oficio.get('assigned_user_id')
        sem_responsavel = not assigned_user_id
        
        if sem_responsavel:
            stats['sem_responsavel'] += 1
        
        # Monta lista de destinatários
        destinatarios = []
        
        if assigned_user_id:
            # Envia para o responsável
            user_info = buscar_usuario_info(assigned_user_id, org_id)
            
            if user_info['notification_enabled'] and user_info['email']:
                destinatarios.append(user_info)
                logger.info(f"Alerta para responsável: {user_info['name']}")
        
        # Se crítico ou sem responsável, inclui Admin Org
        if urgencia in ['VENCIDO', 'CRITICO'] or sem_responsavel:
            if org_admin_email:
                destinatarios.append({
                    'user_id': 'org_admin',
                    'email': org_admin_email,
                    'name': 'Admin da Organização',
                    'notification_enabled': True
                })
                logger.info("Alerta também para Admin Org (crítico ou sem responsável)")
        
        # Envia alerta
        if destinatarios:
            enviado = enviar_alerta(oficio, urgencia, destinatarios, sem_responsavel)
            
            if enviado:
                stats['alertas_enviados'] += 1
                
                # Registra alerta no Firestore
                oficio_ref = db.collection('oficios').document(oficio_doc.id)
                oficio_ref.update({
                    'ultimo_alerta_enviado': datetime.utcnow().isoformat(),
                    'urgencia_atual': urgencia
                })
    
    logger.info(f"Organização {org_name}: {stats}")
    
    return stats


def handle_cron_trigger(event: Dict[str, Any], context: Any) -> None:
    """
    Handler principal para execução Cron.
    
    Args:
        event: Dados do evento Pub/Sub do Cloud Scheduler
        context: Contexto da execução
    """
    try:
        logger.info("=" * 60)
        logger.info("INICIANDO MONITORAMENTO DE SLA")
        logger.info("=" * 60)
        
        # Busca todas as organizações
        orgs_query = db.collection('organizations').stream()
        
        stats_global = {
            'organizacoes_monitoradas': 0,
            'total_oficios': 0,
            'total_alertas': 0,
            'total_vencidos': 0,
            'total_criticos': 0,
            'total_sem_responsavel': 0
        }
        
        for org_doc in orgs_query:
            org_data = org_doc.to_dict()
            org_id = org_doc.id
            org_name = org_data.get('name', org_id)
            
            # Monitora organização
            stats = monitorar_organizacao(org_id, org_name)
            
            # Acumula estatísticas globais
            stats_global['organizacoes_monitoradas'] += 1
            stats_global['total_oficios'] += stats['total_oficios']
            stats_global['total_alertas'] += stats['alertas_enviados']
            stats_global['total_vencidos'] += stats['vencidos']
            stats_global['total_criticos'] += stats['criticos']
            stats_global['total_sem_responsavel'] += stats['sem_responsavel']
        
        # Log final
        logger.info("=" * 60)
        logger.info("MONITORAMENTO CONCLUÍDO")
        logger.info(f"Organizações: {stats_global['organizacoes_monitoradas']}")
        logger.info(f"Ofícios monitorados: {stats_global['total_oficios']}")
        logger.info(f"Alertas enviados: {stats_global['total_alertas']}")
        logger.info(f"Vencidos: {stats_global['total_vencidos']}")
        logger.info(f"Críticos: {stats_global['total_criticos']}")
        logger.info(f"Sem responsável: {stats_global['total_sem_responsavel']}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Erro no monitoramento de SLA: {e}", exc_info=True)
        raise


# Entry point para Cloud Functions
def monitor_sla(event, context):
    """Entry point para Cloud Function (Pub/Sub Trigger via Cloud Scheduler)"""
    return handle_cron_trigger(event, context)





