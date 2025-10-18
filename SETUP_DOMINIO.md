# 🌐 Configuração de Domínio Personalizado - oficio.ness.tec.br

**Domínio:** `oficio.ness.tec.br`  
**Plataforma:** n.Oficios  
**Infraestrutura:** Google Cloud Run

---

## 📋 Pré-requisitos

- [x] Deploy do frontend já realizado
- [x] Acesso ao DNS do domínio `ness.tec.br`
- [x] gcloud CLI configurado

---

## 1️⃣ Mapear Domínio no Cloud Run

### Passo 1: Executar comando de mapeamento

```bash
gcloud run domain-mappings create \
  --service oficios-portal-frontend \
  --domain oficio.ness.tec.br \
  --region southamerica-east1 \
  --project oficio-automation-production-2024
```

### Passo 2: Obter registros DNS necessários

Após o comando acima, você receberá instruções com os registros DNS que precisam ser configurados. Algo como:

```
Please add the following DNS records to your DNS provider:

NAME                           TYPE  DATA
oficio.ness.tec.br            CNAME  ghs.googlehosted.com
```

**Ou pode consultar:**

```bash
gcloud run domain-mappings describe oficio.ness.tec.br \
  --service oficios-portal-frontend \
  --region southamerica-east1 \
  --project oficio-automation-production-2024
```

---

## 2️⃣ Configurar DNS (Registros CNAME)

Acesse o painel DNS do seu provedor (onde `ness.tec.br` está hospedado) e adicione:

### Opção A: CNAME (Recomendado)

```
Tipo:     CNAME
Nome:     oficio
Valor:    ghs.googlehosted.com
TTL:      3600 (1 hora)
```

### Opção B: A Record (se CNAME não for suportado)

Se precisar usar A records, o Google fornecerá IPs específicos. Consulte com:

```bash
gcloud run domain-mappings describe oficio.ness.tec.br \
  --region southamerica-east1 \
  --project oficio-automation-production-2024 \
  --format='get(status.resourceRecords)'
```

---

## 3️⃣ Aguardar Propagação DNS

⏱️ **Tempo de propagação:** 5 minutos a 48 horas (geralmente 15-30 minutos)

### Verificar propagação:

```bash
# Verificar se o DNS está resolvendo
nslookup oficio.ness.tec.br

# Ou
dig oficio.ness.tec.br
```

---

## 4️⃣ Configurar SSL/TLS (Automático)

O Google Cloud Run provisiona **automaticamente** um certificado SSL gerenciado:

- ✅ Certificado Let's Encrypt
- ✅ Renovação automática
- ✅ HTTPS forçado
- ✅ HTTP → HTTPS redirect

**Status do certificado:**

```bash
gcloud run domain-mappings describe oficio.ness.tec.br \
  --region southamerica-east1 \
  --project oficio-automation-production-2024 \
  --format='get(status.certificateStatus)'
```

---

## 5️⃣ Configurar Firebase (Domínios Autorizados)

Após o domínio estar ativo, adicione-o ao Firebase Authentication:

### No Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Selecione: **oficio-automation-production-2024**
3. Vá em: **Authentication → Settings → Authorized domains**
4. Clique em: **Add domain**
5. Adicione: `oficio.ness.tec.br`
6. Salve

---

## 6️⃣ Atualizar Variáveis de Ambiente (CORS)

Atualize as variáveis de ambiente do Cloud Run para incluir o novo domínio:

```bash
gcloud run services update oficios-portal-frontend \
  --region southamerica-east1 \
  --project oficio-automation-production-2024 \
  --set-env-vars="\
NEXT_PUBLIC_FIREBASE_API_KEY=SUA_API_KEY,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oficio-automation-production-2024.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oficio-automation-production-2024,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=oficio-automation-production-2024.appspot.com,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID,\
NEXT_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID,\
NEXT_PUBLIC_API_BASE_URL=https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net"
```

---

## 7️⃣ Testar Acesso

### Acesse o sistema:

```
https://oficio.ness.tec.br
```

### Verificações:

- [ ] ✅ Página carrega (Landing Page)
- [ ] ✅ HTTPS ativo (cadeado verde)
- [ ] ✅ Footer mostra "powered by ness."
- [ ] ✅ Botão "Acessar Plataforma" visível
- [ ] ✅ Login com Google funciona
- [ ] ✅ Redirecionamento para `/dashboard` após login
- [ ] ✅ Página `/security` carrega corretamente

---

## 🔐 Primeiro Acesso - Criando Usuário Admin

### Passo 1: Criar Primeiro Usuário no Firebase

1. Acesse Firebase Console → **Authentication → Users**
2. Clique em **Add user**
3. Crie um usuário com seu e-mail corporativo
4. Anote o **UID** do usuário

### Passo 2: Configurar Custom Claims (Platform Admin)

Você precisa definir as custom claims no Firebase para o primeiro usuário:

**Opção A: Firebase CLI (Node.js)**

```javascript
// set-admin.js
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'oficio-automation-production-2024'
});

const uid = 'SEU_UID_AQUI'; // UID do Firebase Authentication

admin.auth().setCustomUserClaims(uid, {
  role: 'ROLE_PLATFORM_ADMIN',
  org_id: 'platform' // Admin da plataforma, não de uma org específica
}).then(() => {
  console.log('✅ Admin configurado com sucesso!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
```

