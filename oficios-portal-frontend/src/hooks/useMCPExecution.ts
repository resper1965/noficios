/**
 * Hook para execução MCP user-friendly
 */

import { useState, useCallback } from 'react';
import { MCPExecutionOptions, MCPExecutionResult, MCPError } from '@/types/mcp';

export function useMCPExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MCPError | null>(null);

  const executeMCP = useCallback(async (options: MCPExecutionOptions): Promise<MCPExecutionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro na execução MCP');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const mcpError: MCPError = {
        error: {
          code: 'MCP_PROCESSING_ERROR',
          message: err instanceof Error ? err.message : 'Erro desconhecido',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      };
      setError(mcpError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeMCP,
    loading,
    error,
    clearError
  };
}
