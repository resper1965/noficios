-- ============================================
-- SUPABASE STORAGE SETUP - Anexos de Ofícios
-- ============================================

-- 1. Criar bucket para anexos (execute via Dashboard ou SQL)
-- https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/storage/buckets

-- Via SQL (requer permissões admin):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'oficios-anexos',
  'oficios-anexos',
  true, -- Público para facilitar acesso
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. POLÍTICAS RLS PARA STORAGE
-- ============================================

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'oficios-anexos'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários vejam próprios anexos
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'oficios-anexos'
  -- O path é: {oficioId}/{filename}
  -- Verificar se o ofício pertence ao usuário
  AND EXISTS (
    SELECT 1 FROM oficios
    WHERE id::text = SPLIT_PART(name, '/', 1)
    AND "userId" = auth.jwt()->>'email'
  )
);

-- Permitir que usuários deletem próprios anexos
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'oficios-anexos'
  AND EXISTS (
    SELECT 1 FROM oficios
    WHERE id::text = SPLIT_PART(name, '/', 1)
    AND "userId" = auth.jwt()->>'email'
  )
);

-- ============================================
-- 3. FUNÇÃO AUXILIAR: Obter tamanho total de anexos
-- ============================================

CREATE OR REPLACE FUNCTION get_user_storage_usage(user_email TEXT)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
  FROM storage.objects
  WHERE bucket_id = 'oficios-anexos'
  AND EXISTS (
    SELECT 1 FROM oficios
    WHERE id::text = SPLIT_PART(name, '/', 1)
    AND "userId" = user_email
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Ver buckets criados
SELECT * FROM storage.buckets WHERE id = 'oficios-anexos';

-- Ver políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'oficios-anexos';

-- ============================================
-- ✅ STORAGE CONFIGURADO!
-- ============================================

-- PRÓXIMOS PASSOS:
-- 1. Habilitar bucket via Dashboard (se não funcionar via SQL)
-- 2. Testar upload via API
-- 3. Integrar com Gmail sync para baixar anexos automaticamente