Execute:
```bash
node set-admin.js
```

**Opção B: Google Cloud Console (Firestore)**

Criar manualmente um documento no Firestore:

1. Acesse: **Firestore Database**
2. Crie coleção: `user_roles`
3. Adicione documento com ID = seu UID
4. Campos:
   ```json
   {
     "uid": "SEU_UID",
     "email": "seu@email.com",
     "role": "ROLE_PLATFORM_ADMIN",
     "org_id": "platform",
     "created_at": "2024-10-10T00:00:00Z"
   }
   ```

---

## 🚀 Primeiros Passos Após Login

### 1. Criar Primeira Organização

Acesse: `https://oficio.ness.tec.br/admin/governance`

**Preencha:**
- Nome: "Minha Empresa Ltda"
- Domínios: `@minhaempresa.com.br` (separados por vírgula)
- E-mail de Ingestão: `oficios@minhaempresa.com.br`
- Modelo LLM: `llama-3.1-8b` (padrão Groq)

Clique em **Criar Organização**.

### 2. Convidar Usuários

No Firebase Authentication, adicione usuários e configure custom claims:

```javascript
// Para Org Admin
{
  role: 'ROLE_ORG_ADMIN',
  org_id: 'org_123' // ID da org criada no passo 1
}

// Para usuário comum
{
  role: 'ROLE_USER',
  org_id: 'org_123'
}
```

### 3. Upload de Base de Conhecimento (RAG)

Acesse: `https://oficio.ness.tec.br/admin/governance`

- Faça upload de documentos (PDF/TXT):
  - Políticas internas
  - Procedimentos
  - Legislação aplicável
  - Templates de resposta

### 4. Testar Ingestion (Simulador)

Use o endpoint de simulação:

```bash
curl -X POST \
  https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/simulate_ingestion \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "Ofício nº 123/2024. Solicitamos informações sobre...",
    "target_domain": "minhaempresa.com.br"
  }'
```

---

## 📧 Configurar E-mail de Ingestão (Opcional)

Para receber ofícios via e-mail:

### Opção 1: Gmail API

1. Configure conta de serviço no GCP
2. Autorize acesso ao Gmail
3. Configure filtro para encaminhar para Cloud Function

### Opção 2: SendGrid Inbound Parse

1. Crie conta SendGrid
2. Configure Inbound Parse
3. Webhook para Cloud Function W1

---

## 🔍 Monitoramento e Logs

### Logs do Cloud Run:

```bash
# Frontend
gcloud run services logs tail oficios-portal-frontend \
  --region southamerica-east1 \
  --project oficio-automation-production-2024

# Filtrar apenas erros
gcloud run services logs tail oficios-portal-frontend \
  --region southamerica-east1 \
  --project oficio-automation-production-2024 \
  --log-filter='severity>=ERROR'
```

### Logs do Backend (Cloud Functions):

```bash
gcloud functions logs read create_organization \
  --region southamerica-east1 \
  --project oficio-automation-production-2024 \
  --limit 50
```

### Métricas (Dashboards):

Acesse: https://console.cloud.google.com/run/detail/southamerica-east1/oficios-portal-frontend/metrics

---

## 🐛 Troubleshooting

### Problema: "Site não acessível"
**Solução:** Aguarde propagação DNS (15-30 min). Verifique com `nslookup oficio.ness.tec.br`

### Problema: "Certificado inválido"
**Solução:** O SSL leva até 15 minutos para ser provisionado após DNS propagado

### Problema: "Erro de autenticação Firebase"
**Solução:** 
1. Verifique se o domínio está em Firebase → Authorized domains
2. Verifique se as env vars estão configuradas corretamente

### Problema: "CORS error"
**Solução:** Adicione o domínio nas Cloud Functions (headers CORS)

### Problema: "Página não carrega"
**Solução:** Verifique logs: `gcloud run services logs tail oficios-portal-frontend`

---

## ✅ Checklist Final

- [ ] Domínio mapeado no Cloud Run
- [ ] DNS configurado (CNAME)
- [ ] SSL/TLS ativo (HTTPS)
- [ ] Firebase domínios autorizados
- [ ] Variáveis de ambiente configuradas
- [ ] Primeiro admin criado
- [ ] Login funcionando
- [ ] Primeira organização criada
- [ ] Base de conhecimento populada
- [ ] Usuários convidados
- [ ] Teste de ingestion realizado

---

## 🎯 URLs Finais

### Frontend (Público):
```
https://oficio.ness.tec.br
```

### Admin Portal:
```
https://oficio.ness.tec.br/admin/governance
```

### Dashboard:
```
https://oficio.ness.tec.br/dashboard
```

### Segurança e Compliance:
```
https://oficio.ness.tec.br/security
```

### Backend API:
```
https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net
```

---

## 📚 Documentação de Referência

- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#configure-oauth-redirect-domains)
- [Cloud Run SSL Certificates](https://cloud.google.com/run/docs/securing/using-https)

---

**🎉 Após seguir este guia, seu sistema estará acessível em:**

# https://oficio.ness.tec.br

*powered by ness.* 💙





