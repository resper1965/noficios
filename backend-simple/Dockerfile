FROM python:3.12-slim

# Metadados
LABEL maintainer="n.Oficios <resper@ness.com.br>"
LABEL description="Backend Python para n.Oficios - Gmail Integration"

# Diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primeiro (cache de layers)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY api.py .
COPY funcoes/ ./funcoes/

# Criar diretório para dados
RUN mkdir -p /data/emails

# Variáveis de ambiente padrão
ENV PORT=8000
ENV EMAILS_DIR=/data/emails
ENV GMAIL_SA_JSON_FILE=/app/gmail-sa-key.json
ENV PYTHONUNBUFFERED=1

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Comando para iniciar
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "api:app"]

