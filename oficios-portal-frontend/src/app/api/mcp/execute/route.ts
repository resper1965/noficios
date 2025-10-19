import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gmail_account, label = 'INGEST', max_emails = 50 } = body;

    if (!gmail_account) {
      return NextResponse.json(
        { error: 'gmail_account é obrigatório' },
        { status: 400 }
      );
    }

    // TODO: Feature MCP será implementada em v2.0
    // Por enquanto, retornar accepted
    return NextResponse.json({ 
      status: 'accepted',
      message: 'MCP feature em desenvolvimento',
      jobId: crypto.randomUUID()
    }, { status: 202 });

  } catch (error) {
    console.error('Erro na execução MCP:', error);
    return NextResponse.json(
      { 
        error: {
          code: 'MCP_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 500 }
    );
  }
}



