/**
 * Hook para gerenciar jobs MCP
 */

import { useState, useEffect, useCallback } from 'react';
import { MCPJob, MCPJobStatus } from '@/types/mcp';

export function useMCPJobs(userId?: string) {
  const [jobs, setJobs] = useState<MCPJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mcp/history?limit=20`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico de jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getJobStatus = useCallback(async (jobId: string): Promise<MCPJobStatus | null> => {
    try {
      const response = await fetch(`/api/mcp/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao obter status do job');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Erro ao obter status do job:', err);
      return null;
    }
  }, []);

  const refreshJobs = useCallback(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    getJobStatus,
    refreshJobs
  };
}



