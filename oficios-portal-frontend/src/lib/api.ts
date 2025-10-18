// API Configuration and Services
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types
export interface Oficio {
  id: number | string;
  numero: string;
  processo: string;
  autoridade: string;
  status: 'ativo' | 'respondido' | 'vencido';
  prazo: string;
  descricao: string;
  resposta?: string | null;
  anexos?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  ativos: number;
  emRisco: number;
  vencidos: number;
  respondidos: number;
}

export interface CreateOficioData {
  numero: string;
  processo: string;
  autoridade: string;
  prazo: string;
  descricao: string;
  userId: string;
}

// API Service Class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch wrapper
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Oficios endpoints
  async getOficios(userId?: string): Promise<Oficio[]> {
    const url = userId ? `/oficios?userId=${userId}` : '/oficios';
    return this.fetch<Oficio[]>(url);
  }

  async getOficio(id: number | string): Promise<Oficio> {
    return this.fetch<Oficio>(`/oficios/${id}`);
  }

  async createOficio(data: CreateOficioData): Promise<Oficio> {
    return this.fetch<Oficio>('/oficios', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'ativo',
        resposta: null,
        anexos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  async updateOficio(id: number | string, data: Partial<Oficio>): Promise<Oficio> {
    return this.fetch<Oficio>(`/oficios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  async deleteOficio(id: number | string): Promise<void> {
    await this.fetch(`/oficios/${id}`, {
      method: 'DELETE',
    });
  }

  // Stats endpoint
  async getStats(): Promise<DashboardStats> {
    return this.fetch<DashboardStats>('/stats');
  }

  // Calculate real-time stats from oficios
  calculateStats(oficios: Oficio[]): DashboardStats {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return {
      ativos: oficios.filter((o) => o.status === 'ativo').length,
      emRisco: oficios.filter((o) => {
        if (o.status !== 'ativo') return false;
        const prazo = new Date(o.prazo);
        const diff = prazo.getTime() - now.getTime();
        return diff > 0 && diff < oneDayMs;
      }).length,
      vencidos: oficios.filter((o) => o.status === 'vencido').length,
      respondidos: oficios.filter((o) => o.status === 'respondido').length,
    };
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);

