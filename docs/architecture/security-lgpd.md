# Segurança & LGPD

- Minimização: Firestore guarda apenas `raw_text_preview`, `raw_text_storage_path`, `raw_text_sha256`.
- Pseudonimização: `raw_text` completo fora do Firestore → bucket restrito (southamerica-east1).
- Acesso mediado: W8 gera URL assinada (tempo limitado) + AuditTrail `ACCESS_RAW_TEXT`.
- IAM: bucket com UBLA; sem `allUsers`/`allAuthenticatedUsers`; acesso só por SAs e ROLE_ORG_ADMIN (via endpoint).
- Auditoria (Art. 37): eventos centralizados em `audit_trail`.
- Soberania de dados: Storage na região São Paulo.
- Políticas: LegalDocument + UserPolicyAcceptance; aceite forçado no primeiro uso.
