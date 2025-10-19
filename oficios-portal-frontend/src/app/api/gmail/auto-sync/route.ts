import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rate-limit';
import { withValidation, schemas } from '@/middleware/validation';
import { createRequestLogger } from '@/lib/logger';
import { createGmailIngestClient } from '@/lib/gmail-ingest-client';

// POST: Auto-sync emails from configured Gmail account
// Protected with API Key auth, rate limiting, and input validation
async function handleAutoSync(
  request: NextRequest,
  validated: { email: string; label: string }
) {
  try {
    const log = createRequestLogger(request);
    const { email, label } = validated;

    log.info('Gmail sync started', { email, label });

    // IMPLEMENTAÇÃO REAL: Integrar com W0_gmail_ingest Cloud Function
    let gmailResult;
    
    try {
      // Call W0_gmail_ingest Cloud Function
      const gmailClient = createGmailIngestClient();
      gmailResult = await gmailClient.syncEmails({ email, label });
      
      log.info('W0_gmail_ingest completed', {
        scanned: gmailResult.scanned,
        bucket: gmailResult.bucket
      });
    } catch (error) {
      // If Cloud Function is not available, log and continue
      log.warn('W0_gmail_ingest not available', {
        error: error instanceof Error ? error.message : String(error),
        note: 'Check W0_GMAIL_INGEST_URL environment variable'
      });
      
      // Return informative response
      return NextResponse.json({
        status: 'degraded',
        message: 'Gmail ingest backend not configured',
        email,
        label,
        note: 'Configure W0_GMAIL_INGEST_URL to enable Gmail sync',
        scanned: 0
      }, { status: 503 });
    }

    // Process results and sync to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // TODO: Parse GCS attachments and create ofícios in Supabase
    // This will be implemented in W1_processamento_async integration
    
    const results = {
      status: 'success',
      email,
      label,
      scanned: gmailResult.scanned,
      bucket: gmailResult.bucket,
      query: gmailResult.query,
      message: `Successfully scanned ${gmailResult.scanned} emails from Gmail`
    };

    log.info('Gmail sync completed', results);

    return NextResponse.json(results, { status: 200 });
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

