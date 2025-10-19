# Backend Python Simplificado - n.Oficios

Backend Flask para rodar na VPS substituindo Cloud Functions.

## Estrutura

```
backend-simple/
├── api.py              # Flask API principal
├── Dockerfile          # Container Python
├── requirements.txt    # Dependências
└── funcoes/           # Workflows (opcional)
```

## Endpoints

- `GET /health` - Health check
- `GET /status` - Status e estatísticas
- `POST /gmail/ingest` - Processar emails Gmail
- `GET /` - Informações da API

## Configuração

### Variáveis de Ambiente

```bash
PORT=8000                                    # Porta da API
EMAILS_DIR=/data/emails                      # Diretório para anexos
GMAIL_SA_JSON_FILE=/app/gmail-sa-key.json   # Service Account
```

## Deploy

### Local (Desenvolvimento)

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar
python api.py
```

### Docker

```bash
# Build
docker build -t oficios-backend .

# Run
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/gmail-sa-key.json:/app/gmail-sa-key.json:ro \
  -v $(pwd)/data:/data \
  oficios-backend
```

### VPS (Docker Compose)

```bash
# Na VPS
cd /opt/oficios
docker-compose -f docker-compose.vps.yml up -d backend-python

# Logs
docker-compose logs -f backend-python
```

## Testes

```bash
# Health check
curl http://localhost:8000/health

# Status
curl http://localhost:8000/status

# Gmail ingest
curl -X POST http://localhost:8000/gmail/ingest \
  -H "Content-Type: application/json" \
  -d '{"email":"resper@ness.com.br","label":"INGEST"}'
```

## Logs

Logs estruturados em stdout/stderr:
```
2025-10-18 10:30:00 - api - INFO - Gmail ingest started: resper@ness.com.br
2025-10-18 10:30:05 - api - INFO - Found 5 messages
2025-10-18 10:30:10 - api - INFO - Attachment saved: /data/emails/...
```

## Troubleshooting

### Erro: Service Account not found
```bash
# Verificar arquivo
ls -la /app/gmail-sa-key.json

# Deve existir e ter permissão de leitura
```

### Erro: Gmail API permission denied
```bash
# Verificar Domain-Wide Delegation no Google Workspace Admin
# https://admin.google.com > Security > API Controls
```

### Erro: Can't write to /data/emails
```bash
# Verificar permissões
chmod 777 /data/emails

# Ou ajustar owner
chown -R 1000:1000 /data/emails
```

