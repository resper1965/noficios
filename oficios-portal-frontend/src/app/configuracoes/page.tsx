'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { ProductBrand } from '@/components/Logo';
import {
  ArrowLeft,
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    imported: number;
    needsReview: number;
    failed: number;
    oficios: Array<{
      email: string;
      parsed?: any;
      oficio?: {
        numero: string;
        processo: string;
      };
      errors?: string[];
      needsReview: boolean;
    }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnectGmail = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/gmail';
  };

  const handleSyncEmails = async () => {
    if (!user?.email) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);

      // TODO: Get stored tokens from Supabase
      const accessToken = localStorage.getItem('gmail_access_token');
      const refreshToken = localStorage.getItem('gmail_refresh_token');

      if (!accessToken) {
        setError('Gmail não conectado. Clique em "Conectar Gmail" primeiro.');
        return;
      }

      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          accessToken,
          refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }

      const result = await response.json();
      setSyncResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Settings className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-blue-400">Configurações</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Gmail Integration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Mail className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold">Integração Gmail</h2>
          </div>

          <p className="text-gray-400 mb-6">
            Conecte sua conta Gmail para importar ofícios automaticamente do email.
          </p>

          {/* Connect Gmail Button */}
          <button
            onClick={handleConnectGmail}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium mb-4"
          >
            <Mail className="h-5 w-5" />
            <span>Conectar Gmail</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSyncEmails}
            disabled={syncing}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Sincronizar Emails</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div className="mt-6 space-y-4">
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-3">Resultado da Sincronização</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{syncResult.imported}</p>
                    <p className="text-sm text-gray-400">Importados</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{syncResult.needsReview}</p>
                    <p className="text-sm text-gray-400">Precisam Revisão</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{syncResult.failed}</p>
                    <p className="text-sm text-gray-400">Falharam</p>
                  </div>
                </div>

                {/* Oficios List */}
                {syncResult.oficios && syncResult.oficios.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-300 mb-2">Ofícios Processados:</h4>
                    {syncResult.oficios.map((item, index: number) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 p-3 rounded-lg ${
                          item.needsReview
                            ? 'bg-yellow-900/20 border border-yellow-700'
                            : 'bg-green-900/20 border border-green-700'
                        }`}
                      >
                        {item.needsReview ? (
                          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{item.email}</p>
                          {item.oficio && (
                            <p className="text-xs text-gray-400">
                              Ofício #{item.oficio.numero} - {item.oficio.processo}
                            </p>
                          )}
                          {item.errors && item.errors.length > 0 && (
                            <p className="text-xs text-yellow-400 mt-1">
                              {item.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Como Funciona</h3>
          
          <div className="space-y-4 text-gray-300 text-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <p>
                Clique em <strong>&quot;Conectar Gmail&quot;</strong> e autorize o acesso à sua conta.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <p>
                Após conectar, clique em <strong>&quot;Sincronizar Emails&quot;</strong> para importar ofícios.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <p>
                O sistema buscará emails com &quot;ofício&quot; no assunto e anexos em PDF.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </div>
              <p>
                IA extrairá automaticamente: número, processo, autoridade, prazo e descrição.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                5
              </div>
              <p>
                Ofícios com alta confiança (80%+) serão criados automaticamente.
                Os demais ficarão para revisão manual.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

