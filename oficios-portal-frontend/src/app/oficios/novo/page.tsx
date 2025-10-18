'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { supabaseService as apiService } from '@/lib/supabase';
import { ProductBrand } from '@/components/Logo';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NovoOficioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    numero: '',
    processo: '',
    autoridade: '',
    prazo: '',
    descricao: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError('Usuário não autenticado');
      return;
    }

    // Validação
    if (!formData.numero || !formData.processo || !formData.autoridade || !formData.prazo) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.createOficio({
        ...formData,
        userId: user.email,
      });

      router.push('/oficios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ofício');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/oficios')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-blue-400">Novo Ofício</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Número */}
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-2">
                Número do Ofício *
              </label>
              <input
                type="text"
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Ex: 12345"
                required
              />
            </div>

            {/* Processo */}
            <div>
              <label htmlFor="processo" className="block text-sm font-medium text-gray-300 mb-2">
                Número do Processo *
              </label>
              <input
                type="text"
                id="processo"
                value={formData.processo}
                onChange={(e) => setFormData({ ...formData, processo: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Ex: 1234567-89.2024.1.00.0000"
                required
              />
            </div>

            {/* Autoridade */}
            <div>
              <label htmlFor="autoridade" className="block text-sm font-medium text-gray-300 mb-2">
                Autoridade *
              </label>
              <input
                type="text"
                id="autoridade"
                value={formData.autoridade}
                onChange={(e) => setFormData({ ...formData, autoridade: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Ex: Tribunal Regional Federal"
                required
              />
            </div>

            {/* Prazo */}
            <div>
              <label htmlFor="prazo" className="block text-sm font-medium text-gray-300 mb-2">
                Prazo *
              </label>
              <input
                type="datetime-local"
                id="prazo"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-400">Data e hora limite para resposta</p>
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Descreva o conteúdo do ofício..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/oficios')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Salvar Ofício</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

