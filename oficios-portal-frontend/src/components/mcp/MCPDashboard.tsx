'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuthSupabase';
import { useMCPExecution } from '@/hooks/useMCPExecution';
import { useMCPJobs } from '@/hooks/useMCPJobs';
import { MCPExecutionOptions } from '@/types/mcp';
import { Play, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export function MCPDashboard() {
  const { user } = useAuth();
  const { executeMCP, loading, error, clearError } = useMCPExecution();
  const { jobs, loading: jobsLoading, refreshJobs } = useMCPJobs(user?.id);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    if (!user?.email) return;

    setExecuting(true);
    clearError();

    const options: MCPExecutionOptions = {
      gmail_account: user.email,
      label: 'INGEST',
      max_emails: 50
    };

    const result = await executeMCP(options);
    
    if (result) {
      // Atualizar lista de jobs
      refreshJobs();
    }
    
    setExecuting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'running':
        return 'Executando';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          MCP Gmail Integration
        </h1>
        <p className="text-gray-400">
          Execute a sincronização de emails com label INGEST de forma user-friendly
        </p>
      </div>

      {/* Executar MCP */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Executar Sincronização
        </h2>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExecute}
            disabled={loading || executing}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading || executing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            <span>
              {loading || executing ? 'Executando...' : 'Executar MCP'}
            </span>
          </button>
          
          <div className="text-sm text-gray-400">
            Conta: {user?.email}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">Erro na execução</span>
            </div>
            <p className="text-red-300 mt-2">{error.error.message}</p>
          </div>
        )}
      </div>

      {/* Histórico de Jobs */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Histórico de Execuções
          </h2>
          <button
            onClick={refreshJobs}
            disabled={jobsLoading}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-400">Carregando...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Nenhuma execução encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="text-white font-medium">
                        {job.gmail_account}
                      </div>
                      <div className="text-sm text-gray-400">
                        {job.emails_processed} emails processados
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {getStatusText(job.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(job.started_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {job.error_message && (
                  <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-300">
                    {job.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
