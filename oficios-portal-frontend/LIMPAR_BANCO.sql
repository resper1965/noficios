-- ============================================
-- LIMPAR BANCO DE DADOS - n.Oficios
-- ============================================

-- Deletar todos os ofícios de teste
DELETE FROM oficios;

-- Resetar sequence do ID (volta para 1)
ALTER SEQUENCE oficios_id_seq RESTART WITH 1;

-- Verificar
SELECT COUNT(*) as total_oficios FROM oficios;

-- ============================================
-- ✅ BANCO LIMPO!
-- ============================================
-- Agora você pode sincronizar emails reais do Gmail
-- com o marcador INGEST

