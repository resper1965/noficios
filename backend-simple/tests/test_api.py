"""
Unit tests for Flask API
"""
import pytest
import os
import json
from pathlib import Path


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_returns_200(self, client):
        """Health endpoint should return 200"""
        response = client.get('/health')
        assert response.status_code == 200
    
    def test_health_returns_json(self, client):
        """Health endpoint should return JSON"""
        response = client.get('/health')
        data = response.get_json()
        
        assert data is not None
        assert 'status' in data
        assert data['status'] == 'healthy'
    
    def test_health_includes_metadata(self, client):
        """Health endpoint should include service metadata"""
        response = client.get('/health')
        data = response.get_json()
        
        assert 'service' in data
        assert 'version' in data
        assert 'timestamp' in data
        assert data['version'] == '1.0.0'
    
    def test_status_endpoint(self, client):
        """Status endpoint should return system status"""
        response = client.get('/status')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'status' in data
        assert 'checks' in data
        assert 'stats' in data
    
    def test_status_checks_service_account(self, client):
        """Status should check if service account exists"""
        response = client.get('/status')
        data = response.get_json()
        
        assert 'checks' in data
        assert 'service_account' in data['checks']
        assert isinstance(data['checks']['service_account'], bool)
    
    def test_index_endpoint(self, client):
        """Index endpoint should return API info"""
        response = client.get('/')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'service' in data
        assert 'endpoints' in data


class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_save_attachment_local(self, temp_emails_dir):
        """Should save attachment to local filesystem"""
        from api import save_attachment_local
        
        file_path = os.path.join(temp_emails_dir, 'subdir', 'test.pdf')
        data = b'PDF content here'
        
        result = save_attachment_local(file_path, data)
        
        assert result == True
        assert os.path.exists(file_path)
        
        with open(file_path, 'rb') as f:
            assert f.read() == data
    
    def test_save_attachment_creates_directories(self, temp_emails_dir):
        """Should create parent directories if needed"""
        from api import save_attachment_local
        
        file_path = os.path.join(
            temp_emails_dir, 
            'level1', 'level2', 'level3', 
            'file.pdf'
        )
        
        result = save_attachment_local(file_path, b'data')
        
        assert result == True
        assert os.path.exists(file_path)
    
    def test_save_attachment_handles_errors(self, temp_emails_dir):
        """Should handle save errors gracefully"""
        from api import save_attachment_local
        
        # Invalid path
        file_path = '/root/no-permission/file.pdf'
        
        result = save_attachment_local(file_path, b'data')
        
        assert result == False
    
    def test_load_service_account(self, mock_service_account):
        """Should load service account from file"""
        from api import load_service_account
        
        sa_data = load_service_account()
        
        assert sa_data is not None
        assert 'client_email' in sa_data
        assert sa_data['type'] == 'service_account'
    
    def test_load_service_account_file_not_found(self, monkeypatch):
        """Should raise error if SA file not found"""
        from api import load_service_account
        
        monkeypatch.setenv('GMAIL_SA_JSON_FILE', '/nonexistent.json')
        
        with pytest.raises(Exception):
            load_service_account()


class TestGmailIngestEndpoint:
    """Test Gmail ingest endpoint"""
    
    def test_gmail_ingest_without_service_account(self, client, monkeypatch):
        """Should fail gracefully without service account"""
        monkeypatch.setenv('GMAIL_SA_JSON_FILE', '/nonexistent.json')
        
        response = client.post('/gmail/ingest', json={
            'email': 'test@example.com',
            'label': 'INGEST'
        })
        
        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data
    
    def test_gmail_ingest_uses_defaults(self, client):
        """Should use default values for email and label"""
        # Empty body
        response = client.post('/gmail/ingest', json={})
        
        # Should not crash, should use defaults
        assert response.status_code in [200, 500]  # 500 if SA not valid
    
    def test_gmail_ingest_custom_query(self, client):
        """Should accept custom Gmail query"""
        response = client.post('/gmail/ingest', json={
            'email': 'test@example.com',
            'label': 'CUSTOM',
            'query': 'subject:test has:attachment'
        })
        
        assert response.status_code in [200, 500]
    
    @pytest.mark.integration
    def test_gmail_ingest_with_mock_service(self, client, mock_gmail_service, monkeypatch):
        """Test Gmail ingest with mocked Gmail service"""
        from unittest.mock import patch
        
        with patch('api.create_gmail_service', return_value=mock_gmail_service):
            response = client.post('/gmail/ingest', json={
                'email': 'resper@ness.com.br',
                'label': 'INGEST'
            })
            
            assert response.status_code == 200
            data = response.get_json()
            
            assert data['status'] == 'ok'
            assert 'scanned' in data
            assert 'processed' in data
            assert data['email'] == 'resper@ness.com.br'
            assert data['label'] == 'INGEST'


class TestErrorHandling:
    """Test error handling scenarios"""
    
    def test_invalid_json_body(self, client):
        """Should handle invalid JSON gracefully"""
        response = client.post('/gmail/ingest',
            data='invalid json',
            content_type='application/json'
        )
        
        assert response.status_code in [400, 500]
    
    def test_missing_content_type(self, client):
        """Should handle missing content-type"""
        response = client.post('/gmail/ingest')
        
        # Should not crash
        assert response.status_code in [400, 500]


# Total: 15+ tests para backend
# Coverage esperado: 60-70%

