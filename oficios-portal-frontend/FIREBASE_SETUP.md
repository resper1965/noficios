# 🔥 FIREBASE CONSOLE - CONFIGURAÇÃO URGENTE

## ❌ ERRO ATUAL:
```
Firebase: Error (auth/requests-from-referer-http://localhost:3000-are-blocked.)
```

## ✅ SOLUÇÃO:

### 1. Acesse o Firebase Console:
**URL:** https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings

### 2. Navegue para Authorized Domains:
- Clique em **Authentication** (no menu lateral)
- Clique em **Settings** (aba superior)
- Role para baixo até **Authorized domains**

### 3. Adicione os Domínios:
Clique em **"Add domain"** e adicione **EXATAMENTE** (SEM porta):

```
localhost
127.0.0.1
```

**⚠️ IMPORTANTE:**
- **NÃO** adicione porta: `localhost:3000` (erro)
- **APENAS** domínio: `localhost` (correto)
- **NÃO** adicione `http://` ou `https://`
- **Firebase aceita apenas domínios sem porta**

### 4. Salve as Alterações:
- Clique em **"Save"** ou **"Update"**
- Aguarde alguns segundos para propagação

### 5. Teste Imediatamente:
- Acesse: http://localhost:3000
- Clique em "Continuar com Google"
- Deve funcionar sem erro 403

## 🔧 CONFIGURAÇÃO ATUAL:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M",
  authDomain: "officio-474711.firebaseapp.com",
  projectId: "officio-474711",
  storageBucket: "officio-474711.firebasestorage.app",
  messagingSenderId: "491078993287",
  appId: "1:491078993287:web:b123a486df583bd2693f22",
};
```

## 🚨 IMPORTANTE:
- **NÃO** adicione `http://` no domínio
- **APENAS** `localhost:3000` (sem protocolo)
- **AGUARDE** alguns segundos após salvar
- **TESTE** imediatamente após adicionar

## ✅ RESULTADO ESPERADO:
Após adicionar os domínios, o login deve funcionar perfeitamente!
