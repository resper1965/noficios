/**
 * Authentication Middleware
 * 
 * Provides API Key authentication for automated endpoints
 * Based on Context7 security patterns
 * 
 * @module middleware/auth
 * @priority P0
 * @gap GAP-001
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * API Key authentication middleware
 * 
 * Usage:
 * ```typescript
 * export const POST = withApiKeyAuth(handler);
 * ```
 * 
 * Headers required:
 * - x-api-key: Valid API key from environment
 * 
 * Environment variables:
 * - GMAIL_SYNC_API_KEY: API key for Gmail sync endpoint
 * - API_KEY_HEADER: Custom header name (default: 'x-api-key')
 */
export function withApiKeyAuth(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const headerName = process.env.API_KEY_HEADER || 'x-api-key';
    const apiKey = request.headers.get(headerName);
    
    // Check if API key is provided
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: `Missing ${headerName} header`,
          code: 'AUTH_MISSING_API_KEY'
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': `ApiKey realm="API", charset="UTF-8"`
          }
        }
      );
    }
    
    // Validate API key against environment variable
    const validKey = process.env.GMAIL_SYNC_API_KEY;
    
    if (!validKey) {
      console.error('[AUTH] GMAIL_SYNC_API_KEY not configured in environment');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          code: 'AUTH_SERVER_ERROR'
        },
        { status: 500 }
      );
    }
    
    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(apiKey, validKey)) {
      // Log failed attempt (without exposing the key)
      console.warn('[AUTH] Invalid API key attempt from', {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        url: request.url,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          message: 'The provided API key is invalid',
          code: 'AUTH_INVALID_API_KEY'
        },
        { 
          status: 403,
          headers: {
            'WWW-Authenticate': `ApiKey realm="API", charset="UTF-8", error="invalid_token"`
          }
        }
      );
    }
    
    // Authentication successful - add metadata to request
    // Note: This is for logging/debugging, actual auth is complete
    console.info('[AUTH] Authenticated request', {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });
    
    // Call the actual handler
    return handler(request, ...args);
  };
}

/**
 * Constant-time string comparison
 * Prevents timing attacks by ensuring comparison always takes same time
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match
 */
function constantTimeCompare(a: string, b: string): boolean {
  // If lengths differ, still do comparison to prevent timing leak
  const aLen = Buffer.byteLength(a);
  const bLen = Buffer.byteLength(b);
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  // Use crypto.timingSafeEqual if available (Node.js 6.6+)
  if (aLen !== bLen) {
    // Do a fake comparison to prevent timing leak
    const fakeBuffer = Buffer.alloc(aLen);
    let result = 1;
    for (let i = 0; i < aLen; i++) {
      result |= bufA[i] ^ fakeBuffer[i];
    }
    return false;
  }
  
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < aLen; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  
  return result === 0;
}

/**
 * Generate a secure API key
 * 
 * Usage (for setup only):
 * ```typescript
 * const apiKey = generateApiKey();
 * console.log('Add to .env.local:');
 * console.log(`GMAIL_SYNC_API_KEY=${apiKey}`);
 * ```
 */
export function generateApiKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const randomValues = new Uint8Array(length);
  
  // Use Web Crypto API for cryptographically secure random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for Node.js environment
    const nodeCrypto = require('crypto');
    nodeCrypto.randomFillSync(randomValues);
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

