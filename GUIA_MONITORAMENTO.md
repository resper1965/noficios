# 🔍 Guia de Monitoramento - n.Oficios

**Versão:** 1.0  
**Tipo:** Monitoramento Básico (sem Grafana/Prometheus)

---

## 📊 O QUE FOI IMPLEMENTADO

### **1. Logs Estruturados ✅**
- **Rotation:** Automática (10MB max, 3 arquivos)
- **Localização:** `/var/www/noficios/data/logs/`
- **Formato:** JSON structured logs

### **2. Health Checks ✅**
- **Frontend:** `/api/health` (60s start period)
- **Backend:** `/health` (40s start period)
- **Docker:** Auto-restart se unhealthy

### **3. Alertas Automáticos ✅**
- **Disco:** Verifica a cada 5 min (alerta se >80%)
- **Containers:** Verifica a cada 2 min (restart automático)
- **Logs velhos:** Limpeza automática (7 dias)

### **4. Scripts de Gestão ✅**
- `noficios-status.sh` - Status completo do sistema
- `noficios-backup.sh` - Info sobre backups
- `check-disk-space.sh` - Verifica espaço em disco
- `check-containers.sh` - Verifica containers

---

## 🚀 COMO USAR

### **Ver Status Geral:**
```bash
noficios-status.sh
```

**Saída:**
- Status de todos containers
- Uso de disco
- Health checks
- Últimos 5 logs de cada serviço

### **Ver Logs em Tempo Real:**
```bash
# Frontend
docker logs -f oficios-frontend

# Backend
docker logs -f oficios-backend-python

# Ambos
docker compose -f /var/www/noficios/docker-compose.vps.yml logs -f
```

### **Verificar Health:**
```bash
# Frontend
curl http://localhost:3000/api/health

# Backend
curl http://localhost:8000/health
```

---

## 📝 LOGS

### **Localização:**
```
/var/www/noficios/data/logs/          # App logs
/var/log/noficios-disk-check.log      # Disk monitoring
/var/log/noficios-container-check.log # Container monitoring
```

### **Ver Logs:**
```bash
# App logs
ls -lh /var/www/noficios/data/logs/

# Monitoring logs
tail -f /var/log/noficios-disk-check.log
tail -f /var/log/noficios-container-check.log
```

### **Rotação:**
- **Aplicação:** 10MB max, 3 arquivos (Docker)
- **Antigos:** Deletados após 7 dias (cron)

---

## ⚠️ ALERTAS

### **Quando Acontecem:**
1. **Disco >80%:** Log em `/var/log/noficios-disk-check.log`
2. **Container parado:** Restart automático + log

### **Adicionar Email/Webhook:**
Editar scripts:
```bash
nano /usr/local/bin/check-disk-space.sh
nano /usr/local/bin/check-containers.sh
```

Adicionar no final do `if`:
```bash
# Email (requer mailutils)
echo "Alerta n.Oficios" | mail -s "ALERTA: Disco 80%" admin@example.com

# Webhook (Slack, Discord, etc.)
curl -X POST https://hooks.slack.com/services/XXX \
  -H 'Content-Type: application/json' \
  -d '{"text":"⚠️ Alerta n.Oficios: Disco 80%"}'
```

---

## 🔄 CRON JOBS

### **Verificar:**
```bash
crontab -l
```

### **Jobs Ativos:**
```
*/5 * * * * check-disk-space.sh    # A cada 5 min
*/2 * * * * check-containers.sh    # A cada 2 min
0 2 * * * find ... -delete         # Diário às 2h
```

---

## 💾 BACKUP

### **Database (Neon):**
- **Automático:** Diário
- **Retenção:** 7 dias (Free Tier)
- **Point-in-Time:** Disponível

### **Como Restaurar:**
1. Acesse: https://console.neon.tech
2. Projeto: noficios
3. Aba "Backups"
4. Escolha data/hora
5. Clique "Restore"

### **Testar Backup:**
```bash
noficios-backup.sh  # Ver instruções
```

---

## 📊 MÉTRICAS DISPONÍVEIS

### **Básicas (via scripts):**
- ✅ Uptime dos containers
- ✅ Status health checks
- ✅ Uso de disco
- ✅ Últimos logs

### **Avançadas (futuro - Prometheus):**
- 🔸 CPU/Memory por container
- 🔸 Request rate
- 🔸 Response time
- 🔸 Error rate

---

## 🛠️ TROUBLESHOOTING

### **Container não inicia:**
```bash
# Ver logs
docker logs oficios-frontend
docker logs oficios-backend-python

# Verificar health
docker inspect oficios-frontend | grep -A 10 Health

# Restart manual
cd /var/www/noficios
docker compose -f docker-compose.vps.yml restart
```

### **Health check failing:**
```bash
# Testar manualmente
curl -v http://localhost:3000/api/health
curl -v http://localhost:8000/health

# Ver tempo de startup
docker inspect oficios-frontend | grep StartedAt
```

### **Disco cheio:**
```bash
# Ver uso
df -h

# Limpar logs antigos
docker system prune -a --volumes

# Limpar builds antigos
cd /var/www/noficios
docker compose -f docker-compose.vps.yml down
docker system prune -a
docker compose -f docker-compose.vps.yml up -d
```

---

## 🎯 PRÓXIMOS PASSOS (Opcional)

### **Monitoramento Avançado:**
1. **Prometheus + Grafana** (8h)
   - Métricas detalhadas
   - Dashboards visuais
   - Alerting avançado

2. **Loki** (4h)
   - Logs centralizados
   - Query logs
   - Correlação com métricas

3. **Uptime Monitoring** (1h)
   - Serviço externo (UptimeRobot, etc.)
   - Alerta se site cai
   - Status page público

---

## ✅ CHECKLIST DIÁRIO

```
[ ] Executar: noficios-status.sh
[ ] Verificar: uso de disco
[ ] Verificar: containers healthy
[ ] Revisar: logs de erro
[ ] Testar: https://oficio.ness.tec.br
```

---

## 📞 COMANDOS RÁPIDOS

```bash
# Status completo
noficios-status.sh

# Logs em tempo real
docker compose -f /var/www/noficios/docker-compose.vps.yml logs -f

# Restart tudo
cd /var/www/noficios && docker compose -f docker-compose.vps.yml restart

# Rebuild e restart
cd /var/www/noficios && docker compose -f docker-compose.vps.yml up -d --build

# Ver uso de recursos
docker stats

# Limpar espaço
docker system prune -a
```

---

**Monitoramento Básico Configurado! ✅**

Este setup cobre 80% das necessidades de produção sem complexidade extra de Prometheus/Grafana.

---

**Team All BMAD | Monitoramento v1.0**
