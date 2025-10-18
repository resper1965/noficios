import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Listar Usuários
 * 
 * GET /api/usuarios
 * 
 * Retorna lista de usuários da organização para atribuição de ofícios
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Buscar usuários do Supabase Auth
    // TODO: Filtrar por organização quando multi-tenancy estiver implementado
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    // Transformar para formato do frontend
    const usuariosFormatados = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      nome: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário',
      avatar_url: u.user_metadata?.avatar_url,
      created_at: u.created_at,
    }));

    // Ordenar por nome
    usuariosFormatados.sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({
      usuarios: usuariosFormatados,
      count: usuariosFormatados.length,
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

