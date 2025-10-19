# 🚀 PLANEJAMENTO FINALIZAÇÃO - Deploy VPS Completo

**BMad Master - Execução na VPS**  
**Data:** 18 de Outubro de 2025  
**Infraestrutura:** VPS 62.72.8.164 (sem GCP Cloud Functions)  
**Meta:** Sistema 100% funcional rodando localmente

---

## 🎯 ESTRATÉGIA VPS

**Mudança de Abordagem:**
- ❌ NÃO usar GCP Cloud Functions
- ✅ Rodar backend Python na VPS
- ✅ Frontend Next.js na VPS
- ✅ Tudo em Docker containers
- ✅ Comunicação local (localhost)

---

## 🏗️ ARQUITETURA VPS

```
VPS (62.72.8.164)
├── Container 1: Frontend Next.js (porta 3000)
│   └── API Gateway
│       └── Chama localhost:8000 (backend Python)
│
├── Container 2: Backend Python (porta 8000)
│   ├── W0_gmail_ingest endpoint
│   ├── W1_processamento
│   ├── W3_webhook_update
│   └── Outros workflows
│
└── Traefik (gerenciado pelo Portainer)
    └── SSL automático
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Preparar Backend Python na VPS** (2h)

#### **1.1 Criar Estrutura Backend** (30min)

```bash
# Conectar na VPS
ssh root@62.72.8.164

# Criar diretório para backend
mkdir -p /opt/oficios/backend-python
cd /opt/oficios/backend-python

# Copiar código do backend
# (do repositório local)
```

**Localmente:**
```bash
# Empacotar backend Python
cd /home/resper/noficios/oficios-automation
tar -czf backend-python.tar.gz funcoes/ utils/ requirements.txt

# Enviar para VPS
scp backend-python.tar.gz root@62.72.8.164:/opt/oficios/

# Na VPS
ssh root@62.72.8.164
cd /opt/oficios
tar -xzf backend-python.tar.gz -C backend-python/
rm backend-python.tar.gz
```

#### **1.2 Criar API Flask Unificada** (1h)

```python
# /opt/oficios/backend-python/api.py
"""
API Flask para rodar workflows Python localmente na VPS
Substitui Cloud Functions individuais
"""

from flask import Flask, request, jsonify
import os
import sys

# Adicionar utils ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'utils'))

app = Flask(__name__)

# Importar funções dos workflows
from funcoes.W0_gmail_ingest.main import poll_gmail_ingest
# Importar outros workflows conforme necessário

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'backend-python',
        'version': '1.0.0'
    })

@app.route('/W0_gmail_ingest', methods=['POST'])
def w0_gmail_ingest():
    """Proxy para W0_gmail_ingest"""
    try:
        # Criar objeto request compatível com Cloud Functions
        class MockRequest:
            def __init__(self, data):
                self._json = data
            def get_json(self, silent=False):
                return self._json
        
        mock_req = MockRequest(request.get_json() or {})
        result, status_code = poll_gmail_ingest(mock_req)
        
        return result, status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### **1.3 Criar Dockerfile Backend** (30min)

```dockerfile
# /opt/oficios/backend-python/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install Flask gunicorn

# Copiar código
COPY . .

# Porta
EXPOSE 8000

# Comando para iniciar
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "api:app"]
```

#### **1.4 Requirements Backend** (15min)

```bash
# /opt/oficios/backend-python/requirements.txt
Flask==3.0.0
gunicorn==21.2.0
google-cloud-storage==2.14.0
google-auth==2.25.2
google-api-python-client==2.108.0
firebase-admin==6.3.0
supabase-py==2.3.0
groq==0.4.1
```

---

### **FASE 2: Docker Compose Atualizado** (30min)

