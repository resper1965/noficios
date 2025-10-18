import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST: Auto-sync emails from configured Gmail account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email = 'resper@ness.com.br', label = 'INGEST' } = body;

    console.log(`📧 Auto-sincronização Gmail: ${email} | Label: ${label}`);

    // TODO: Implementar integração com backend Python W0_gmail_ingest
    // Por enquanto, retornar sucesso simulado
    
    const results = {
      status: 'success',
      email,
      label,
      total: 0,
      imported: 0,
      needsReview: 0,
      message: 'Sincronização configurada. Aguardando implementação do backend Python.'
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('❌ Erro na auto-sincronização:', error);
    return NextResponse.json(
      { error: 'Erro na sincronização', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Status da sincronização
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

