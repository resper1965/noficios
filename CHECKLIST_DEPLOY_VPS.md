# ✅ CHECKLIST DEPLOY VPS - n.Oficios

**Data:** 2025-10-18  
**VPS:** 62.72.8.164  
**Tempo Estimado:** 1-2 horas

---

## 📋 PRÉ-REQUISITOS

### **1. Service Account Google** (30min)

**Se ainda não tem:**

1. **Acessar:** https://console.cloud.google.com
2. **Criar projeto:** `n-oficios` (ou usar existente)
3. **Habilitar Gmail API:**
   - APIs & Services > Library
   - Buscar "Gmail API"
   - Enable
4. **Criar Service Account:**
   - IAM & Admin > Service Accounts
   - Create Service Account
   - Name: `gmail-reader`
   - Role: (nenhuma necessária para Domain-Wide Delegation)
5. **Gerar chave:**
   - Click no Service Account
   - Keys > Add Key > Create new key
   - Type: JSON
   - **Download:** `gmail-sa-key.json`
6. **Anotar Client ID:**
   - Abrir gmail-sa-key.json
   - Copiar valor de `"client_id"`

### **2. Domain-Wide Delegation** (15min)

**No Google Workspace Admin:**

1. **Acessar:** https://admin.google.com
2. **Navegar:** Security > API Controls > Domain-wide Delegation
3. **Add new:**
   - Client ID: (do passo anterior)
   - OAuth Scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - Authorize
4. **Aguardar:** Pode levar até 1h para propagar

### **3. Verificar Arquivos Locais**

```bash
# Verificar se existem
ls -la /home/resper/noficios/backend-simple/
ls -la /home/resper/noficios/docker-compose.vps.yml
ls -la /home/resper/noficios/DEPLOY_VPS_AGORA.sh

# Verificar Service Account
ls -la gmail-sa-key.json  # Deve estar na raiz do projeto
```

---

## 🚀 DEPLOY AUTOMÁTICO

### **Opção 1: Script Automático** (Recomendado)

```bash
cd /home/resper/noficios

# Executar script de deploy
./DEPLOY_VPS_AGORA.sh
```

**O script faz:**
- ✅ Empacota backend
- ✅ Envia para VPS
- ✅ Extrai arquivos
- ✅ Build containers
- ✅ Deploy serviços
- ✅ Valida health checks

---

## 📝 DEPLOY MANUAL

### **Passo 1: Enviar Service Account** (5min)

```bash
# Enviar gmail-sa-key.json para VPS
scp gmail-sa-key.json root@62.72.8.164:/opt/oficios/

# Configurar permissões
ssh root@62.72.8.164 "chmod 600 /opt/oficios/gmail-sa-key.json"
```

### **Passo 2: Enviar Backend** (5min)

```bash
cd /home/resper/noficios

# Empacotar
tar -czf backend-simple.tar.gz backend-simple/

# Enviar
scp backend-simple.tar.gz root@62.72.8.164:/opt/oficios/
scp docker-compose.vps.yml root@62.72.8.164:/opt/oficios/docker-compose.yml

# Extrair na VPS
ssh root@62.72.8.164 "cd /opt/oficios && tar -xzf backend-simple.tar.gz && rm backend-simple.tar.gz"
```

### **Passo 3: Configurar Environment** (10min)

```bash
# Na VPS
ssh root@62.72.8.164

cd /opt/oficios

# Criar diretórios
mkdir -p data/emails data/logs

# Atualizar .env.production do frontend
nano oficios-portal-frontend/.env.production

# Adicionar/atualizar:
W0_GMAIL_INGEST_URL=http://backend-python:8000/gmail/ingest
GMAIL_SYNC_API_KEY=<sua-api-key-gerada>

# Salvar e sair (Ctrl+X, Y, Enter)
```

### **Passo 4: Build e Deploy** (15min)

```bash
# Ainda na VPS
cd /opt/oficios

# Parar containers antigos
docker-compose down

# Build novos containers
docker-compose build

# Subir serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### **Passo 5: Validação** (10min)

```bash
# Testar backend
curl http://localhost:8000/health
# Esperado: {"status":"healthy",...}

curl http://localhost:8000/status
# Esperado: {"status":"ok","checks":{...}}

# Testar frontend
curl http://localhost:3000/api/health
# Esperado: {"status":"healthy",...}

# Testar integração frontend → backend
curl -X POST http://localhost:3000/api/gmail/auto-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA-API-KEY" \
  -d '{"email":"resper@ness.com.br","label":"INGEST"}'

# Esperado: {"status":"success","scanned":N,...}
```

---

## 🧪 TESTE COMPLETO END-TO-END

### **1. Preparar Email no Gmail**

1. Acesse Gmail: resper@ness.com.br
2. Envie email para você mesmo com anexo PDF
3. Adicione label "INGEST" ao email

### **2. Executar Sincronização**

```bash
# Na VPS
cd /opt/oficios
./sync-gmail-real.sh
```

### **3. Verificar Resultado**

```bash
# Verificar logs
tail -f /var/log/gmail-sync.log

# Verificar anexos salvos
ls -la /opt/oficios/data/emails/ness.com.br/

# Deve ter PDF salvo!
```

### **4. Verificar Dashboard**

Acessar: http://62.72.8.164:3000/dashboard

---

## ⚠️ TROUBLESHOOTING

### **Erro: Backend não inicia**

```bash
# Ver logs detalhados
docker-compose logs backend-python

# Verificar Service Account
docker exec oficios-backend-python ls -la /app/gmail-sa-key.json

# Deve existir e ter 600 de permissão
```

### **Erro: Gmail API permission denied**

```bash
# Verificar Domain-Wide Delegation
# Pode levar até 1h para propagar
# https://admin.google.com > Security > API Controls
```

### **Erro: Frontend não conecta no backend**

```bash
# Verificar network
docker network ls
docker network inspect oficios_oficios-network

# Backend deve estar na mesma network
# Nome do container: backend-python (no docker-compose)
```

### **Erro: Can't write to /data/emails**

```bash
# Na VPS
chmod -R 777 /opt/oficios/data/emails

# Ou configurar owner correto
chown -R 1000:1000 /opt/oficios/data/
```

---

## ✅ CRITÉRIOS DE SUCESSO

- [ ] Backend rodando: `curl http://localhost:8000/health`
- [ ] Frontend rodando: `curl http://localhost:3000/api/health`
- [ ] Service Account configurado
- [ ] Domain-Wide Delegation ativo
- [ ] Sincronização manual funciona
- [ ] Anexo salvo em /data/emails/
- [ ] Logs funcionando
- [ ] Cron configurado (opcional)

---

## 🎯 RESULTADO ESPERADO

**Após deploy completo:**
```
✅ Backend Python rodando na porta 8000
✅ Frontend Next.js rodando na porta 3000
✅ Comunicação localhost entre containers
✅ Gmail sync funcionando
✅ Anexos salvos localmente
✅ Sistema 100% operacional
```

---

## 📞 SUPORTE

**Logs importantes:**
```bash
# Containers
docker-compose logs -f

# Backend específico
docker-compose logs -f backend-python

# Frontend específico
docker-compose logs -f frontend

# Gmail sync
tail -f /var/log/gmail-sync.log
```

**Comandos úteis:**
```bash
# Restart tudo
docker-compose restart

# Restart só backend
docker-compose restart backend-python

# Ver processes
docker-compose ps

# Entrar no container
docker exec -it oficios-backend-python bash
```

---

**Tempo Total:** 1-2 horas  
**Complexidade:** Média  
**Requisitos:** Service Account + Domain-Wide Delegation

