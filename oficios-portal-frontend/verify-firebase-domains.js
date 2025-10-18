// Verificador de Domínios Firebase
console.log('🔧 VERIFICADOR DE DOMÍNIOS FIREBASE');
console.log('=====================================');

// Domínios que DEVEM estar no Firebase Console
const requiredDomains = [
    'localhost',
    '127.0.0.1'
];

console.log('📋 DOMÍNIOS OBRIGATÓRIOS:');
requiredDomains.forEach(domain => {
    console.log(`  ✅ ${domain}`);
});

console.log('\n🔧 INSTRUÇÕES:');
console.log('1. Acesse: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings');
console.log('2. Vá em: Authentication → Settings → Authorized domains');
console.log('3. Adicione CADA domínio da lista acima');
console.log('4. NÃO adicione apenas "localhost" (sem porta)');
console.log('5. SEMPRE inclua a porta: localhost:3000');

console.log('\n⚠️ ERROS COMUNS:');
console.log('❌ localhost (sem porta)');
console.log('❌ http://localhost:3000 (com protocolo)');
console.log('❌ https://localhost:3000 (com protocolo)');
console.log('✅ localhost:3000 (correto)');

console.log('\n🧪 TESTE APÓS CONFIGURAR:');
console.log('1. Acesse: http://localhost:3000');
console.log('2. Clique em "Continuar com Google"');
console.log('3. Deve funcionar sem erro 403');

// Teste de conectividade
async function testFirebaseConnection() {
    const apiKey = 'AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M';
    
    try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${apiKey}`);
        console.log(`\n📡 Status da API Firebase: ${response.status}`);
        
        if (response.status === 403) {
            console.log('❌ ERRO: Domínio não autorizado!');
            console.log('🔧 SOLUÇÃO: Adicione localhost:3000 no Firebase Console');
        } else if (response.status === 200) {
            console.log('✅ API Firebase funcionando!');
        }
    } catch (error) {
        console.log(`❌ Erro de conectividade: ${error.message}`);
    }
}

// Executar teste
testFirebaseConnection();
