/**
 * Rate Limiting Middleware
 * 
 * Protects endpoints from abuse and DoS attacks
 * In-memory implementation suitable for single-instance deployment
 * Based on Context7 patterns
 * 
 * @module middleware/rate-limit
 * @priority P0
 * @gap GAP-002
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit record structure
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
  firstRequest: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum requests allowed in window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom message when limit exceeded */
  message?: string;
  /** Custom status code (default: 429) */
  statusCode?: number;
  /** Skip rate limit for certain conditions */
  skip?: (request: NextRequest) => boolean;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * In-memory store for rate limit records
 * Note: This is reset when server restarts
 * For production with multiple instances, use Redis/Upstash
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Cleanup interval for expired records (runs every 60 seconds)
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start cleanup process to prevent memory leaks
 */
function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => rateLimitStore.delete(key));
    
    if (keysToDelete.length > 0) {
      console.debug(`[RATE_LIMIT] Cleaned up ${keysToDelete.length} expired records`);
    }
  }, 60000); // Every 60 seconds
}

// Start cleanup on module load
startCleanup();

/**
 * Default IP-based key generator
 * Extracts IP from various headers
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try multiple headers (proxy-aware)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-client-ip') ||
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware
 * 
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(
 *   withApiKeyAuth(handler),
 *   { max: 10, windowMs: 60000 } // 10 req/min
 * );
 * ```
 * 
 * Headers added to response:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds to wait (only when limited)
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig = { max: 10, windowMs: 60000 }
) {
  const {
    max,
    windowMs,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skip,
    keyGenerator = defaultKeyGenerator
  } = config;
  
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Check if rate limiting should be skipped
    if (skip && skip(request)) {
      return handler(request, ...args);
    }
    
    // Generate unique key for this client
    const key = keyGenerator(request);
    const now = Date.now();
    
    // Get or create rate limit record
    let record = rateLimitStore.get(key);
    
    if (!record || now > record.resetAt) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetAt: now + windowMs,
        firstRequest: now
      };
      rateLimitStore.set(key, record);
      
      // First request in window - allow
      return addRateLimitHeaders(
        await handler(request, ...args),
        max,
        max - 1,
        record.resetAt
      );
    }
    
    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      
      // Log rate limit exceeded
      console.warn('[RATE_LIMIT] Limit exceeded', {
        key,
        url: request.url,
        count: record.count,
        max,
        retryAfter,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        },
        {
          status: statusCode,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(record.resetAt / 1000).toString(),
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Increment counter
    record.count++;
    
    // Allow request with rate limit headers
    return addRateLimitHeaders(
      await handler(request, ...args),
      max,
      max - record.count,
      record.resetAt
    );
  };
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
  
  return response;
}

/**
 * Get current rate limit status for a key
 * Useful for debugging and monitoring
 */
export function getRateLimitStatus(key: string): RateLimitRecord | null {
  const record = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!record || now > record.resetAt) {
    return null;
  }
  
  return { ...record };
}

/**
 * Reset rate limit for a specific key
 * Useful for testing or manual intervention
 */
export function resetRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Get all active rate limit keys
 * For monitoring and debugging
 */
export function getActiveRateLimitKeys(): string[] {
  const now = Date.now();
  const activeKeys: string[] = [];
  
  rateLimitStore.forEach((record, key) => {
    if (now <= record.resetAt) {
      activeKeys.push(key);
    }
  });
  
  return activeKeys;
}

/**
 * Clear all rate limit records
 * Use with caution - for testing/maintenance only
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
  console.info('[RATE_LIMIT] All rate limit records cleared');
}

