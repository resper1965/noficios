/**
 * API Client - Cliente tipado para chamar API Gateway
 * 
 * Centraliza todas chamadas ao backend, com tipos TypeScript
 * e tratamento de erros consistente
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Obter token Supabase do usuário atual
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Fazer request autenticado
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Tipos de resposta
 */
export interface OficioData {
  oficio_id: string;
  org_id: string;
  status: string;
  dados_extraidos?: {
    numero_oficio?: string;
    numero_processo?: string;
    autoridade_emissora?: string;
    prazo_resposta?: string;
    classificacao_intencao?: string;
    confianca_geral?: number;
    confiancas_por_campo?: Record<string, number>;
  };
  conteudo_bruto?: string;
  anexos_urls?: string[];
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * API Client
 */
export const apiClient = {
  /**
   * Listar ofícios aguardando revisão
   */
  async listPendingOficios(): Promise<OficioData[]> {
    const response = await authenticatedFetch('/api/webhook/oficios/list-pending');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar ofícios');
    }

    const data = await response.json();
    return data.oficios || [];
  },

  /**
   * Buscar ofício individual
   */
  async getOficio(oficioId: string, orgId = 'org_001'): Promise<OficioData> {
    const response = await authenticatedFetch(
      `/api/webhook/oficios/get?oficio_id=${oficioId}&org_id=${orgId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ofício não encontrado');
    }

    const data = await response.json();
    return data.oficio;
  },

  /**
   * Aprovar ofício
   */
  async aprovarOficio(
    oficioId: string,
    contextData: {
      dados_apoio?: string;
      notas?: string;
      referencias?: string[];
      responsavel?: string;
    },
    orgId = 'org_001'
  ): Promise<WebhookResponse> {
    const response = await authenticatedFetch('/api/webhook/oficios', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        oficio_id: oficioId,
        action: 'approve_compliance',
        dados_de_apoio_compliance: contextData.dados_apoio,
        notas_internas: contextData.notas,
        referencias_legais: contextData.referencias,
        assigned_user_id: contextData.responsavel,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao aprovar ofício');
    }

    return await response.json();
  },

  /**
   * Rejeitar ofício
   */
  async rejeitarOficio(
    oficioId: string,
    motivo: string,
    orgId = 'org_001'
  ): Promise<WebhookResponse> {
    const response = await authenticatedFetch('/api/webhook/oficios', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        oficio_id: oficioId,
        action: 'reject_compliance',
        motivo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao rejeitar ofício');
    }

    return await response.json();
  },

  /**
   * Adicionar contexto ao ofício
   */
  async adicionarContexto(
    oficioId: string,
    contextData: {
      dados_apoio?: string;
      notas?: string;
      referencias?: string[];
    },
    orgId = 'org_001'
  ): Promise<WebhookResponse> {
    const response = await authenticatedFetch('/api/webhook/oficios', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        oficio_id: oficioId,
        action: 'add_context',
        dados_de_apoio_compliance: contextData.dados_apoio,
        notas_internas: contextData.notas,
        referencias_legais: contextData.referencias,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao adicionar contexto');
    }

    return await response.json();
  },

  /**
   * Atribuir responsável
   */
  async atribuirResponsavel(
    oficioId: string,
    userId: string,
    orgId = 'org_001'
  ): Promise<WebhookResponse> {
    const response = await authenticatedFetch('/api/webhook/oficios', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        oficio_id: oficioId,
        action: 'assign_user',
        assigned_user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atribuir responsável');
    }

    return await response.json();
  },
};

