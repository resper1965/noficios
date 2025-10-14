# Backend

- Cloud Functions (Gen2) Python 3.11:
  - W1_ingestao_trigger: GCS finalize → publica no Pub/Sub `oficios_para_processamento`.
  - W1_processamento_async: consome Pub/Sub, LLM (Groq), salva `raw_text` no bucket restrito, guarda preview/sha/ref no Firestore.
  - W3_webhook_update: HTTP seguro para updates externos.
  - W4_composicao_resposta: compõe e envia resposta.
  - W5_archiving: move anexos para `Oficios/<org>/<YYYY>/<MM>/<oficio_id>`.
  - W6_simulador_reextracao: POST simulate, publica mensagem com `is_simulation`.
  - W7_admin_governance: CRUD de organizações, métricas, auditoria.
  - W8_get_raw_text: retorna URL assinada + loga `ACCESS_RAW_TEXT`.
  - W9_notifications: registra token FCM com auditoria.

- Firestore: coleções `oficios`, `organizations`, `audit_trail`, `legal_documents`, `policy_acceptances`, `notification_tokens`.
- Pub/Sub: `oficios_para_processamento`, `resposta_pronta`, `sla_monitor_trigger`.
- Secret Manager: `{org_id}_groq_api_key` e demais credenciais.
- IAM: funções com service accounts dedicadas (recomendado), bucket restrito com UBLA e sem público.
