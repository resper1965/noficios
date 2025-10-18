'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuthSupabase';

interface OficioAguardandoRevisao {
  oficio_id: string;
  numero: string;
  autoridade: string;
  confianca: number;
  diasRestantes: number;
  status: string;
}

export function useOficiosAguardandoRevisao() {
  const { user } = useAuth();
  const [oficios, setOficios] = useState<OficioAguardandoRevisao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOficios([]);
      setLoading(false);
      return;
    }

    loadOficiosPendentes();
  }, [user]);

  const loadOficiosPendentes = async () => {
    setLoading(true);
    setError(null);

    try {
      const { apiClient } = await import('@/lib/api-client');
      
      // Buscar ofícios aguardando revisão
      const oficiosData = await apiClient.listPendingOficios();

      // Transformar para formato do dashboard
      const transformed = oficiosData.map((oficio) => {
        const prazo = oficio.dados_extraidos?.prazo_resposta;
        const diasRestantes = prazo 
          ? Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          oficio_id: oficio.oficio_id,
          numero: oficio.dados_extraidos?.numero_oficio || 'N/A',
          autoridade: oficio.dados_extraidos?.autoridade_emissora || 'N/A',
          confianca: Math.round((oficio.dados_extraidos?.confianca_geral || 0) * 100),
          diasRestantes,
          status: oficio.status,
        };
      });

      setOficios(transformed);
    } catch (err) {
      console.error('Erro ao carregar ofícios pendentes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setOficios([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    oficios,
    loading,
    error,
    refresh: loadOficiosPendentes,
  };
}

