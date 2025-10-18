import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Gateway - Proxy para Backend Python W3
 * 
 * POST /api/webhook/oficios - Webhook Update (aprovar/rejeitar)
 * GET /api/webhook/oficios - Buscar ofício individual (deprecado, usar /get)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST - Webhook Update (Aprovar/Rejeitar/Adicionar Contexto)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validação
    if (!body.org_id || !body.oficio_id || !body.action) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: org_id, oficio_id, action' },
        { status: 400 }
      );
    }

    // Validar ações permitidas
    const validActions = ['approve_compliance', 'reject_compliance', 'add_context', 'assign_user'];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: `Ação inválida. Permitidas: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // URL do backend Python (Cloud Functions)
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 
      `https://southamerica-east1-${process.env.GCP_PROJECT_ID}.cloudfunctions.net/webhook-update`;

    // TODO: Usar Firebase token real do usuário
    const firebaseToken = process.env.FIREBASE_ADMIN_TOKEN || 'development-token';

    // Log da ação
    console.log(`📤 Webhook Update: ${body.action} - Ofício ${body.oficio_id}`);

    // Proxy request para backend Python
    const response = await fetch(pythonBackendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        user_id: user.id, // Adicionar user_id do Supabase
        user_email: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro backend Python:', data);
      
      // Se backend Python não disponível, tentar atualizar Supabase diretamente
      if (response.status >= 500) {
        return await handleSupabaseFallback(body, user);
      }
      
      return NextResponse.json(
        { error: data.error || 'Erro no backend Python' },
        { status: response.status }
      );
    }

    console.log('✅ Webhook Update bem-sucedido');

    // Sincronizar com Supabase se ação foi bem-sucedida
    await syncToSupabase(body, user);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro no API Gateway:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET - Buscar ofício (deprecado, usar /api/webhook/oficios/get)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oficioId = searchParams.get('oficio_id');

  if (!oficioId) {
    return NextResponse.json(
      { 
        error: 'Use /api/webhook/oficios/get?oficio_id=xxx',
        deprecated: true,
      },
      { status: 400 }
    );
  }

  // Redirect para novo endpoint
  return NextResponse.redirect(
    new URL(`/api/webhook/oficios/get?oficio_id=${oficioId}`, request.url)
  );
}

/**
 * Fallback: Atualizar Supabase se backend Python indisponível
 */
async function handleSupabaseFallback(
  body: any,
  user: any
): Promise<NextResponse> {
  console.warn('⚠️  Backend Python indisponível, usando Supabase fallback');

  const { oficio_id, action } = body;

  let updateData: any = { updatedAt: new Date().toISOString() };

  switch (action) {
    case 'approve_compliance':
      updateData.status = 'APROVADO_COMPLIANCE';
      break;
    case 'reject_compliance':
      updateData.status = 'REPROVADO_COMPLIANCE';
      break;
    default:
      break;
  }

  const { error } = await supabase
    .from('oficios')
    .update(updateData)
    .eq('oficio_id', oficio_id)
    .eq('userId', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Falha ao atualizar no Supabase' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Atualizado no Supabase (Python backend indisponível)',
    fallback: true,
  });
}

/**
 * Sincronizar com Supabase após sucesso no backend Python
 */
async function syncToSupabase(body: any, user: any): Promise<void> {
  const { oficio_id, action } = body;

  let updateData: any = { updatedAt: new Date().toISOString() };

  switch (action) {
    case 'approve_compliance':
      updateData.status = 'APROVADO_COMPLIANCE';
      break;
    case 'reject_compliance':
      updateData.status = 'REPROVADO_COMPLIANCE';
      break;
    default:
      break;
  }

  await supabase
    .from('oficios')
    .update(updateData)
    .eq('oficio_id', oficio_id)
    .eq('userId', user.id);

  console.log('✅ Sincronizado com Supabase');
}

