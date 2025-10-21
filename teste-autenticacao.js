// 🔍 TESTE DE AUTENTICAÇÃO - Console do Navegador
// Execute no Console do Navegador (F12) em https://oficio.ness.tec.br

console.log('🔍 Testando autenticação...');

// 1. Verificar se Supabase está disponível
if (typeof window.supabase === 'undefined') {
  console.log('❌ Supabase não encontrado. Tentando importar...');
  
  // Tentar importar dinamicamente
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2').then(({ createClient }) => {
    const supabase = createClient(
      'https://ghcqywthubgfenqqxoqb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTkwMjYsImV4cCI6MjA3NjI5NTAyNn0.KJX7au7GZev3uUIkVniMhgvYUQLTCNqn1KwqqTLMz7I'
    );
    
    testAuth(supabase);
  });
} else {
  testAuth(window.supabase);
}

async function testAuth(supabase) {
  try {
    // 2. Verificar sessão atual
    console.log('📋 Verificando sessão atual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro na sessão:', sessionError);
      return;
    }
    
    if (session) {
      console.log('✅ Usuário autenticado:', session.user.email);
      console.log('🔑 Token:', session.access_token ? 'Presente' : 'Ausente');
      
      // 3. Testar API de ofícios pendentes
      console.log('🧪 Testando API de ofícios pendentes...');
      
      const response = await fetch('/api/webhook/oficios/list-pending', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API funcionando:', data);
      } else {
        const error = await response.json();
        console.log('❌ Erro na API:', error);
      }
      
    } else {
      console.log('❌ Usuário não autenticado');
      console.log('💡 Faça login primeiro');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error);
  }
}




