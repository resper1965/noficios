import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Sincronizar Supabase → Firebase
 * 
 * Recebe token Supabase, valida usuário, e retorna custom token Firebase
 * para permitir autenticação dupla (Supabase + Firebase)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key (server-side only)
);

export async function POST(request: NextRequest) {
  try {
    // Obter token Supabase do header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token Supabase ausente' },
        { status: 401 }
      );
    }

    const supabaseToken = authHeader.replace('Bearer ', '');

    // Validar token Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      supabaseToken
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token Supabase inválido' },
        { status: 401 }
      );
    }

    // TODO: Chamar Firebase Admin SDK para gerar custom token
    // 
    // import { getAuth } from 'firebase-admin/auth';
    // const customToken = await getAuth().createCustomToken(user.id, {
    //   email: user.email,
    //   supabase_id: user.id,
    // });

    // Por enquanto, retornar erro indicando que precisa implementar Firebase Admin
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK não configurado',
        message: 'Instale firebase-admin e configure GOOGLE_APPLICATION_CREDENTIALS',
        user: {
          id: user.id,
          email: user.email,
        }
      },
      { status: 501 } // Not Implemented
    );

    // Quando implementado, retornar:
    // return NextResponse.json({
    //   firebaseCustomToken: customToken,
    //   userId: user.id,
    //   email: user.email,
    // });

  } catch (error) {
    console.error('Erro ao sincronizar auth:', error);
    return NextResponse.json(
      { error: 'Erro interno ao sincronizar autenticação' },
      { status: 500 }
    );
  }
}

