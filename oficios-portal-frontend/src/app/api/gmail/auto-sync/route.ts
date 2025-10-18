import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rate-limit';
import { withValidation, schemas } from '@/middleware/validation';
import { createRequestLogger } from '@/lib/logger';

// POST: Auto-sync emails from configured Gmail account
// Protected with API Key auth, rate limiting, and input validation
async function handleAutoSync(
  request: NextRequest,
  validated: { email: string; label: string }
) {
  try {
    const log = createRequestLogger(request);
    const { email, label } = validated;

    log.info('Gmail sync requested', { email, label });

    // GAP-003: Backend Python Integration
    // Decision: Waived for MVP - Feature planned for v2
    // See: docs/architecture/waivers/gap-003-gmail-sync.yml
    
    // For now, acknowledge request and return accepted status
    const results = {
      status: 'accepted',
      email,
      label,
      message: 'Gmail sync feature is planned for v2. Request logged.',
      version: 'v1.0-MVP',
      plannedRelease: 'v2.0'
    };

    // Log for future implementation tracking
    log.info('[GMAIL_SYNC] Sync request (waived feature)', {
      email,
      label,
      note: 'Feature waived - see ADR-002'
    });

    return NextResponse.json(results, { status: 202 }); // 202 Accepted
  } catch (error) {
    const log = createRequestLogger(request);
    log.error('Auto-sincronização failed', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        error: 'Erro na sincronização', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Apply middleware chain: Validation → Rate limit → API Key auth
export const POST = withValidation(
  schemas.gmailSync,
  withRateLimit(
    withApiKeyAuth(handleAutoSync),
    { max: 10, windowMs: 60000 }
  )
);

// GET: Status da sincronização
// Public endpoint (no auth required for status check)
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Contar ofícios por status
    const { data: stats, error } = await supabase
      .from('oficios')
      .select('status');

    if (error) throw error;

    const statusCount = (stats || []).reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      stats: {
        total: stats?.length || 0,
        ...statusCount
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status' },
      { status: 500 }
    );
  }
}

