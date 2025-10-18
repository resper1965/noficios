# 🔧 CONFIGURAR OAUTH - Projeto oficio-noficios

## ✅ PROJETO CRIADO COM SUCESSO

**ID do Projeto:** `oficio-noficios`  
**Nome:** Oficio  
**Número:** 746454720729

---

## 📋 PASSO A PASSO COMPLETO

### PASSO 1: Configurar OAuth Consent Screen

Acesse: https://console.cloud.google.com/apis/credentials/consent?project=oficio-noficios

1. Selecione **"External"** (usuários externos)
2. Clique em **"CREATE"**
3. Preencha:
   - **App name:** n.Oficios
   - **User support email:** resper@ness.com.br
   - **App logo:** (opcional - pode adicionar depois)
   - **Application home page:** https://oficio.ness.tec.br
   - **Authorized domains:**
     ```
     ness.tec.br
     supabase.co
     ```
   - **Developer contact:** resper@ness.com.br
4. Clique em **"SAVE AND CONTINUE"**

5. **Scopes** - adicione:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - Clique em **"SAVE AND CONTINUE"**

6. **Test users** (opcional):
   - Adicione: `resper@ness.com.br`
   - Adicione: `resper@bekaa.eu`
   - Clique em **"SAVE AND CONTINUE"**

7. Clique em **"BACK TO DASHBOARD"**

---

### PASSO 2: Criar OAuth 2.0 Client ID

Acesse: https://console.cloud.google.com/apis/credentials?project=oficio-noficios

1. Clique em **"+ CREATE CREDENTIALS"**
2. Selecione **"OAuth 2.0 Client ID"**
3. Preencha:
   - **Application type:** Web application
   - **Name:** n.Oficios Web Client

4. **Authorized JavaScript origins** - adicione:
   ```
   http://localhost:3000
   https://oficio.ness.tec.br
   https://ghcqywthubgfenqqxoqb.supabase.co
   ```

5. **Authorized redirect URIs** - adicione:
   ```
   https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://oficio.ness.tec.br/auth/callback
   ```

6. Clique em **"CREATE"**

---

### PASSO 3: Copiar Credenciais

Após criar, você verá uma tela com:

```
Client ID: xxxxxxx.apps.googleusercontent.com
Client Secret: xxxxxx-xxxxxxxxxxxxxxxxxx
```

**IMPORTANTE:** Copie essas credenciais! Você precisará delas para o próximo passo.

---

### PASSO 4: Configurar no Supabase

Acesse: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers

1. Encontre **Google** na lista de providers
2. Clique para expandir
3. **Habilite** o toggle
4. Cole as credenciais:
   - **Client ID:** (do passo 3)
   - **Client Secret:** (do passo 3)
5. Clique em **"Save"**

---

### PASSO 5: Atualizar Variáveis de Ambiente (Opcional)

Se você quiser manter referência ao projeto no código:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://ghcqywthubgfenqqxoqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTkwMjYsImV4cCI6MjA3NjI5NTAyNn0.KJX7au7GZev3uUIkVniMhgvYUQLTCNqn1KwqqTLMz7I

# Opcional - para referência
GOOGLE_CLOUD_PROJECT=oficio-noficios
```

---

### PASSO 6: Testar

1. **Desenvolvimento:**
   ```bash
   cd oficios-portal-frontend
   npm run dev
   ```
   - Acesse: http://localhost:3000/login
   - Clique em "Continuar com Google"
   - ✅ Deve funcionar sem erro 400

2. **Produção:**
   - Acesse: https://oficio.ness.tec.br/login
   - Clique em "Continuar com Google"
   - ✅ Deve funcionar perfeitamente

---

## 🔍 VERIFICAR CONFIGURAÇÃO

### Via gcloud:
```bash
gcloud projects describe oficio-noficios
```

### Via Web:
- **Credentials:** https://console.cloud.google.com/apis/credentials?project=oficio-noficios
- **Consent Screen:** https://console.cloud.google.com/apis/credentials/consent?project=oficio-noficios

---

## ⚠️ IMPORTANTE

1. **Projeto Anterior (officio-474711):**
   - Foi restaurado mas pode ser descartado
   - O novo projeto `oficio-noficios` é o correto

2. **Domínios Autorizados:**
   - ✅ localhost:3000 (desenvolvimento)
   - ✅ oficio.ness.tec.br (produção)
   - ✅ ghcqywthubgfenqqxoqb.supabase.co (Supabase callback)

3. **Limites do OAuth:**
   - Modo "Testing" permite até 100 usuários
   - Para produção real, publique o app (envia para revisão Google)

---

## 🚀 PRÓXIMOS PASSOS

Após configurar OAuth:

1. Testar login local
2. Fazer deploy na VPS
3. Testar login em produção
4. ✅ Sistema 100% funcional!

---

## 📚 LINKS ÚTEIS

- **Projeto:** https://console.cloud.google.com/home/dashboard?project=oficio-noficios
- **Credentials:** https://console.cloud.google.com/apis/credentials?project=oficio-noficios
- **Supabase Auth:** https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers

---

**✅ Configuração completa em ~10 minutos!** 🎉

