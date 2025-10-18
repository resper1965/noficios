# 🚀 DEPLOY MANUAL VPS - n.Oficios

## ✅ **BUILD LOCAL CONCLUÍDO**

O build de produção foi executado com sucesso!

**Arquivo gerado:** `/home/resper/noficios-deploy.tar.gz`

---

## 📦 **PRÓXIMOS PASSOS**

### **1. Copiar para VPS**

```bash
# No seu terminal WSL:
scp /home/resper/noficios-deploy.tar.gz root@62.72.8.164:/opt/
```

### **2. SSH na VPS e Descompactar**

```bash
# SSH
ssh root@62.72.8.164

# Ir para diretório
cd /opt

# Backup do atual (se existir)
mv oficios oficios-backup-$(date +%Y%m%d-%H%M%S)

# Criar novo diretório
mkdir -p oficios
cd oficios

# Descompactar
tar -xzf /opt/noficios-deploy.tar.gz

# Remover arquivo compactado
rm /opt/noficios-deploy.tar.gz
```

### **3. Configurar .env na VPS**

```bash
# Ainda na VPS, criar .env
cat > /opt/oficios/.env << 'EOF'
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

# Supabase Service Key (server-side) - OBTER DO DASHBOARD
SUPABASE_SERVICE_KEY=<OBTER_DO_SUPABASE_DASHBOARD>

# Gmail API Configuration
GOOGLE_CLIENT_ID=<SEU_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<SEU_GOOGLE_CLIENT_SECRET>

# Backend Python/GCP
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net
NEXT_PUBLIC_GCP_PROJECT_ID=oficio-noficios
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios
# FIREBASE_ADMIN_TOKEN=<configurar quando backend Python estiver conectado>

# Domínio
NEXT_PUBLIC_SITE_URL=https://oficio.ness.tec.br
EOF
```

**⚠️ IMPORTANTE:** Obter `SUPABASE_SERVICE_KEY`:
1. Ir ao [Supabase Dashboard](https://app.supabase.com/project/ghcqywthubgfenqqxoqb/settings/api)
2. Copiar "service_role" key
3. Substituir `<OBTER_DO_SUPABASE_DASHBOARD>` no .env acima

### **4. Rebuild Docker**

```bash
# Ainda na VPS
cd /opt/oficios

# Parar containers
docker-compose down

# Limpar cache
docker system prune -f --volumes

# Rebuild sem cache
docker-compose build --no-cache --force-rm

# Iniciar
docker-compose up -d --force-recreate

# Aguardar 15 segundos
sleep 15

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs --tail=100
```

### **5. Verificar Aplicação**

```bash
# No navegador:
https://oficio.ness.tec.br

# Deve carregar a aplicação com:
# ✅ Login funcionando
# ✅ Dashboard com seção HITL
# ✅ Portal HITL em /revisao/[id]
# ✅ PDF Viewer com react-pdf
# ✅ Toast notifications
```

---

## 🔧 **SE DER ERRO NO DOCKER**

### **Erro: "Cannot find module 'react-pdf'"**

```bash
# SSH na VPS
ssh root@62.72.8.164
cd /opt/oficios

# Instalar dependências dentro do container
docker-compose exec app npm install

# Ou rebuild completo
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### **Erro: "SUPABASE_SERVICE_KEY invalid"**

```bash
# 1. Obter key correta do Supabase Dashboard
# 2. Editar .env na VPS
nano /opt/oficios/.env

# 3. Restart
docker-compose restart
```

---

## 🧪 **TESTES PÓS-DEPLOY**

### **1. Health Check**
```bash
curl https://oficio.ness.tec.br
# Esperado: HTTP 200
```

### **2. Login**
```
1. Abrir: https://oficio.ness.tec.br/login
2. Login com Google
3. Deve redirecionar para /dashboard
```

### **3. Portal HITL**
```
1. Acessar: https://oficio.ness.tec.br/revisao/mock-1
2. Verificar:
   ✅ Wizard 4 passos aparece
   ✅ PDF placeholder carrega
   ✅ Toast notifications funcionam
   ✅ Formulário salva
```

---

## 📊 **LOGS**

```bash
# Ver logs em tempo real
ssh root@62.72.8.164
cd /opt/oficios
docker-compose logs -f

# Filtrar erros
docker-compose logs | grep -E 'ERROR|WARN|❌'
```

---

## ✅ **CHECKLIST DE VERIFICAÇÃO**

- [ ] Arquivo `noficios-deploy.tar.gz` copiado para VPS
- [ ] Descompactado em `/opt/oficios`
- [ ] `.env` configurado com TODAS as variáveis
- [ ] `SUPABASE_SERVICE_KEY` obtida e configurada
- [ ] Docker rebuild executado
- [ ] Containers rodando (docker ps)
- [ ] HTTP 200 em https://oficio.ness.tec.br
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Portal HITL acessível

---

## 🚀 **RESUMO DO DEPLOY**

**Status:** ✅ Build local concluído  
**Próximo:** Copiar para VPS e rebuild Docker

**Comandos:**
```bash
# 1. Copiar
scp /home/resper/noficios-deploy.tar.gz root@62.72.8.164:/opt/

# 2. SSH e descompactar (ver acima)

# 3. Rebuild Docker (ver acima)
```

**Tempo estimado:** 10-15 minutos

---

**Aguardando você copiar para VPS...** 📦

