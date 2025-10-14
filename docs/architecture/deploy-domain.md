# Deploy & Domínio

- Frontend: Cloud Run (região southamerica-east1) com imagem Docker de Next.js.
- Backend: Cloud Functions Gen2; deploy via `oficios-automation/deploy.sh`.
- Load Balancer: Serverless NEG → Backend Service → URL Map → Target HTTPS Proxy → Forwarding Rule 443.
- Certificado: Gerenciado (Google Managed) para `oficio.ness.tec.br`.
- Redirect HTTP→HTTPS: URL Map dedicado + Target HTTP Proxy + Forwarding Rule 80 (301).
- DNS: A record para 130.211.11.192.
