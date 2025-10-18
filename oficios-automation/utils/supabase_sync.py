"""
Módulo de Sincronização Supabase ↔ Firestore

Permite dual write: Firestore (principal) + Supabase (frontend)
para manter dados consistentes entre backend Python e frontend Next.js
"""

import os
from typing import Dict, Any, Optional
from supabase import create_client, Client
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Cliente Supabase (singleton)
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Obter cliente Supabase (singleton)
    
    Variáveis de ambiente necessárias:
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning('⚠️  SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados')
            logger.warning('Sincronização Supabase desabilitada')
            return None
        
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info('✅ Cliente Supabase inicializado')
    
    return _supabase_client


def transform_firestore_to_supabase(firestore_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma documento Firestore para formato Supabase
    
    Firestore (Python backend):
    {
        "oficio_id": "...",
        "org_id": "...",
        "status": "AGUARDANDO_COMPLIANCE",
        "dados_extraidos": {
            "numero_oficio": "12345",
            "numero_processo": "...",
            "autoridade_emissora": "...",
            "prazo_resposta": "2024-10-25",
            "confianca_geral": 0.72,
            "confiancas_por_campo": {...}
        },
        "conteudo_bruto": "...",
        "anexos_urls": ["..."],
        "user_id": "...",
        ...
    }
    
    Supabase (Frontend):
    {
        "oficio_id": "...",
        "userId": "...",
        "numero": "12345",
        "processo": "...",
        "autoridade": "...",
        "prazo": "2024-10-25",
        "status": "AGUARDANDO_COMPLIANCE",
        "confianca_ia": 0.72,
        "dados_ia": {...},
        "pdfUrl": "...",
        "ocrText": "...",
        "createdAt": "...",
        "updatedAt": "..."
    }
    """
    dados_extraidos = firestore_doc.get('dados_extraidos', {})
    anexos = firestore_doc.get('anexos_urls', [])
    
    # Transformar
    supabase_doc = {
        'oficio_id': firestore_doc.get('oficio_id'),
        'userId': firestore_doc.get('user_id'),
        'numero': dados_extraidos.get('numero_oficio'),
        'processo': dados_extraidos.get('numero_processo'),
        'autoridade': dados_extraidos.get('autoridade_emissora'),
        'prazo': dados_extraidos.get('prazo_resposta'),
        'descricao': dados_extraidos.get('classificacao_intencao'),
        'status': firestore_doc.get('status'),
        'confianca_ia': dados_extraidos.get('confianca_geral', 0),
        'dados_ia': dados_extraidos,  # JSON completo
        'pdfUrl': anexos[0] if anexos else None,
        'ocrText': firestore_doc.get('conteudo_bruto'),
        'createdAt': firestore_doc.get('created_at', datetime.utcnow().isoformat()),
        'updatedAt': firestore_doc.get('updated_at', datetime.utcnow().isoformat()),
    }
    
    # Remover campos None
    return {k: v for k, v in supabase_doc.items() if v is not None}


async def sync_oficio_to_supabase(firestore_doc: Dict[str, Any]) -> bool:
    """
    Sincronizar ofício do Firestore para Supabase (Dual Write)
    
    Args:
        firestore_doc: Documento do Firestore
    
    Returns:
        bool: True se sincronizado com sucesso, False caso contrário
    """
    supabase = get_supabase_client()
    
    if not supabase:
        logger.debug('Supabase não configurado, pulando sincronização')
        return False
    
    try:
        # Transformar formato
        supabase_doc = transform_firestore_to_supabase(firestore_doc)
        oficio_id = supabase_doc.get('oficio_id')
        
        if not oficio_id:
            logger.error('oficio_id ausente no documento Firestore')
            return False
        
        # Upsert (insert ou update)
        response = supabase.table('oficios').upsert(
            supabase_doc,
            on_conflict='oficio_id'
        ).execute()
        
        if response.data:
            logger.info(f'✅ Ofício {oficio_id} sincronizado com Supabase')
            return True
        else:
            logger.warning(f'⚠️  Falha ao sincronizar ofício {oficio_id}')
            return False
    
    except Exception as e:
        logger.error(f'❌ Erro ao sincronizar com Supabase: {e}')
        return False


async def delete_oficio_from_supabase(oficio_id: str, user_id: str) -> bool:
    """
    Deletar ofício do Supabase
    
    Args:
        oficio_id: ID do ofício
        user_id: ID do usuário (para segurança)
    
    Returns:
        bool: True se deletado com sucesso
    """
    supabase = get_supabase_client()
    
    if not supabase:
        return False
    
    try:
        response = supabase.table('oficios').delete().match({
            'oficio_id': oficio_id,
            'userId': user_id
        }).execute()
        
        if response.data:
            logger.info(f'✅ Ofício {oficio_id} deletado do Supabase')
            return True
        return False
    
    except Exception as e:
        logger.error(f'❌ Erro ao deletar do Supabase: {e}')
        return False


async def batch_sync_oficios_to_supabase(firestore_docs: list[Dict[str, Any]]) -> Dict[str, int]:
    """
    Sincronizar múltiplos ofícios em batch
    
    Args:
        firestore_docs: Lista de documentos Firestore
    
    Returns:
        dict: {"success": N, "failed": M}
    """
    supabase = get_supabase_client()
    
    if not supabase:
        return {"success": 0, "failed": len(firestore_docs)}
    
    success = 0
    failed = 0
    
    for doc in firestore_docs:
        result = await sync_oficio_to_supabase(doc)
        if result:
            success += 1
        else:
            failed += 1
    
    logger.info(f'📊 Batch sync: {success} sucesso, {failed} falhas')
    
    return {"success": success, "failed": failed}


# Sincronização síncrona (para contextos não-async)
def sync_oficio_to_supabase_sync(firestore_doc: Dict[str, Any]) -> bool:
    """
    Versão síncrona da sincronização
    Útil quando não pode usar async/await
    """
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(sync_oficio_to_supabase(firestore_doc))

