"""
Pytest configuration and fixtures
"""
import pytest
import os
import tempfile
import json
from unittest.mock import Mock, MagicMock

# Set test environment
os.environ['TESTING'] = '1'
os.environ['EMAILS_DIR'] = '/tmp/test-emails'
os.environ['GMAIL_SA_JSON_FILE'] = '/tmp/test-sa.json'


@pytest.fixture
def app():
    """Create Flask app for testing"""
    from api import app as flask_app
    flask_app.config['TESTING'] = True
    return flask_app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def mock_service_account():
    """Mock service account JSON"""
    return {
        "type": "service_account",
        "project_id": "test-project",
        "private_key_id": "test-key-id",
        "private_key": "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
        "client_email": "test@test.iam.gserviceaccount.com",
        "client_id": "123456789",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
    }


@pytest.fixture
def mock_gmail_service():
    """Mock Gmail API service"""
    service = MagicMock()
    
    # Mock messages list
    messages_list = MagicMock()
    messages_list.execute.return_value = {
        'messages': [
            {'id': 'msg1'},
            {'id': 'msg2'},
            {'id': 'msg3'}
        ]
    }
    service.users().messages().list.return_value = messages_list
    
    # Mock message get
    message_get = MagicMock()
    message_get.execute.return_value = {
        'id': 'msg1',
        'threadId': 'thread1',
        'payload': {
            'headers': [
                {'name': 'Subject', 'value': 'Ofício Teste 123'},
                {'name': 'From', 'value': 'test@example.com'},
                {'name': 'Date', 'value': 'Mon, 18 Oct 2025 10:00:00 -0300'}
            ],
            'parts': [
                {
                    'filename': 'documento.pdf',
                    'body': {
                        'attachmentId': 'att1',
                        'size': 1024
                    },
                    'mimeType': 'application/pdf'
                }
            ]
        }
    }
    service.users().messages().get.return_value = message_get
    
    # Mock attachment get
    attachment_get = MagicMock()
    attachment_get.execute.return_value = {
        'data': 'UERGIGNvbnRlbnQgaGVyZQ=='  # base64 'PDF content here'
    }
    service.users().messages().attachments().get.return_value = attachment_get
    
    return service


@pytest.fixture
def temp_emails_dir():
    """Create temporary emails directory"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture(autouse=True)
def setup_test_environment(tmp_path, mock_service_account):
    """Setup test environment before each test"""
    # Create temp SA file
    sa_file = tmp_path / "test-sa.json"
    with open(sa_file, 'w') as f:
        json.dump(mock_service_account, f)
    
    # Set environment
    os.environ['GMAIL_SA_JSON_FILE'] = str(sa_file)
    os.environ['EMAILS_DIR'] = str(tmp_path / "emails")
    
    # Create emails dir
    os.makedirs(os.environ['EMAILS_DIR'], exist_ok=True)
    
    yield
    
    # Cleanup
    if 'GMAIL_SA_JSON_FILE' in os.environ:
        del os.environ['GMAIL_SA_JSON_FILE']
    if 'EMAILS_DIR' in os.environ:
        del os.environ['EMAILS_DIR']

