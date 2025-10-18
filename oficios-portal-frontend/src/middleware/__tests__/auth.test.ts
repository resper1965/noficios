import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '../auth';

describe('withApiKeyAuth Middleware', () => {
  const mockHandler = vi.fn(async () => 
    NextResponse.json({ success: true })
  );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GMAIL_SYNC_API_KEY = 'test-valid-key-32-characters-min';
  });

  afterEach(() => {
    delete process.env.GMAIL_SYNC_API_KEY;
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const wrapped = withApiKeyAuth(mockHandler);
      const response = await wrapped(request);
      
      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Authentication required',
        code: 'AUTH_MISSING_API_KEY'
      });
    });

    it('should reject requests with invalid API key', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-api-key': 'invalid-key' }
      });
      
      const wrapped = withApiKeyAuth(mockHandler);
      const response = await wrapped(request);
      
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
      
      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Invalid credentials',
        code: 'AUTH_INVALID_API_KEY'
      });
    });

    it('should accept requests with valid API key', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-api-key': 'test-valid-key-32-characters-min' }
      });
      
      const wrapped = withApiKeyAuth(mockHandler);
      await wrapped(request);
      
      expect(mockHandler).toHaveBeenCalledWith(request);
    });

    it('should handle missing environment variable', async () => {
      delete process.env.GMAIL_SYNC_API_KEY;
      
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-api-key': 'any-key' }
      });
      
      const wrapped = withApiKeyAuth(mockHandler);
      const response = await wrapped(request);
      
      expect(response.status).toBe(500);
      
      const body = await response.json();
      expect(body.code).toBe('AUTH_SERVER_ERROR');
    });
  });

  describe('Security', () => {
    it('should use constant-time comparison', async () => {
      const validKey = 'a'.repeat(32);
      process.env.GMAIL_SYNC_API_KEY = validKey;
      
      const timings: number[] = [];
      
      // Test with keys that differ at different positions
      const testKeys = [
        'b' + 'a'.repeat(31), // Differs at position 0
        'a'.repeat(16) + 'b' + 'a'.repeat(15), // Differs at middle
        'a'.repeat(31) + 'b'  // Differs at end
      ];
      
      for (const testKey of testKeys) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'x-api-key': testKey }
        });
        
        const start = performance.now();
        await withApiKeyAuth(mockHandler)(request);
        const end = performance.now();
        
        timings.push(end - start);
      }
      
      // Verify timing variance is minimal
      const mean = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be very low for constant-time
      expect(stdDev).toBeLessThan(1); // Less than 1ms variance
    });

    it('should include WWW-Authenticate header on 401', async () => {
      const request = new NextRequest('http://localhost/api/test');
      
      const wrapped = withApiKeyAuth(mockHandler);
      const response = await wrapped(request);
      
      expect(response.headers.get('WWW-Authenticate')).toContain('ApiKey');
    });

    it('should log failed authentication attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 
          'x-api-key': 'invalid-key',
          'x-forwarded-for': '192.168.1.100'
        }
      });
      
      await withApiKeyAuth(mockHandler)(request);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH]'),
        expect.objectContaining({
          ip: '192.168.1.100'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Configuration', () => {
    it('should support custom API key header', async () => {
      process.env.API_KEY_HEADER = 'x-custom-key';
      
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-custom-key': 'test-valid-key-32-characters-min' }
      });
      
      const wrapped = withApiKeyAuth(mockHandler);
      await wrapped(request);
      
      expect(mockHandler).toHaveBeenCalled();
      
      delete process.env.API_KEY_HEADER;
    });
  });
});

