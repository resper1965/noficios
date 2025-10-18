import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MCPExecutor } from '@/services/mcp/MCPExecutor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

    // Obter usuário autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Executar MCP
    const executor = new MCPExecutor();
    const result = await executor.executeJob(user.id, {
      gmail_account,
      label,
      max_emails
    });

    return NextResponse.json(result);
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



