"""
W0: Gmail Ingest (Mailbox -> GCS)

Coletor de anexos via Gmail API com delegação em todo o domínio (Domain‑Wide Delegation).
Fluxos suportados:
- poll_gmail_ingest (HTTP): varre a mailbox por mensagens que combinem a query e envia anexos ao GCS.
- gmail_watch_webhook (Pub/Sub): handler para eventos do Gmail Watch (opcional, após configurar watch para o tópico).

Requisitos de ambiente/secrets:
- EMAILS_BUCKET: bucket de destino (ex.: officio-474711-emails)
- GMAIL_DELEGATED_USER: mailbox delegada (ex.: operation@bekaa.eu)
- GMAIL_SA_JSON_SECRET (opcional): nome do secret com o JSON da SA (default: GMAIL_SA_JSON)
- GMAIL_QUERY (opcional): query do Gmail (default: label:INGEST has:attachment newer_than:7d)

LGPD: Somente copia anexos para o bucket de ingestão. A minimização e pseudonimização ocorre nas etapas W1/W1_async.
"""

import base64
import io
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import functions_framework
from flask import jsonify, Request

from google.api_core.exceptions import NotFound
from google.cloud import secretmanager, storage
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


logging.basicConfig(level=logging.INFO)


def _get_env(name: str, default: Optional[str] = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value


def _read_sa_json_from_secret(secret_name: str, project_id: Optional[str] = None) -> Dict[str, Any]:
    client = secretmanager.SecretManagerServiceClient()
    if project_id is None:
        project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("GCP_PROJECT")
    if not project_id:
        raise RuntimeError("GCP_PROJECT_ID/GCP_PROJECT não definido")
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    try:
        resp = client.access_secret_version(request={"name": name})
    except NotFound as e:
        raise RuntimeError(f"Secret '{secret_name}' não encontrado no projeto {project_id}") from e
    payload = resp.payload.data.decode("utf-8")
    return json.loads(payload)


def _build_gmail(creds_info: Dict[str, Any], delegated_user: str):
    scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        # Caso no futuro se deseje mover/rotular mensagens, incluir escopos extras
    ]
    credentials = service_account.Credentials.from_service_account_info(creds_info, scopes=scopes)
    delegated = credentials.with_subject(delegated_user)
    return build("gmail", "v1", credentials=delegated, cache_discovery=False)


def _list_messages(gmail, user_id: str, query: str) -> List[Dict[str, Any]]:
    msgs: List[Dict[str, Any]] = []
    request = gmail.users().messages().list(userId=user_id, q=query, maxResults=50)
    while request is not None:
        response = request.execute()
        for m in response.get("messages", []):
            msgs.append(m)
        request = gmail.users().messages().list_next(previous_request=request, previous_response=response)
    return msgs


def _upload_bytes_to_gcs(bucket_name: str, blob_path: str, data: bytes, content_type: Optional[str] = None):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    blob.upload_from_file(io.BytesIO(data), size=len(data), content_type=content_type)


def _safe_filename(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in ("-", "_", ".", " ")).strip()


def _process_message_attachments(gmail, user_id: str, message_id: str, emails_bucket: str, tenant_domain: str):
    msg = gmail.users().messages().get(userId=user_id, id=message_id, format="full").execute()
    payload = msg.get("payload", {})
    headers = payload.get("headers", [])
    subject = next((h.get("value") for h in headers if h.get("name") == "Subject"), "")
    thread_id = msg.get("threadId", message_id)
    date_hdr = next((h.get("value") for h in headers if h.get("name") == "Date"), None)
    date_prefix = datetime.utcnow().strftime("%Y%m%d")
    if date_hdr:
        date_prefix = date_prefix

    parts = []
    stack = [payload]
    while stack:
        p = stack.pop()
        if "parts" in p:
            stack.extend(p["parts"])
        else:
            parts.append(p)

    for p in parts:
        body = p.get("body", {})
        filename = _safe_filename(p.get("filename") or "")
        if not filename:
            continue
        attach_id = body.get("attachmentId")
        data_b64 = body.get("data")

        content_type = p.get("mimeType", "application/octet-stream")
        raw_bytes: Optional[bytes] = None

        if data_b64:
            raw_bytes = base64.urlsafe_b64decode(data_b64)
        elif attach_id:
            attach = gmail.users().messages().attachments().get(userId=user_id, messageId=message_id, id=attach_id).execute()
            raw_bytes = base64.urlsafe_b64decode(attach.get("data", ""))

        if not raw_bytes:
            continue

        blob_path = f"emails/{tenant_domain}/{thread_id}/{date_prefix}-{filename}"
        _upload_bytes_to_gcs(emails_bucket, blob_path, raw_bytes, content_type)
        logging.info(f"Anexo enviado ao GCS: gs://{emails_bucket}/{blob_path} | subj={subject}")


@functions_framework.http
def poll_gmail_ingest(request: Request):
    """Executa varredura na mailbox e envia anexos ao bucket de ingestão.
    Aceita JSON opcional: {"query": "<Gmail search query>"}
    """
    try:
        project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("GCP_PROJECT")
        emails_bucket = _get_env("EMAILS_BUCKET")
        delegated_user = _get_env("GMAIL_DELEGATED_USER")
        secret_name = os.getenv("GMAIL_SA_JSON_SECRET", "GMAIL_SA_JSON")
        body = request.get_json(silent=True) or {}
        override_q = body.get("query")
        query = override_q or os.getenv("GMAIL_QUERY", "label:INGEST has:attachment newer_than:7d")

        creds_info = _read_sa_json_from_secret(secret_name=secret_name, project_id=project_id)
        gmail = _build_gmail(creds_info, delegated_user)

        msgs = _list_messages(gmail, "me", query)
        tenant_domain = delegated_user.split("@")[-1]
        for m in msgs:
            _process_message_attachments(gmail, "me", m["id"], emails_bucket, tenant_domain)

        return jsonify({
            "status": "ok",
            "scanned": len(msgs),
            "bucket": emails_bucket,
            "query": query
        }), 200
    except Exception as e:
        logging.exception("Erro no poll_gmail_ingest")
        return jsonify({"error": str(e)}), 500


@functions_framework.cloud_event
def gmail_watch_webhook(event):
    """Handler para notificações do Gmail Watch via Pub/Sub.
    Espera um payload Pub/Sub com data.message.data (base64) do Gmail.
    Implementação básica: apenas confirma recebimento. A varredura efetiva pode ser
    delegada ao poll_gmail_ingest ou a um processador por historyId.
    """
    try:
        logging.info("Recebida notificação do Gmail Watch: %s", event)
    except Exception:
        logging.exception("Falha ao processar evento do Gmail Watch")
    # Ack implícito


