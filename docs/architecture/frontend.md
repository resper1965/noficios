# Frontend

- Next.js 15 (Turbopack), output `standalone` para Cloud Run.
- Autenticação: Firebase Auth (client-only init), custom claims `org_id` e `role`.
- FCM Web Push: `public/firebase-messaging-sw.js`, `src/lib/fcm.ts`, `FCMInitializer` integra token → backend W9.
- LGPD UX: Modal de aceite de políticas, Cookie banner, Footer com links legais e página de Segurança/Privacidade.
- CI/CD: Dockerfile multi-stage, Cloud Build → Cloud Run (`oficios-portal-frontend`).
