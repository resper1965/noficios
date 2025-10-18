import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Listar Ofícios Aguardando Revisão HITL
 * 
 * GET /api/webhook/oficios/list-pending
 * 
 * Busca ofícios com status AGUARDANDO_COMPLIANCE do Firestore
 * via backend Python e retorna lista para o dashboard
 */

export async function GET(request: NextRequest) {
  try {
    // Import dinâmico
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || 'placeholder'
    );
    
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Validar token Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obter org_id do usuário (por enquanto hardcoded, depois vem do DB)
    const orgId = 'org_001'; // TODO: Buscar do user metadata

    // URL do backend Python
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ||
      `https://southamerica-east1-${process.env.GCP_PROJECT_ID}.cloudfunctions.net/list-oficios`;

    // TODO: Obter Firebase token real para autenticar com backend Python
    const firebaseToken = process.env.FIREBASE_ADMIN_TOKEN || 'development-token';

    // Chamar backend Python
    const response = await fetch(
      `${pythonBackendUrl}?org_id=${orgId}&status=AGUARDANDO_COMPLIANCE`,
      {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Se backend Python não disponível, buscar do Supabase
      console.warn('Backend Python indisponível, buscando do Supabase');
      
      const { data: oficios, error: dbError } = await supabase
        .from('oficios')
        .select('*')
        .eq('userId', user.id)
        .eq('status', 'AGUARDANDO_COMPLIANCE')
        .order('createdAt', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      return NextResponse.json({
        source: 'supabase',
        oficios: oficios || [],
        count: oficios?.length || 0,
      });
    }

    const data = await response.json();

    return NextResponse.json({
      source: 'python_backend',
      oficios: data.oficios || [],
      count: data.count || 0,
    });

  } catch (error) {
    console.error('Erro ao listar ofícios pendentes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

