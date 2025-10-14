/**
 * Cliente HTTP seguro para comunicação com Cloud Functions.
 * Injeta JWT automaticamente e trata erros de autenticação.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://southamerica-east1-PROJECT.cloudfunctions.net';

export interface ApiError {
  error: string;
  message?: string;
  required_roles?: string[];
}

/**
 * Cliente HTTP seguro com injeção automática de JWT.
 */
export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  /**
   * Requisição HTTP genérica com autenticação.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    if (!token) {
      // Redireciona para login se não houver token
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Não autenticado');
    }

    const url = `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Tratamento de erros de autenticação
    if (response.status === 401) {
      // Token inválido - redireciona para login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (response.status === 403) {
      // Sem permissão
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || 'Acesso negado. Você não tem permissão para esta operação.');
    }

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload de arquivo (multipart/form-data)
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = await this.getToken();

    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Não autenticado');
    }

    const url = `${this.baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Não setar Content-Type para multipart/form-data (browser define automaticamente)
      },
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }

    if (response.status === 403) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || 'Acesso negado');
    }

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Função helper para criar instância do ApiClient.
 * Deve ser usada dentro de componentes que têm acesso ao useAuth.
 */
export function createApiClient(getToken: () => Promise<string | null>): ApiClient {
  return new ApiClient(API_BASE_URL, getToken);
}

/**
 * Tipos TypeScript para as respostas da API
 */
export interface Organization {
  org_id: string;
  name: string;
  email_domains: string[];
  admin_email: string;
  notification_email?: string;
  settings?: {
    auto_process?: boolean;
    require_compliance_approval?: boolean;
    config_llm_model?: string;
  };
  billing?: {
    llm_tokens_consumed?: number;
    oficios_processed?: number;
    storage_bytes?: number;
    estimated_cost_usd?: number;
  };
  created_at?: string;
  active?: boolean;
}

export interface Metrics {
  org_id: string;
  period: string;
  kpis: {
    total_oficios: number;
    taxa_resposta: number;
    sla_atingido_percent: number;
    confianca_media_llm: number;
    tempo_medio_processamento_seg: number;
    taxa_atribuicao_percent: number;
  };
  por_status: Record<string, number>;
  por_prioridade: Record<string, number>;
  por_prompt_version: Record<string, number>;
  billing: {
    llm_tokens_consumed: number;
    oficios_processed: number;
    storage_bytes: number;
    estimated_cost_usd: number;
  };
}

export interface OficioData {
  oficio_id: string;
  org_id: string;
  status: string;
  assigned_user_id?: string;
  dados_extraidos?: {
    autoridade_nome: string;
    processo_numero?: string;
    solicitacoes: string[];
    prazo_dias: number;
    tipo_resposta_provavel: string;
    confianca: number;
    raw_text: string;
    classificacao_intencao?: string;
    elementos_necessarios_resposta?: string[];
  };
  data_limite?: string;
  prioridade?: string;
  confianca_extracao?: number;
  llm_prompt_version?: string;
}





