'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { useOficios } from '@/hooks/useOficios';
import { supabaseService as apiService, Oficio } from '@/lib/supabase';
import { ProductBrand } from '@/components/Logo';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  LogOut,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function OficiosPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { oficios, loading: oficiosLoading, error, refresh } = useOficios();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'vencido' | 'respondido'>('all');
  const [deleting, setDeleting] = useState<number | string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loading = authLoading || oficiosLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDelete = async (id: number | string) => {
    if (!confirm('Tem certeza que deseja excluir este ofício?')) {
      return;
    }

    try {
      setDeleting(id);
      await apiService.deleteOficio(id);
      await refresh();
    } catch (err) {
      alert('Erro ao excluir ofício');
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // Filtrar ofícios
  const filteredOficios = oficios.filter((oficio) => {
    const matchesSearch =
      oficio.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oficio.processo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oficio.autoridade.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || oficio.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Oficio['status']) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Ativo
          </span>
        );
      case 'vencido':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencido
          </span>
        );
      case 'respondido':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Respondido
          </span>
        );
    }
  };

  const getPrazoText = (oficio: Oficio) => {
    const prazoDate = new Date(oficio.prazo);
    const now = new Date();
    const diffMs = prazoDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (oficio.status === 'vencido') {
      const diasVencido = Math.abs(diffDays);
      return { text: `Vencido há ${diasVencido} dia${diasVencido !== 1 ? 's' : ''}`, color: 'text-red-400' };
    } else if (oficio.status === 'respondido') {
      return { text: 'Concluído', color: 'text-green-400' };
    } else if (diffDays <= 1) {
      return { text: diffDays === 0 ? 'Vence hoje' : `${diffDays} dia`, color: 'text-red-400' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} dias`, color: 'text-yellow-400' };
    } else {
      return { text: `${diffDays} dias`, color: 'text-green-400' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <ProductBrand product="Oficios" size="sm" variant="light" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-300">{user.user_metadata?.full_name || user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gerenciar Ofícios</h2>
            <p className="text-gray-400">
              Total de {filteredOficios.length} ofício{filteredOficios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/oficios/novo')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Ofício</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, processo ou autoridade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ativo' | 'vencido' | 'respondido')}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="vencido">Vencidos</option>
              <option value="respondido">Respondidos</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            Erro ao carregar ofícios: {error}
          </div>
        )}

        {/* Table */}
        {filteredOficios.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Nenhum ofício encontrado com os filtros aplicados'
                : 'Nenhum ofício cadastrado ainda'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/oficios/novo')}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Criar Primeiro Ofício</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Processo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Autoridade
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Prazo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredOficios.map((oficio) => {
                    const prazo = getPrazoText(oficio);
                    return (
                      <tr key={oficio.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">#{oficio.numero}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{oficio.processo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300 max-w-xs truncate">
                            {oficio.autoridade}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(oficio.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${prazo.color}`}>{prazo.text}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/oficios/${oficio.id}`)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(oficio.id)}
                              disabled={deleting === oficio.id}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Excluir"
                            >
                              {deleting === oficio.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

