import { createClient } from '@supabase/supabase-js';

// Types (re-export from api.ts for compatibility)
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

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema type
export interface Database {
  public: {
    Tables: {
      oficios: {
        Row: Oficio;
        Insert: Omit<Oficio, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Oficio, 'id' | 'createdAt' | 'updatedAt'>>;
      };
    };
  };
}

// Supabase Service Class
class SupabaseService {
  // Get all oficios for a user
  async getOficios(userId?: string): Promise<Oficio[]> {
    let query = supabase.from('oficios').select('*').order('createdAt', { ascending: false });

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Get single oficio
  async getOficio(id: number | string): Promise<Oficio> {
    const { data, error } = await supabase.from('oficios').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) throw new Error('Ofício não encontrado');

    return data;
  }

  // Busca full-text otimizada
  async searchOficios(userId: string, searchTerm: string): Promise<Oficio[]> {
    if (!searchTerm.trim()) {
      return this.getOficios(userId);
    }

    // Busca em múltiplos campos usando OR
    const { data, error } = await supabase
      .from('oficios')
      .select('*')
      .eq('userId', userId)
      .or(`numero.ilike.%${searchTerm}%,processo.ilike.%${searchTerm}%,autoridade.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create oficio
  async createOficio(data: CreateOficioData): Promise<Oficio> {
    const { data: newOficio, error } = await supabase
      .from('oficios')
      .insert({
        ...data,
        status: 'ativo',
        resposta: null,
        anexos: [],
      })
      .select()
      .single();

    if (error) throw error;
    if (!newOficio) throw new Error('Erro ao criar ofício');

    return newOficio;
  }

  // Update oficio
  async updateOficio(id: number | string, data: Partial<Oficio>): Promise<Oficio> {
    const { data: updatedOficio, error } = await supabase
      .from('oficios')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedOficio) throw new Error('Ofício não encontrado');

    return updatedOficio;
  }

  // Delete oficio
  async deleteOficio(id: number | string): Promise<void> {
    const { error } = await supabase.from('oficios').delete().eq('id', id);

    if (error) throw error;
  }

  // Calculate stats from oficios
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

export const supabaseService = new SupabaseService();

