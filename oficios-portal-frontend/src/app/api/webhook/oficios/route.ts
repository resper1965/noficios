import { NextRequest, NextResponse } from 'next/server';

/**
 * API Gateway - Proxy para Backend Python W3
 * Rota: POST /api/webhook/oficios
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.org_id || !body.oficio_id || !body.action) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: org_id, oficio_id, action' },
        { status: 400 }
      );
    }

    // URL do backend Python (Cloud Functions)
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 
      `https://southamerica-east1-${process.env.GCP_PROJECT_ID}.cloudfunctions.net/webhook-update`;

    // TODO: Obter Firebase token do usuário autenticado
    // Por enquanto usa variável de ambiente para desenvolvimento
    const firebaseToken = process.env.FIREBASE_ADMIN_TOKEN || 'development-token';

    // Proxy request para backend Python
    const response = await fetch(pythonBackendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro no backend Python' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no API Gateway:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET - Buscar ofício do Firestore
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    const oficioId = searchParams.get('oficio_id');

    if (!orgId || !oficioId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: org_id, oficio_id' },
        { status: 400 }
      );
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ||
      `https://southamerica-east1-${process.env.GCP_PROJECT_ID}.cloudfunctions.net/get-oficio`;

    const firebaseToken = process.env.FIREBASE_ADMIN_TOKEN || 'development-token';

    const response = await fetch(
      `${pythonBackendUrl}?org_id=${orgId}&oficio_id=${oficioId}`,
      {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Ofício não encontrado' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar ofício:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ofício' },
      { status: 500 }
    );
  }
}

