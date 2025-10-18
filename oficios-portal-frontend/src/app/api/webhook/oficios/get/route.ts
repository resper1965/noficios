import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Buscar Ofício Individual
 * 
 * GET /api/webhook/oficios/get?oficio_id=xxx
 * 
 * Busca ofício específico do Firestore via backend Python
 * Retorna dados completos incluindo extração IA
 */

export async function GET(request: NextRequest) {
  try {
    // Import dinâmico
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || 'placeholder'
    );
    
    const searchParams = request.nextUrl.searchParams;
    const oficioId = searchParams.get('oficio_id');
    const orgId = searchParams.get('org_id') || 'org_001';

    if (!oficioId) {
      return NextResponse.json(
        { error: 'oficio_id é obrigatório' },
        { status: 400 }
      );
    }

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

    // URL do backend Python
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ||
      `https://southamerica-east1-${process.env.GCP_PROJECT_ID}.cloudfunctions.net/get-oficio`;

    const firebaseToken = process.env.FIREBASE_ADMIN_TOKEN || 'development-token';

    // Tentar buscar do backend Python primeiro
    try {
      const response = await fetch(
        `${pythonBackendUrl}?org_id=${orgId}&oficio_id=${oficioId}`,
        {
          headers: {
            'Authorization': `Bearer ${firebaseToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          source: 'python_backend',
          oficio: data.oficio,
        });
      }
    } catch (error) {
      console.warn('Backend Python indisponível, tentando Supabase');
    }

    // Fallback: buscar do Supabase
    const { data: oficio, error: dbError } = await supabase
      .from('oficios')
      .select('*')
      .eq('oficio_id', oficioId)
      .eq('userId', user.id)
      .single();

    if (dbError || !oficio) {
      return NextResponse.json(
        { error: 'Ofício não encontrado' },
        { status: 404 }
      );
    }

    // Transformar formato Supabase → Python
    return NextResponse.json({
      source: 'supabase',
      oficio: {
        oficio_id: oficio.oficio_id,
        org_id: orgId,
        status: oficio.status,
        dados_extraidos: oficio.dados_ia || {
          numero_oficio: oficio.numero,
          numero_processo: oficio.processo,
          autoridade_emissora: oficio.autoridade,
          prazo_resposta: oficio.prazo,
          confianca_geral: oficio.confianca_ia || 0,
          confiancas_por_campo: {},
        },
        conteudo_bruto: oficio.ocrText,
        anexos_urls: oficio.pdfUrl ? [oficio.pdfUrl] : [],
        created_at: oficio.createdAt,
        updated_at: oficio.updatedAt,
      },
    });

  } catch (error) {
    console.error('Erro ao buscar ofício:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