```yaml
# /opt/oficios/docker-compose.yml
version: '3.8'

services:
  # Frontend Next.js
  oficios-frontend:
    build:
      context: ./oficios-portal-frontend
      dockerfile: Dockerfile
    container_name: oficios-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - W0_GMAIL_INGEST_URL=http://backend-python:8000/W0_gmail_ingest
      # Outras vars do .env.production
    env_file:
      - ./oficios-portal-frontend/.env.production
    depends_on:
      - backend-python
    restart: unless-stopped
    networks:
      - oficios-network

  # Backend Python
  backend-python:
    build:
      context: ./backend-python
      dockerfile: Dockerfile
    container_name: backend-python
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - EMAILS_BUCKET=/data/emails
      - GMAIL_DELEGATED_USER=resper@ness.com.br
      # Service account via volume mount
    volumes:
      - ./gmail-sa-key.json:/app/gmail-sa-key.json:ro
      - ./data/emails:/data/emails
    restart: unless-stopped
    networks:
      - oficios-network

networks:
  oficios-network:
    driver: bridge
```

---

### **FASE 3: Configurar Gmail API** (1h)

#### **3.1 Criar Service Account** (30min)

**No Google Cloud Console:**
1. Acesse: https://console.cloud.google.com
2. Crie projeto: `n-oficios-vps`
3. Habilite Gmail API
4. Crie Service Account:
   - Nome: `gmail-reader`
   - Permissões: Gmail API
5. Crie chave JSON
6. **Download:** `gmail-sa-key.json`

#### **3.2 Configurar Domain-Wide Delegation** (30min)

**No Google Workspace Admin:**
1. https://admin.google.com
2. Security > API Controls > Domain-wide Delegation
3. Add Client ID (do Service Account)
4. Scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   ```
5. Authorize

#### **3.3 Upload para VPS**

```bash
# Enviar Service Account key para VPS
scp gmail-sa-key.json root@62.72.8.164:/opt/oficios/

# IMPORTANTE: Deletar arquivo local
rm gmail-sa-key.json

# Configurar permissões na VPS
ssh root@62.72.8.164 "chmod 600 /opt/oficios/gmail-sa-key.json"
```

---

### **FASE 4: Adaptação do Código Backend** (1h)

#### **4.1 Atualizar W0 para VPS** (45min)

Na VPS, criar adaptador:

```python
# /opt/oficios/backend-python/funcoes/W0_gmail_ingest/main.py
# Atualizar para funcionar sem Secret Manager

import json
import os

def _read_sa_json_from_file(file_path: str):
    """Ler Service Account JSON de arquivo local (VPS)"""
    with open(file_path, 'r') as f:
        return json.load(f)

@functions_framework.http
def poll_gmail_ingest(request):
    try:
        # Ler SA do arquivo em vez de Secret Manager
        sa_file = os.getenv('GMAIL_SA_JSON_FILE', '/app/gmail-sa-key.json')
        creds_info = _read_sa_json_from_file(sa_file)
        
        # Usar diretório local em vez de GCS
        emails_dir = os.getenv('EMAILS_BUCKET', '/data/emails')
        
        # ... resto do código igual
        # Salvar anexos em /data/emails/ em vez de GCS
