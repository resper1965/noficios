-- Habilitar RLS na tabela oficios
ALTER TABLE public.oficios ENABLE ROW LEVEL SECURITY;

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'oficios';
