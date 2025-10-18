# 🔥 FIREBASE - SOLUÇÃO IMEDIATA

## ❌ ERRO ATUAL:
```
Firebase: Error (auth/requests-from-referer-http://localhost:3000-are-blocked.)
```

## 🔧 SOLUÇÃO - SIGA EXATAMENTE:

### 1️⃣ ACESSE O FIREBASE CONSOLE:
**URL:** https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings

### 2️⃣ NAVEGUE PARA AUTHORIZED DOMAINS:
- Clique em **"Authentication"** (menu lateral esquerdo)
- Clique em **"Settings"** (aba superior)
- Role a página para baixo até encontrar **"Authorized domains"**

### 3️⃣ ADICIONE O DOMÍNIO:
- Clique no botão **"Add domain"**
- Digite EXATAMENTE: `localhost`
- **NÃO** adicione porta: `localhost:3000` ❌
- **APENAS** o domínio: `localhost` ✅

### 4️⃣ SALVE:
- Clique em **"Save"** ou **"Update"**
- Aguarde 30 segundos para propagação

### 5️⃣ TESTE:
- Acesse: http://localhost:3000
- Clique em **"Continuar com Google"**
- O login deve funcionar sem erro 403

---

## ⚠️ IMPORTANTE:

### ❌ ERRADO:
```
localhost:3000
http://localhost
http://localhost:3000
127.0.0.1:3000
```

### ✅ CORRETO:
```
localhost
127.0.0.1
```

---

## 🔍 VERIFICAÇÃO:

Após adicionar `localhost` no Firebase, você deve ver:

1. **No Firebase Console:**
   - `localhost` na lista de Authorized domains
   - Status: Ativo

2. **Na aplicação:**
   - Login Google funciona
   - Sem erro 403
   - Redirecionamento para dashboard

---

## 📞 SE NÃO FUNCIONAR:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Aguarde mais 1 minuto
3. Recarregue a página (Ctrl+F5)
4. Tente novamente

---

## ✅ RESULTADO ESPERADO:

Após configurar corretamente:
- ✅ Status 200 (não mais 403)
- ✅ Login Google funcionando
- ✅ Dashboard acessível
- ✅ Aplicação completa funcionando

---

**Configure o Firebase AGORA e teste!** 🎯
