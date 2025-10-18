// 🔑 SCRIPT PARA OBTER CREDENCIAIS OAUTH
// Execute no Console do Navegador (F12) em https://oficio.ness.tec.br

console.log('🔍 Buscando credenciais OAuth...');

// Verificar se Supabase está disponível
if (typeof window.supabase === 'undefined') {
  console.log('❌ Supabase não encontrado. Faça login primeiro.');
} else {
  // Obter sessão atual
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('✅ Credenciais encontradas!');
      console.log('📋 Copie estes valores para o VPS:');
      console.log('');
      console.log('USER_ID="' + session.user.id + '"');
      console.log('ACCESS_TOKEN="' + session.access_token + '"');
      console.log('REFRESH_TOKEN="' + session.refresh_token + '"');
      console.log('');
      console.log('🔧 Agora execute no VPS:');
      console.log('nano /opt/oficios/sync-gmail.sh');
      console.log('# Substitua as linhas USER_ID, ACCESS_TOKEN, REFRESH_TOKEN');
      console.log('# Depois execute: /opt/oficios/sync-gmail.sh');
    } else {
      console.log('❌ Usuário não autenticado. Faça login primeiro.');
    }
  }).catch(error => {
    console.log('❌ Erro ao obter credenciais:', error);
  });
}
