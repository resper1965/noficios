/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and observability
 * Used by load balancers, monitoring systems, and ops teams
 * 
 * @module api/health
 * @priority P1
 * @quality Quick Win (+0.5 points)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    api: boolean;
    database: boolean;
    memory: boolean;
    disk?: boolean;
  };
  details?: {
    database?: {
      latency?: number;
      error?: string;
    };
    memory?: {
      heapUsed: number;
      heapTotal: number;
      percentage: number;
    };
  };
}

const startTime = Date.now();

/**
 * GET: System health check
 * 
 * Returns:
 * - 200: System is healthy
 * - 503: System is degraded or unhealthy
 * 
 * Response includes:
 * - Overall status
 * - Individual component checks
 * - Performance metrics
 * - Uptime
 */
export async function GET() {
  const checks: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      api: true,
      database: false,
      memory: false
    },
    details: {}
  };

  try {
    // Check 1: API is responding (implicit - we got here)
    checks.checks.api = true;

    // Check 2: Database connectivity
    try {
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

      const dbStart = performance.now();
      const { error } = await supabase
        .from('oficios')
        .select('id')
        .limit(1);
      const dbLatency = performance.now() - dbStart;

      checks.checks.database = !error;
      checks.details!.database = {
        latency: Math.round(dbLatency),
        error: error?.message
      };
    } catch (error) {
      checks.checks.database = false;
      checks.details!.database = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check 3: Memory usage
    const memUsage = process.memoryUsage();
    const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    checks.checks.memory = memPercentage < 90;
    checks.details!.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round(memPercentage)
    };

    // Determine overall status
    const allChecks = Object.values(checks.checks);
    const healthyCount = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;

    if (healthyCount === totalChecks) {
      checks.status = 'healthy';
    } else if (healthyCount >= totalChecks / 2) {
      checks.status = 'degraded';
    } else {
      checks.status = 'unhealthy';
    }

    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 503;

    return NextResponse.json(checks, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Critical error in health check itself
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        checks: {
          api: false,
          database: false,
          memory: false
        }
      },
      { 
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

