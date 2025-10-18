/**
 * Cliente para Backend Python/GCP
 * Conecta frontend Supabase com backend Python (Cloud Functions)
 */

export interface PythonBackendConfig {
  baseUrl: string;
  projectId: string;
}

export interface OficioFirestore {
  oficio_id: string;
  org_id: string;
  status: string;
  dados_extraidos?: {
    numero_oficio?: string;
    numero_processo?: string;
    autoridade_emissora?: string;
    prazo_resposta?: string;
    entidades_citadas?: string[];
    classificacao_intencao?: string;
    confianca_geral?: number; // 0-1
    confiancas_por_campo?: Record<string, number>;
  };
  conteudo_bruto?: string;
  anexos_urls?: string[];
  dados_de_apoio_compliance?: string;
  notas_internas?: string;
  referencias_legais?: string[];
  assigned_user_id?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookUpdatePayload {
  org_id: string;
  oficio_id: string;
  action: 'approve_compliance' | 'reject_compliance' | 'add_context' | 'assign_user';
  dados_de_apoio_compliance?: string;
  notas_internas?: string;
  referencias_legais?: string[];
  assigned_user_id?: string;
  motivo?: string; // Para rejeição
}

export class PythonBackendClient {
  private baseUrl: string;
  private projectId: string;

  constructor(config: PythonBackendConfig) {
    this.baseUrl = config.baseUrl;
    this.projectId = config.projectId;
  }

  /**
   * Get Firebase token from current user
   */
  private async getFirebaseToken(): Promise<string> {
    // Importar dinamicamente para evitar erro SSR
    const { getFirebaseIdToken } = await import('./firebase-auth');
    
    const token = await getFirebaseIdToken();
    
    if (!token) {
      // Fallback para desenvolvimento
      console.warn('⚠️  Firebase token não disponível, usando mock');
      return 'mock-token-for-development';
    }
    
    return token;
  }

  /**
   * Buscar ofício do Firestore
   */
  async getOficio(orgId: string, oficioId: string): Promise<OficioFirestore | null> {
    try {
      const token = await this.getFirebaseToken();
      
      const response = await fetch(
        `${this.baseUrl}/get-oficio?org_id=${orgId}&oficio_id=${oficioId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.oficio || null;
    } catch (error) {
      console.error('Erro ao buscar ofício do backend Python:', error);
      throw error;
    }
  }

  /**
   * Listar ofícios aguardando compliance
   */
  async listOficiosAguardandoCompliance(orgId: string): Promise<OficioFirestore[]> {
    try {
      const token = await this.getFirebaseToken();
      
      const response = await fetch(
        `${this.baseUrl}/list-oficios?org_id=${orgId}&status=AGUARDANDO_COMPLIANCE`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.oficios || [];
    } catch (error) {
      console.error('Erro ao listar ofícios:', error);
      return [];
    }
  }

  /**
   * Webhook Update - Ações de compliance
   */
  async webhookUpdate(payload: WebhookUpdatePayload): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getFirebaseToken();
      
      const response = await fetch(
        `${this.baseUrl}/webhook-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no webhook update:', error);
      throw error;
    }
  }

  /**
   * Aprovar ofício (wrapper conveniente)
   */
  async aprovarOficio(
    orgId: string,
    oficioId: string,
    contextData: {
      dados_apoio?: string;
      notas?: string;
      referencias?: string[];
      responsavel?: string;
    }
  ): Promise<{ success: boolean; message?: string }> {
    return this.webhookUpdate({
      org_id: orgId,
      oficio_id: oficioId,
      action: 'approve_compliance',
      dados_de_apoio_compliance: contextData.dados_apoio,
      notas_internas: contextData.notas,
      referencias_legais: contextData.referencias,
      assigned_user_id: contextData.responsavel,
    });
  }

  /**
   * Rejeitar ofício
   */
  async rejeitarOficio(
    orgId: string,
    oficioId: string,
    motivo: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.webhookUpdate({
      org_id: orgId,
      oficio_id: oficioId,
      action: 'reject_compliance',
      motivo,
    });
  }

  /**
   * Adicionar contexto sem aprovar
   */
  async adicionarContexto(
    orgId: string,
    oficioId: string,
    contextData: {
      dados_apoio?: string;
      notas?: string;
      referencias?: string[];
    }
  ): Promise<{ success: boolean; message?: string }> {
    return this.webhookUpdate({
      org_id: orgId,
      oficio_id: oficioId,
      action: 'add_context',
      dados_de_apoio_compliance: contextData.dados_apoio,
      notas_internas: contextData.notas,
      referencias_legais: contextData.referencias,
    });
  }

  /**
   * Atribuir responsável
   */
  async atribuirResponsavel(
    orgId: string,
    oficioId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.webhookUpdate({
      org_id: orgId,
      oficio_id: oficioId,
      action: 'assign_user',
      assigned_user_id: userId,
    });
  }
}

// Singleton instance
const config: PythonBackendConfig = {
  baseUrl: process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8080',
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID || 'oficio-noficios',
};

export const pythonBackend = new PythonBackendClient(config);

