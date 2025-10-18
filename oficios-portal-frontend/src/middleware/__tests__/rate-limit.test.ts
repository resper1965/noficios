import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, clearAllRateLimits } from '../rate-limit';

describe('withRateLimit Middleware', () => {
  const mockHandler = vi.fn(async () => 
    NextResponse.json({ success: true })
  );

  beforeEach(() => {
    vi.clearAllMocks();
    clearAllRateLimits();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const config = { max: 5, windowMs: 60000 };
      const wrapped = withRateLimit(mockHandler, config);
      
      // Send 5 requests
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        });
        
        const response = await wrapped(request);
        expect(response.status).toBe(200);
      }
      
      expect(mockHandler).toHaveBeenCalledTimes(5);
    });

    it('should block requests exceeding limit', async () => {
      const config = { max: 3, windowMs: 60000 };
      const wrapped = withRateLimit(mockHandler, config);
      
      // Send 5 requests (limit is 3)
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        });
        
        responses.push(await wrapped(request));
      }
      
      // First 3 should succeed
      expect(responses.slice(0, 3).every(r => r.status === 200)).toBe(true);
      
      // Next 2 should be rate limited
      expect(responses.slice(3).every(r => r.status === 429)).toBe(true);
      
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });

    it('should reset after window expires', async () => {
      const config = { max: 2, windowMs: 100 }; // 100ms window
      const wrapped = withRateLimit(mockHandler, config);
      
      // Send 2 requests
      for (let i = 0; i < 2; i++) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        });
        await wrapped(request);
      }
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should allow new requests
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
        });
      const response = await wrapped(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });

    it('should isolate limits by IP', async () => {
      const config = { max: 2, windowMs: 60000 };
      const wrapped = withRateLimit(mockHandler, config);
      
      // IP 1: Send 2 requests
      for (let i = 0; i < 2; i++) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.100' }
        });
        await wrapped(request);
      }
      
      // IP 2: Should have separate limit
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.101' }
      });
      const response = await wrapped(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response Headers', () => {
    it('should include rate limit headers', async () => {
      const config = { max: 5, windowMs: 60000 };
      const wrapped = withRateLimit(mockHandler, config);
      
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });
      
      const response = await wrapped(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should include Retry-After header when limited', async () => {
      const config = { max: 1, windowMs: 60000 };
      const wrapped = withRateLimit(mockHandler, config);
      
      // First request
      const request1 = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });
      await wrapped(request1);
      
      // Second request (should be limited)
      const request2 = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });
      const response = await wrapped(request2);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeTruthy();
      
      const body = await response.json();
      expect(body.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should support custom key generator', async () => {
      const customKeyGen = (req: NextRequest) => {
        return `custom:${req.headers.get('x-user-id')}`;
      };
      
      const config = { 
        max: 2, 
        windowMs: 60000,
        keyGenerator: customKeyGen
      };
      
      const wrapped = withRateLimit(mockHandler, config);
      
      // Same IP, different user IDs
      const request1 = new NextRequest('http://localhost/api/test', {
        headers: { 
          'x-forwarded-for': '192.168.1.100',
          'x-user-id': 'user1'
        }
      });
      
      const request2 = new NextRequest('http://localhost/api/test', {
        headers: { 
          'x-forwarded-for': '192.168.1.100',
          'x-user-id': 'user2'
        }
      });
      
      await wrapped(request1);
      await wrapped(request1);
      const response = await wrapped(request2);
      
      // user2 should have separate limit
      expect(response.status).toBe(200);
    });

    it('should support skip function', async () => {
      const skipFunc = (req: NextRequest) => {
        return req.headers.get('x-skip-limit') === 'true';
      };
      
      const config = { 
        max: 1, 
        windowMs: 60000,
        skip: skipFunc
      };
      
      const wrapped = withRateLimit(mockHandler, config);
      
      // Send 3 requests with skip header
      for (let i = 0; i < 3; i++) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 
            'x-forwarded-for': '192.168.1.100',
            'x-skip-limit': 'true'
          }
        });
        
        const response = await wrapped(request);
        expect(response.status).toBe(200);
      }
      
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });
});

