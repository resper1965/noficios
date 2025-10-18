const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghcqywthubgfenqqxoqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTkwMjYsImV4cCI6MjA3NjI5NTAyNn0.KJX7au7GZev3uUIkVniMhgvYUQLTCNqn1KwqqTLMz7I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  try {
    console.log('🔧 Habilitando RLS na tabela oficios...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.oficios ENABLE ROW LEVEL SECURITY;'
    });
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('✅ RLS habilitado com sucesso!');
    
    // Verificar se RLS está habilitado
    const { data: checkData, error: checkError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('tablename', 'oficios');
    
    if (checkError) {
      console.error('❌ Erro ao verificar:', checkError);
      return;
    }
    
    console.log('📊 Status RLS:', checkData);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixRLS();
