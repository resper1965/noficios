# 🔥 FIREBASE - SOLUÇÃO AVANÇADA

## ❌ ERRO PERSISTE:
```
Firebase: Error (auth/requests-from-referer-http://localhost:3000-are-blocked.)
```

Você adicionou `localhost` mas o erro continua. Vamos resolver!

---

## 🔍 DIAGNÓSTICO COMPLETO:

### 1️⃣ ABRA O ARQUIVO DE DIAGNÓSTICO:
Abra no navegador: `check-firebase-config.html`

Este arquivo vai:
- ✅ Testar a API Key
- ✅ Verificar a configuração do Firebase
- ✅ Mostrar exatamente qual é o problema
- ✅ Sugerir soluções específicas

---

## 🔧 POSSÍVEIS CAUSAS E SOLUÇÕES:

### ❌ CAUSA 1: Você adicionou o domínio errado

**Verifique no Firebase Console:**
- URL: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings
- Vá em: Authentication → Settings → Authorized domains

**CORRETO:**
```
localhost
```

**ERRADO:**
```
localhost:3000
http://localhost
http://localhost:3000
127.0.0.1:3000
```

**SOLUÇÃO:**
1. REMOVA qualquer entrada com porta (`:3000`)
2. ADICIONE apenas: `localhost` (sem porta, sem http://)
3. Salve e aguarde 1-2 minutos

---

### ⏳ CAUSA 2: Configuração não propagou

**O Firebase pode levar 1-2 minutos para propagar a configuração.**

**SOLUÇÃO:**
1. Aguarde 2 minutos completos após adicionar o domínio
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Recarregue a página com Ctrl+F5
4. Teste novamente

---

### 🔑 CAUSA 3: API Key com restrições

**A API Key pode ter restrições de domínio no Google Cloud Console.**

**VERIFICAR:**
1. Acesse: https://console.cloud.google.com/apis/credentials?project=officio-474711
2. Procure pela API Key: `AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M`
3. Clique para editar

**VERIFIQUE AS RESTRIÇÕES:**

**Opção A - SEM restrições (recomendado para desenvolvimento):**
- Application restrictions: **None**
- API restrictions: **Don't restrict key**

**Opção B - COM restrições (mais seguro):**
- Application restrictions: **HTTP referrers (web sites)**
- Website restrictions:
  ```
  http://localhost/*
  https://localhost/*
  http://127.0.0.1/*
  ```

**SOLUÇÃO:**
1. Se a API Key tiver restrições de domínio, adicione `http://localhost/*`
2. Ou temporariamente remova todas as restrições para testar
3. Salve e aguarde 1 minuto
4. Teste novamente

---

### 🌐 CAUSA 4: Cache do navegador

**O navegador pode estar usando cache da configuração antiga.**

**SOLUÇÃO:**
1. Abra o DevTools (F12)
2. Clique com botão direito no botão de atualizar
3. Selecione "Empty Cache and Hard Reload"
4. OU: Ctrl+Shift+Delete → Limpar cache → Recarregar

---

### 🔄 CAUSA 5: OAuth Consent Screen

**O OAuth Consent Screen também precisa ter o domínio autorizado.**

**VERIFICAR:**
1. Acesse: https://console.cloud.google.com/apis/credentials/consent?project=officio-474711
2. Vá em "OAuth consent screen"
3. Role até "Authorized domains"

**ADICIONE:**
```
localhost
```

**SOLUÇÃO:**
1. Adicione `localhost` nos Authorized domains
2. Salve
3. Aguarde 1 minuto
4. Teste novamente

---

## 🧪 TESTE PASSO A PASSO:

### 1️⃣ TESTE A API KEY DIRETAMENTE:

Abra o terminal e execute:
```bash
curl -s -o /dev/null -w "%{http_code}" "https://identitytoolkit.googleapis.com/v1/projects?key=AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M"
```

**Resultado esperado:** `403` (normal, pois curl não vem de localhost)

### 2️⃣ ABRA O DIAGNÓSTICO NO NAVEGADOR:

```bash
firefox check-firebase-config.html
# OU
google-chrome check-firebase-config.html
# OU abra manualmente no navegador
```

### 3️⃣ CLIQUE EM "EXECUTAR DIAGNÓSTICO COMPLETO"

Isso vai mostrar:
- ✅ Status HTTP da API (deve ser 200, não 403)
- ✅ Configuração do Firebase
- ✅ Informações do sistema
- ✅ Soluções específicas para o seu caso

---

## ✅ SOLUÇÃO GARANTIDA:

Se NADA funcionar, crie uma NOVA API Key:

### 1️⃣ CRIE NOVA API KEY:
```bash
gcloud auth login
gcloud config set project officio-474711
gcloud alpha services api-keys create \
  --display-name="Web Client (Dev)" \
  --api-target=service=identitytoolkit.googleapis.com \
  --allowed-referrers="http://localhost/*,https://localhost/*"
```

### 2️⃣ OBTENHA A NOVA KEY:
```bash
gcloud alpha services api-keys list --project=officio-474711
```

### 3️⃣ ATUALIZE O CÓDIGO:
Edite `src/lib/firebase.ts` e substitua a `apiKey` pela nova

### 4️⃣ TESTE:
```bash
cd oficios-portal-frontend
npm run dev
```

---

## 📞 AINDA NÃO FUNCIONA?

Execute o diagnóstico e me envie:
1. O resultado completo do arquivo `check-firebase-config.html`
2. Print da seção "Authorized domains" do Firebase Console
3. Print das restrições da API Key no Google Cloud Console

---

**🎯 Execute o diagnóstico agora: `check-firebase-config.html`**
