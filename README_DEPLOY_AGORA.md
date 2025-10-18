# 🚀 DEPLOY AGORA - Comandos Rápidos

## ✅ **BUILD CONCLUÍDO COM SUCESSO**

**Arquivo criado:** `/home/resper/noficios-deploy.tar.gz` (211KB)

---

## 📋 **EXECUTAR ESTES COMANDOS NA VPS**

### **1. Copiar arquivo (do seu terminal local WSL):**

```bash
scp /home/resper/noficios-deploy.tar.gz root@62.72.8.164:/opt/
```

### **2. SSH na VPS e executar:**

```bash
ssh root@62.72.8.164

# ─────────────────────────────────────────────────────────
# Comandos na VPS:
# ─────────────────────────────────────────────────────────

cd /opt

# Backup do atual
mv oficios oficios-backup-$(date +%Y%m%d-%H%M%S)

# Criar novo diretório
mkdir -p oficios
cd oficios

# Descompactar
tar -xzf /opt/noficios-deploy.tar.gz

# Configurar .env (IMPORTANTE!)
nano .env

# ⚠️ Cole o conteúdo abaixo e ajuste SUPABASE_SERVICE_KEY:
```

### **3. Conteúdo do .env:**

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=officio-474711.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=officio-474711
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=officio-474711.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=491078993287
NEXT_PUBLIC_FIREBASE_APP_ID=1:491078993287:web:b123a486df583bd2693f22

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ghcqywthubgfenqqxoqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTkwMjYsImV4cCI6MjA3NjI5NTAyNn0.KJX7au7GZev3uUIkVniMhgvYUQLTCNqn1KwqqTLMz7I

# ⚠️ OBTER DO DASHBOARD: https://app.supabase.com/project/ghcqywthubgfenqqxoqb/settings/api
# Copiar "service_role" key e colar abaixo:
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDcxOTAyNiwiZXhwIjoyMDc2Mjk1MDI2fQ.YOUR_SERVICE_KEY_HERE

# Gmail API
GOOGLE_CLIENT_ID=<SEU_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<SEU_GOOGLE_CLIENT_SECRET>

# Backend Python
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net
NEXT_PUBLIC_GCP_PROJECT_ID=oficio-noficios
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios

# Site
NEXT_PUBLIC_SITE_URL=https://oficio.ness.tec.br
```

**Salvar:** `Ctrl+X` → `Y` → `Enter`

### **4. Rebuild Docker:**

```bash
# Ainda na VPS (/opt/oficios)
docker-compose down
docker system prune -f --volumes
docker-compose build --no-cache --force-rm
docker-compose up -d --force-recreate

# Aguardar containers iniciarem
sleep 15

# Ver status
docker-compose ps

# Ver logs
docker-compose logs --tail=50
```

### **5. Testar:**

```bash
# Health check
curl https://oficio.ness.tec.br

# Deve retornar HTTP 200
```

Abrir navegador:
- `https://oficio.ness.tec.br/login`
- `https://oficio.ness.tec.br/dashboard`
- `https://oficio.ness.tec.br/revisao/mock-1`

---

## ✅ **FEATURES DEPLOYADAS**

Após este deploy, terá na VPS:

✅ **Portal HITL completo**
- Wizard 4 passos guiados
- PDF Viewer profissional (react-pdf)
- Toast notifications elegantes
- Badges de confiança

✅ **Integrações**
- API Gateway → Backend Python
- Dual Auth (Supabase + Firebase)
- Lista de usuários dinâmica
- Sincronização Supabase ↔ Firestore

✅ **Dashboard**
- Seção "Ofícios Aguardando Revisão"
- Stats melhorados
- Notificações

---

## 📝 **RESUMO DO PROCESSO**

```
1. ✅ Build local concluído (Next.js 15)
2. ✅ Arquivo tar.gz criado (211KB)
3. 🔴 Copiar para VPS: scp noficios-deploy.tar.gz root@62.72.8.164:/opt/
4. 🔴 SSH e descompactar
5. 🔴 Configurar .env (SUPABASE_SERVICE_KEY!)
6. 🔴 Rebuild Docker
7. 🔴 Testar aplicação
```

---

## 🎯 **PRÓXIMO PASSO IMEDIATO**

**Execute agora:**

```bash
scp /home/resper/noficios-deploy.tar.gz root@62.72.8.164:/opt/
```

Depois me avise que vou guiar nos próximos passos! 🚀

