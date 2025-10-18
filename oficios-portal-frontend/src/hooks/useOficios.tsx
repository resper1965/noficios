'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseService as apiService, Oficio, DashboardStats } from '@/lib/supabase';
import { useAuth } from './useAuthSupabase';

export function useOficios() {
  const { user } = useAuth();
  const [oficios, setOficios] = useState<Oficio[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch oficios from API
  const fetchOficios = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getOficios(user.email || undefined);
      setOficios(data);

      // Calculate stats from oficios
      const calculatedStats = apiService.calculateStats(data);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ofícios');
      console.error('Error fetching oficios:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data on mount and when user changes
  useEffect(() => {
    fetchOficios();
  }, [fetchOficios]);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchOficios();
  }, [fetchOficios]);

  return {
    oficios,
    stats,
    loading,
    error,
    refresh,
  };
}

// Hook for single oficio
export function useOficio(id: number | string) {
  const [oficio, setOficio] = useState<Oficio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOficio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getOficio(id);
      setOficio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ofício');
      console.error('Error fetching oficio:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOficio();
    }
  }, [id, fetchOficio]);

  return {
    oficio,
    loading,
    error,
    refresh: fetchOficio,
  };
}

