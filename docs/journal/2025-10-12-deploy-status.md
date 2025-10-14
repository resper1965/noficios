## Jornal de Projeto — n.Oficios (2025-10-12)

### Resumo executivo
- Frontend ativo no Cloud Run e em desenvolvimento local; branding padronizado; autenticação com fallback e correções de envs em runtime.
- Backend com arquitetura LGPD (pseudonimização + URLs assinadas) e endpoint de registro de FCM funcionando.

### Frontend
- Serviço: `oficios-portal-frontend`
  - URL Cloud Run: https://oficios-portal-frontend-491078993287.southamerica-east1.run.app
  - Região: `southamerica-east1` (São Paulo)
  - Projeto: `officio-474711`
- Imagem implantada (mais recente): `gcr.io/officio-474711/oficios-portal-frontend:brand-pages-20251012162226`
- Env vars principais (injetadas em runtime via `window.__ENV`):
  - `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=officio-474711.firebaseapp.com`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=officio-474711`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=officio-474711.appspot.com`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=491078993287`
  - `NEXT_PUBLIC_FIREBASE_APP_ID=1:491078993287:web:b123a486df583bd2693f22`
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-CJ179X2TQ0`
- Domínio customizado: `oficio.ness.tec.br` (via Load Balancer + Serverless NEG; HTTPS gerenciado pela GCP)
- Desenvolvimento local: `http://localhost:3001` (hot-reload), usar também como Referer permitido na API key.
- UX/UI:
  - Landing refinada (grid 7/5, tipografia Montserrat, contraste no card de login, ícone `LogIn`).
  - `PageHeader` aplicado em: `security`, `policies/*`, `dashboard`, `admin/governance`.
  - CookieConsent: banner persistente + link "Preferências de Cookies" no rodapé.
  - Policy Acceptance: modal não-fechável integrado ao fluxo de login.
- Autenticação Firebase:
  - Correção de `auth/invalid-api-key` via envs em runtime e ajustes de Referers.
  - Fallback automático para `signInWithRedirect` quando popup falhar/for bloqueado.

### Backend
- LGPD (pontos-chaves):
  - `raw_text` movido para bucket restrito (GCS), somente preview/hash no Firestore.
  - Acesso ao bruto via função HTTP que gera URL assinada (60 min) + auditoria.
- Funções relevantes:
  - `W1_processamento_async`: usa `RawTextStorageClient` (upload + hash + preview).
  - `W8_get_raw_text`: retorna URL assinada com RBAC e log em `audit_trail`.
  - `W9_notifications`: registra token FCM, CORS dinâmico por env.

### Infra/GCP
- Projeto: `officio-474711`
- Região padrão: `southamerica-east1`
- APIs habilitadas: Cloud Run, Cloud Build, Cloud Functions (Gen2), Eventarc, Firestore, Storage, Secret Manager, Pub/Sub.
- Deploys via Cloud Build (`gcloud builds submit`) e `gcloud run deploy`.

### FCM (Web Push)
- Service Worker: `public/firebase-messaging-sw.js` (compat).
- VAPID: lido de `window.__ENV.NEXT_PUBLIC_FCM_VAPID_KEY` (definir no serviço quando for emitir tokens no cliente).
- Endpoint backend: `W9_notifications` (registro e auditoria de tokens).

### Pendências/Riscos
- Adicionar/confirmar Referers da API key (GCP → Credentials):
  - `https://oficio.ness.tec.br/*`
  - `https://oficios-portal-frontend-491078993287.southamerica-east1.run.app/*`
  - `http://localhost:3001/*` (para dev local)
- Confirmar domínios autorizados no Firebase Auth: `oficio.ness.tec.br` e URL do Cloud Run.
- Definir `NEXT_PUBLIC_FCM_VAPID_KEY` no serviço para habilitar FCM no cliente.
- Integrar dados reais no `dashboard` (endpoints de métricas/listagem de ofícios).

### Comandos úteis
```bash
# Build & Deploy frontend
gcloud builds submit --tag gcr.io/officio-474711/oficios-portal-frontend:<tag>
gcloud run deploy oficios-portal-frontend \
  --image gcr.io/officio-474711/oficios-portal-frontend:<tag> \
  --region southamerica-east1 --project officio-474711 \
  --set-env-vars=NEXT_PUBLIC_FIREBASE_API_KEY=...,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...,
                 NEXT_PUBLIC_FIREBASE_PROJECT_ID=...,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...,
                 NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...,NEXT_PUBLIC_FIREBASE_APP_ID=...,
                 NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...,NEXT_PUBLIC_FCM_VAPID_KEY=...

# Dev local (porta 3001)
cd oficios-portal-frontend && npm run dev -- -p 3001
```

— Fim do registro.




