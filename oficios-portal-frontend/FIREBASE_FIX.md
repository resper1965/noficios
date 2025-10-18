# 🔥 FIREBASE - SOLUÇÃO DEFINITIVA

## ❌ ERRO ATUAL:
```
Firebase: Error (auth/requests-from-referer-http://localhost:3000-are-blocked.)
```

## ✅ SOLUÇÃO CORRETA:

### 1. Acesse o Firebase Console:
**URL:** https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings

### 2. Vá em Authorized Domains:
- Authentication → Settings → Authorized domains

### 3. Adicione APENAS estes domínios:
```
localhost
127.0.0.1
```

**⚠️ IMPORTANTE:**
- **NÃO** adicione porta: `localhost:3000` (erro)
- **APENAS** domínio: `localhost` (correto)
- **Firebase aceita apenas domínios sem porta**

### 4. Salve e Teste:
- Clique em "Save"
- Aguarde 30 segundos
- Teste: http://localhost:3000

## 🧪 TESTE RÁPIDO:
1. Abra: `test-firebase-quick.html`
2. Clique: "Testar Firebase"
3. Deve mostrar Status: 200 (não 403)

## ✅ RESULTADO ESPERADO:
Após adicionar `localhost` no Firebase:
- ✅ Status 200 (não mais 403)
- ✅ Login Google funcionará
- ✅ Dashboard acessível

