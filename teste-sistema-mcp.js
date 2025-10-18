// 🧪 TESTE COMPLETO DO SISTEMA MCP
// Execute no Console do Navegador (F12) em https://oficio.ness.tec.br

console.log('🧪 Iniciando teste completo do sistema MCP...');

async function testarSistemaMCP() {
  try {
    // 1. Verificar autenticação
    console.log('1️⃣ Verificando autenticação...');
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ Usuário não autenticado. Faça login primeiro.');
      return;
    }
    
    console.log('✅ Usuário autenticado:', session.user.email);
    
    // 2. Testar API de ofícios pendentes
    console.log('2️⃣ Testando API de ofícios pendentes...');
    const response = await fetch('/api/webhook/oficios/list-pending', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando:', data);
      console.log(`📊 Total de ofícios: ${data.oficios?.length || 0}`);
      
      if (data.oficios && data.oficios.length > 0) {
        console.log('🎉 Sistema funcionando! Ofícios encontrados:');
        data.oficios.forEach((oficio, index) => {
          console.log(`   ${index + 1}. ${oficio.numero_oficio} - ${oficio.autoridade_emissora}`);
        });
      } else {
        console.log('⚠️ Nenhum ofício encontrado. Execute o SQL de teste primeiro.');
      }
    } else {
      const error = await response.json();
      console.log('❌ Erro na API:', error);
    }
    
    // 3. Testar dashboard MCP
    console.log('3️⃣ Testando dashboard MCP...');
    const mcpResponse = await fetch('/api/mcp/history', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (mcpResponse.ok) {
      const mcpData = await mcpResponse.json();
      console.log('✅ Dashboard MCP funcionando:', mcpData);
    } else {
      console.log('⚠️ Dashboard MCP não configurado ainda');
    }
    
    // 4. Verificar se há dados no banco
    console.log('4️⃣ Verificando dados no banco...');
    const { data: oficios, error: dbError } = await window.supabase
      .from('oficios')
      .select('*')
      .limit(5);
    
    if (dbError) {
      console.log('❌ Erro ao consultar banco:', dbError);
    } else {
      console.log('✅ Banco acessível:', oficios?.length || 0, 'ofícios encontrados');
    }
    
    console.log('🎯 Teste concluído!');
    
  } catch (error) {
    console.log('❌ Erro no teste:', error);
  }
}

// Executar teste
testarSistemaMCP();