```

#### **4.2 Salvar Local em vez de GCS** (15min)

```python
def _save_attachment_local(emails_dir: str, blob_path: str, data: bytes):
    """Salvar anexo localmente na VPS"""
    full_path = os.path.join(emails_dir, blob_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    with open(full_path, 'wb') as f:
        f.write(data)
    
    logging.info(f"Anexo salvo: {full_path}")
```

---

### **FASE 5: Deploy Completo VPS** (1h)

```bash
# Na VPS
cd /opt/oficios

# 1. Build dos containers
docker-compose build

# 2. Subir serviços
docker-compose up -d

# 3. Verificar logs
docker-compose logs -f

# 4. Testar backend Python
curl http://localhost:8000/health
# Esperado: {"status":"healthy","service":"backend-python"}

# 5. Testar frontend
curl http://localhost:3000/api/health
# Esperado: {"status":"healthy",...}

# 6. Testar integração
curl -X POST http://localhost:3000/api/gmail/auto-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR-API-KEY" \
  -d '{"email":"resper@ness.com.br","label":"INGEST"}'

# Esperado: {"status":"success","scanned":N,...}
```

---

### **FASE 6: Configurar Automação** (30min)

```bash
# Na VPS, configurar cron
crontab -e

# Adicionar:
*/15 * * * * cd /opt/oficios && ./sync-gmail-real.sh >> /var/log/gmail-sync.log 2>&1
```

---

## 📦 ESTRUTURA FINAL NA VPS

```
/opt/oficios/
├── oficios-portal-frontend/     # Container Next.js
│   ├── .next/
│   ├── .env.production
│   └── Dockerfile
│
├── backend-python/               # Container Python (NOVO)
│   ├── api.py                   # Flask API
│   ├── funcoes/                 # Workflows
│   │   ├── W0_gmail_ingest/
│   │   ├── W1_processamento_async/
│   │   └── ...
│   ├── utils/
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/
│   └── emails/                  # Armazenamento local (vs GCS)
│
├── gmail-sa-key.json            # Service Account (privado)
├── docker-compose.yml           # Orquestração
└── sync-gmail-real.sh          # Script automação
```

---

## 🔧 SIMPLIFICAÇÕES PARA VPS

### **VS GCP Cloud Functions:**

| Aspecto | GCP | VPS |
|---------|-----|-----|
| **Deploy** | gcloud functions | docker-compose |
| **Storage** | GCS bucket | /data/emails local |
| **Secrets** | Secret Manager | arquivo .json |
| **Scaling** | Auto | Manual (containers) |
| **Custo** | $5-10/mês | $0 (já incluído) |
| **Complexidade** | Alta | Baixa |

**Vantagens VPS:**
- ✅ Mais simples
- ✅ Sem custo adicional
- ✅ Controle total
- ✅ Latência menor (localhost)

---

## ⚡ IMPLEMENTAÇÃO RÁPIDA

### **Opção A: Backend Python Completo** (3h)
- Rodar todos workflows (W0-W9)
- Flask API completa
- Docker container dedicado

### **Opção B: Apenas Gmail Sync** (1h)
- Só W0_gmail_ingest
- Mini Flask API
- Container leve

### **Opção C: Node.js Proxy** (2h)
- Reescrever W0 em TypeScript
- Rodar no mesmo container do Next.js
- googleapis npm package

**Recomendação:** **Opção B** - Rápido e suficiente

---

## 🚀 PLANO RÁPIDO (2h total)

### **Passo 1: Criar Mini Backend** (30min)

Localmente:
```bash
cd /home/resper/noficios

# Criar estrutura simplificada
mkdir -p backend-simple

cat > backend-simple/api.py << 'ENDPY'
from flask import Flask, request, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json
import os

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/gmail/ingest', methods=['POST'])
def gmail_ingest():
    try:
        data = request.get_json()
        email = data.get('email', 'resper@ness.com.br')
        label = data.get('label', 'INGEST')
        
        # Carregar Service Account
        with open('/app/gmail-sa-key.json') as f:
            sa_info = json.load(f)
        
        # Criar cliente Gmail
        credentials = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=['https://www.googleapis.com/auth/gmail.readonly']
        )
        delegated = credentials.with_subject(email)
        gmail = build('gmail', 'v1', credentials=delegated)
        
        # Buscar emails
        query = f'label:{label} has:attachment newer_than:7d'
        results = gmail.users().messages().list(userId='me', q=query, maxResults=50).execute()
        messages = results.get('messages', [])
        
        # Processar anexos (salvar localmente)
        saved = []
        for msg in messages:
            message = gmail.users().messages().get(userId='me', id=msg['id']).execute()
            # ... processar anexos
            saved.append(msg['id'])
        
        return jsonify({
            'status': 'ok',
            'scanned': len(messages),
            'saved': len(saved),
            'email': email,
            'label': label
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
ENDPY

# Requirements
cat > backend-simple/requirements.txt << 'EOF'
Flask==3.0.0
gunicorn==21.2.0
google-auth==2.25.2
google-api-python-client==2.108.0
EOF

# Dockerfile
cat > backend-simple/Dockerfile << 'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api.py .
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "api:app"]
EOF
```

### **Passo 2: Enviar para VPS** (15min)

```bash
# Empacotar
tar -czf backend-simple.tar.gz backend-simple/

# Enviar
scp backend-simple.tar.gz root@62.72.8.164:/opt/oficios/

# Extrair na VPS
ssh root@62.72.8.164 "cd /opt/oficios && tar -xzf backend-simple.tar.gz && rm backend-simple.tar.gz"
```

### **Passo 3: Atualizar docker-compose.yml** (15min)

```yaml
# Na VPS: /opt/oficios/docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./oficios-portal-frontend
    container_name: oficios-frontend
    ports:
      - "3000:3000"
    environment:
      - W0_GMAIL_INGEST_URL=http://backend:8000/gmail/ingest
    env_file:
      - ./oficios-portal-frontend/.env.production
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend-simple
    container_name: oficios-backend-python
    ports:
      - "8000:8000"
    volumes:
      - ./gmail-sa-key.json:/app/gmail-sa-key.json:ro
      - ./data/emails:/data/emails
    restart: unless-stopped
```

### **Passo 4: Deploy** (30min)

```bash
# Na VPS
ssh root@62.72.8.164

cd /opt/oficios

# Build e start
docker-compose build
docker-compose up -d

# Verificar
docker-compose ps
docker-compose logs -f

# Testar
curl http://localhost:8000/health
curl http://localhost:3000/api/health
```

### **Passo 5: Atualizar Frontend** (15min)

```typescript
// Atualizar .env.production
W0_GMAIL_INGEST_URL=http://backend:8000/gmail/ingest
```

### **Passo 6: Testar End-to-End** (15min)

```bash
# Criar email de teste
# 1. Gmail: Enviar email com anexo
# 2. Adicionar label INGEST

# Executar sync
./sync-gmail-real.sh

# Verificar resultado
ls -la /opt/oficios/data/emails/

# Deve ter anexos salvos!
```

---

## 📋 CHECKLIST SIMPLES

### **Preparação (Local):**
- [x] Código backend Python existe
- [ ] Criar api.py Flask
- [ ] Criar Dockerfile backend
- [ ] Testar local
- [ ] Empacotar e enviar

### **VPS:**
- [ ] Service Account JSON enviado
- [ ] docker-compose.yml atualizado
- [ ] Build containers
- [ ] Start serviços
- [ ] Configurar variáveis

### **Gmail:**
- [ ] Service Account criado
- [ ] Domain-Wide Delegation
- [ ] Criar label INGEST
- [ ] Email de teste

### **Validação:**
- [ ] Backend health OK
- [ ] Frontend health OK
- [ ] Sincronização manual OK
- [ ] Anexos salvos
- [ ] Cron configurado

---

## ⏱️ TEMPO TOTAL

| Fase | Tempo |
|------|-------|
| Criar backend Flask | 30min |
| Dockerfile + requirements | 30min |
| Enviar para VPS | 15min |
| Docker-compose | 15min |
| Deploy | 30min |
| Service Account | 30min |
| Domain-Wide Delegation | 30min |
| Testes | 15min |

**Total:** ~3h (vs 5.5h do plano GCP original)

**Economia:** 2.5h + $0 custo GCP

---

## 🎯 PRÓXIMA AÇÃO IMEDIATA

```bash
# Criar backend simplificado
cd /home/resper/noficios
mkdir -p backend-simple

# Eu posso criar os arquivos agora!
```

**Quer que eu:**
1. **Crie o backend Flask completo agora** (arquivos prontos para VPS)
2. **Apenas documente** e você implementa
3. **Execute os comandos** de deploy automaticamente

Digite 1, 2, ou 3

