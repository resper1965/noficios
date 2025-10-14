# Arquitetura n.Oficios (Visão Geral)

- Frontend: Next.js 15 (Cloud Run), design system ness (dark-first), Firebase Auth, FCM Web Push.
- Backend: Cloud Functions Gen2 (Python 3.11), Firestore, Pub/Sub, Storage, Secret Manager.
- LGPD: Minimização/pseudonimização, bucket restrito (southamerica-east1), URLs assinadas, AuditTrail.
- Deploy: Docker + Cloud Build (frontend), gcloud (functions), Load Balancer + Serverless NEG, domínio `oficio.ness.tec.br`.

## Fluxos principais
- W1 Ingestão/Processamento → W4 Resposta → W5 Arquivamento → W7 Governança/Admin → W8 RawText (URL assinada) → W9 Notificações (FCM).

## Multi-tenancy e RBAC
- JWT com `org_id` e `role` (platform_admin/org_admin/user) e validação no backend.
- Segredos por organização via Secret Manager (`{org_id}_groq_api_key`).
