# ✅ CHECKLIST DE DEPLOY - n.Oficios

## 📋 **PRÉ-DEPLOY**

### **1. Variáveis de Ambiente** 🔴 CRÍTICO

#### **Frontend (.env ou .env.local):**
```bash
# Supabase ✅ (já configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_KEY=eyJhbGciOiJ... (server-side)

# Firebase 🔴 (CONFIGURAR)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oficio-noficios.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oficio-noficios
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=oficio-noficios.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (server-side) 🔴 (CONFIGURAR)
GOOGLE_APPLICATION_CREDENTIALS=/opt/oficios/serviceAccountKey.json

# Backend Python 🔴 (CONFIGURAR)
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios
FIREBASE_ADMIN_TOKEN=<obter_do_service_account>
```

#### **Como obter Firebase Config:**
1. [Firebase Console](https://console.firebase.google.com/project/oficio-noficios/settings/general/web)
2. Copiar "SDK setup and configuration"
3. Baixar Service Account Key (Settings → Service Accounts)

---

### **2. Dependências Instaladas** ✅

```bash
cd oficios-portal-frontend

# Verificar
npm list react-hot-toast react-pdf pdfjs-dist firebase firebase-admin

# Esperado:
# ✅ react-hot-toast@2.x.x
# ✅ react-pdf@7.x.x
# ✅ pdfjs-dist@3.x.x
# 🔴 firebase (INSTALAR)
# 🔴 firebase-admin (INSTALAR)
```

**Se faltando:**
```bash
npm install firebase firebase-admin
```

---

### **3. Build Local** 🧪

```bash
cd oficios-portal-frontend

# Build de produção
npm run build

# Esperado: ✅ compiled successfully
```

**Se houver erros:**
- Verificar todas variáveis de ambiente
- Rodar `npm run lint -- --fix`
- Corrigir imports

---

### **4. Service Account Key** 🔐 CRÍTICO

```bash
# 1. Baixar do Firebase Console
# Settings → Service Accounts → Generate new private key

# 2. Salvar como serviceAccountKey.json
# ⚠️ NUNCA commitar no git!

# 3. Adicionar ao .gitignore
echo "serviceAccountKey.json" >> .gitignore
echo "*.json" >> .gitignore

# 4. Para VPS, copiar via SCP:
scp serviceAccountKey.json root@62.72.8.164:/opt/oficios/
```

---

## 🚀 **DEPLOY VPS**

### **Método 1: Script Automático** (Recomendado)

```bash
cd oficios-portal-frontend

# 1. Garantir que .env está configurado localmente
# 2. Executar script
./deploy-hitl.sh
```

**O script faz:**
- ✅ Build local
- ✅ Cria .env.deploy
- ✅ Rsync para VPS
- ✅ Rebuild Docker (--no-cache)
- ✅ Restart containers
- ✅ Teste HTTP

**Tempo:** ~5 minutos

---

### **Método 2: Manual (Passo a Passo)**

```bash
# 1. Build local
cd oficios-portal-frontend
npm run build

# 2. Criar .env para produção
cat > .env.production << EOF
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oficio-noficios.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oficio-noficios
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios
EOF

# 3. Sync com VPS
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@62.72.8.164:/opt/oficios/

# 4. Copiar .env
scp .env.production root@62.72.8.164:/opt/oficios/.env

# 5. Copiar Service Account Key
scp serviceAccountKey.json root@62.72.8.164:/opt/oficios/

# 6. SSH na VPS
ssh root@62.72.8.164

# 7. Rebuild Docker
cd /opt/oficios
docker-compose down
docker system prune -f --volumes
docker-compose build --no-cache --force-rm
docker-compose up -d --force-recreate

# 8. Verificar logs
docker-compose logs -f
```

---

## 🧪 **TESTES PÓS-DEPLOY**

### **1. Smoke Tests** (Básico)

```bash
# 1. Health check
curl https://oficio.ness.tec.br

# Esperado: HTTP 200

# 2. Login
# Abrir: https://oficio.ness.tec.br/login
# Fazer login com Google
# Esperado: Redirect para /dashboard

# 3. Dashboard
# Verificar:
# ✅ Stats carregam
# ✅ Seção HITL aparece (se houver pendentes)
# ✅ Tabela de ofícios carrega

# 4. Portal HITL (se houver pendente)
# Clicar "REVISAR AGORA"
# Esperado:
# ✅ PDF carrega
# ✅ Wizard funciona
# ✅ Formulário salva
```

---

### **2. Fluxo Completo HITL** (Avançado)

```bash
# 1. Processar email via W1 (backend Python)
# Enviar email teste para caixa INGEST

# 2. Aguardar processamento (1-2 minutos)
# W1 → OCR + LLM → Firestore → Supabase

# 3. Refresh dashboard
# Deve aparecer em "Aguardando Revisão"

# 4. Clicar "REVISAR AGORA"
# ✅ PDF carrega (react-pdf)
# ✅ Dados IA aparecem com confiança

# 5. Aprovar ofício
# ✅ Toast: "Aprovando ofício..."
# ✅ Toast: "Ofício aprovado!"
# ✅ Redirect para dashboard

# 6. Verificar backend (logs GCP)
# ✅ W3 recebeu aprovação
# ✅ W4 foi disparado (Pub/Sub)
# ✅ Status: APROVADO_COMPLIANCE

# 7. Aguardar W4 gerar resposta (~30s)
# ✅ Status: AGUARDANDO_RESPOSTA
```

---

## 🐛 **TROUBLESHOOTING**

### **Erro: "Firebase not configured"**
```
Causa: Variáveis Firebase ausentes
Solução: Adicionar ao .env (ver seção 1)
```

### **Erro: "FIREBASE_ADMIN_TOKEN invalid"**
```
Causa: Token inválido ou expirado
Solução: 
1. Gerar novo token do Service Account
2. Atualizar .env na VPS
3. Restart: docker-compose restart
```

### **Erro: "Backend Python unreachable"**
```
Causa: Cloud Functions offline ou URL errada
Solução:
1. Verificar PYTHON_BACKEND_URL
2. Testar: curl https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
3. Sistema usa fallback Supabase automaticamente
```

### **Erro: "PDF não carrega"**
```
Causa: CORS ou URL inválida
Solução:
1. Verificar pdfUrl no network tab
2. Configurar CORS no Cloud Storage
3. Fallback: usar visualização de texto OCR
```

---

## 📊 **MONITORAMENTO**

### **Logs para verificar:**

```bash
# 1. Frontend (VPS)
ssh root@62.72.8.164
cd /opt/oficios
docker-compose logs -f | grep -E 'ERROR|WARNING|✅|❌'

# Esperado:
# ✅ Webhook Update: approve_compliance
# ✅ Sincronizado com Supabase

# 2. Backend Python (GCP)
gcloud functions logs read webhook-update --limit=50

# Esperado:
# ✅ W3: Aprovação recebida - Ofício xxx
# ✅ Firestore atualizado
# 📤 W4 disparado via Pub/Sub
```

---

## ✅ **CHECKLIST FINAL**

### **Antes de Deploy:**
- [ ] Todas variáveis de ambiente configuradas
- [ ] Service Account Key baixado
- [ ] `npm install` completo
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros
- [ ] Git committed e pushed

### **Durante Deploy:**
- [ ] `./deploy-hitl.sh` executado
- [ ] Docker rebuild sem erros
- [ ] Containers iniciados (docker ps)
- [ ] HTTP 200 em health check

### **Pós-Deploy:**
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Portal HITL acessível
- [ ] PDF viewer funciona
- [ ] Toast notifications aparecem
- [ ] API Gateway responde
- [ ] Backend Python conectado

---

## 🎯 **CRITÉRIOS DE SUCESSO**

Aplicação está **PRODUÇÃO READY** quando:

- [x] Portal HITL 100% implementado
- [x] Integração Backend Python completa
- [x] API Gateway funcionando
- [x] Toasts em todas ações
- [x] PDF Viewer profissional
- [x] Lista usuários dinâmica
- [ ] Firebase configurado e funcionando
- [ ] Deploy VPS sem erros
- [ ] Testes E2E passando
- [ ] Fluxo HITL completo testado

**Progresso:** 6/10 (60% já feito)

---

## 🚀 **PRÓXIMO PASSO**

1. **Configurar Firebase** (1 hora)
2. **Instalar firebase/firebase-admin** (5 min)
3. **Deploy VPS** (5 min)
4. **Testar fluxo completo** (30 min)

**Tempo total:** ~2 horas

---

**Pronto para deploy! 🎉**

