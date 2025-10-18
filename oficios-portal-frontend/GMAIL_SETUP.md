# 📧 Gmail API - Configuração Completa

## 🎯 OBJETIVO
Configurar Gmail API para importar ofícios automaticamente do email.

---

## 📋 PASSO 1: CONFIGURAR OAUTH NO GOOGLE CLOUD

### **1. Acesse o Google Cloud Console:**
```
https://console.cloud.google.com/apis/credentials?project=officio-474711
```

### **2. Habilitar Gmail API:**
1. Clique em **"+ ENABLE APIS AND SERVICES"**
2. Busque: **Gmail API**
3. Clique em **"Gmail API"**
4. Clique em **"ENABLE"**

### **3. Criar OAuth Client ID:**
1. Volte para **"Credentials"**
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione **"OAuth client ID"**
4. **Application type:** Web application
5. **Name:** n.Oficios Gmail Integration
6. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://oficio.ness.tec.br
   ```
7. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/gmail/callback
   https://oficio.ness.tec.br/api/auth/gmail/callback
   ```
8. Clique em **"CREATE"**

### **4. Salvar Credenciais:**
Você receberá:
- **Client ID:** `xxxxx.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxxxx`

**IMPORTANTE:** Copie e salve esses valores!

---

## 📋 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

Adicione ao `.env.local`:

```env
# Gmail API
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# OpenAI (para parsing inteligente)
OPENAI_API_KEY=sk-xxxxx
```

---

## 📋 PASSO 3: CONFIGURAR OAUTH CONSENT SCREEN

Se ainda não configurou:

1. Vá em **"OAuth consent screen"**
2. **User Type:** External
3. **App name:** n.Oficios
4. **User support email:** resper@ness.com.br
5. **Developer contact:** resper@ness.com.br
6. **Scopes:** Adicione:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
7. **Test users:** Adicione seu email (resper@ness.com.br)
8. Salve

---

## 🔧 COMO FUNCIONARÁ:

### **1. Conexão Gmail:**
```
Usuário clica em "Conectar Gmail"
    ↓
OAuth Google (permissão de acesso)
    ↓
Token salvo no Supabase
```

### **2. Sincronização:**
```
Botão "Sincronizar Email" ou Automático (cron)
    ↓
Gmail API busca emails novos
    ↓
Filtra: assunto contém "ofício" ou "oficio"
    ↓
Para cada email:
    ↓
Parser extrai dados
    ↓
GPT-4 valida e completa
    ↓
Download PDFs anexados
    ↓
Cria ofício no Supabase
    ↓
Notifica usuário
```

### **3. Parser de Email:**
**Busca por padrões:**
- Número do ofício: `Ofício nº 12345` ou `Of. 12345`
- Processo: `1234567-89.2024.1.00.0000`
- Prazo: `até 19/10/2024` ou `prazo: 19/10/2024`
- Autoridade: Nome do órgão emissor

**Exemplo de email:**
```
De: tribunal@tjsp.jus.br
Assunto: Ofício nº 12345 - Processo 1234567-89.2024.1.00.0000

Prezado,

Encaminhamos Ofício nº 12345 referente ao processo
1234567-89.2024.1.00.0000, solicitando informações.

Prazo para resposta: até 19/10/2024.

Tribunal de Justiça de São Paulo
```

**Parser extrai:**
- Número: 12345
- Processo: 1234567-89.2024.1.00.0000
- Prazo: 2024-10-19
- Autoridade: Tribunal de Justiça de São Paulo

---

## 🤖 IA PARA VALIDAÇÃO

**GPT-4 valida e completa:**
```typescript
const prompt = `
Analise este email e extraia:
- Número do ofício
- Número do processo
- Prazo de resposta
- Órgão emissor

Email: ${emailBody}

Retorne JSON:
{
  "numero": "12345",
  "processo": "1234567-89.2024.1.00.0000",
  "prazo": "2024-10-19T23:59:59Z",
  "autoridade": "Tribunal de Justiça de São Paulo",
  "descricao": "Resumo extraído"
}
`;
```

---

## ✅ RESULTADO FINAL

**Você receberá:**
- ✅ Ofícios importados automaticamente
- ✅ PDFs anexados baixados
- ✅ Dados extraídos e validados
- ✅ Notificação de novos ofícios
- ✅ Revisão manual opcional

---

**Aguarde a implementação completa!** 🚀

