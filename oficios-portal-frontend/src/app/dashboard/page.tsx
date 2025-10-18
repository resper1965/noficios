'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { useOficios } from '@/hooks/useOficios';
import { useOficiosAguardandoRevisao } from '@/hooks/useOficiosAguardandoRevisao';
import { ProductBrand } from '@/components/Logo';
import { NotificationPanel } from '@/components/NotificationPanel';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  LogOut,
  User,
  Settings
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { oficios, stats, loading: oficiosLoading, error } = useOficios();
  const { oficios: oficiosAguardandoRevisao, loading: loadingHITL } = useOficiosAguardandoRevisao();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ProductBrand product="Oficios" size="sm" variant="light" />
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationPanel />
            <button
              onClick={() => router.push('/configuracoes')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-gray-400">
            Bem-vindo, {user.user_metadata?.full_name || user.email}
          </p>
        </div>

        {/* HITL - Ofícios Aguardando Revisão */}
        {!loadingHITL && oficiosAguardandoRevisao.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                  <span>Ofícios Aguardando Sua Revisão</span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  A IA extraiu dados de novos ofícios e precisa da sua aprovação
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-yellow-400">{oficiosAguardandoRevisao.length}</p>
                <p className="text-xs text-gray-400">para revisar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {oficiosAguardandoRevisao.slice(0, 6).map((oficio) => {
                const isUrgente = oficio.diasRestantes <= 3;
                const isBaixaConfianca = oficio.confianca < 70;
                const camposProblematicos = isBaixaConfianca ? 
                  Math.floor((100 - oficio.confianca) / 10) : 1;

                return (
                  <div 
                    key={oficio.oficio_id}
                    onClick={() => router.push(`/revisao/${oficio.oficio_id}`)}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Ofício</p>
                        <p className="text-lg font-bold text-white">#{oficio.numero}</p>
                      </div>
                      <div className={`border rounded-lg px-2 py-1 ${
                        isBaixaConfianca 
                          ? 'bg-red-900/30 border-red-700' 
                          : 'bg-yellow-900/30 border-yellow-700'
                      }`}>
                        <p className={`text-xs font-semibold ${
                          isBaixaConfianca ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {oficio.confianca}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{oficio.autoridade}</p>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {isBaixaConfianca 
                        ? `Confiança baixa em ${camposProblematicos} ${camposProblematicos === 1 ? 'campo' : 'campos'}`
                        : 'Requer revisão humana'
                      }
                    </p>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center space-x-1 text-xs ${
                        isUrgente ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        <Clock className="h-3 w-3" />
                        <span>{oficio.diasRestantes} {oficio.diasRestantes === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      <button className="text-sm font-medium text-yellow-400 group-hover:text-yellow-300 transition-colors">
                        REVISAR AGORA →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          {/* Stats Grid - Melhorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Ativos */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 rounded-xl border border-blue-700/30 hover:border-blue-600/50 transition-all cursor-pointer group" onClick={() => router.push('/oficios')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{stats?.ativos || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-blue-400">Ofícios Ativos</p>
            <p className="text-xs text-gray-400 mt-1">Em andamento</p>
          </div>

          {/* Card Em Risco */}
          <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 rounded-xl border border-orange-700/30 hover:border-orange-600/50 transition-all cursor-pointer group" onClick={() => router.push('/oficios')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{stats?.emRisco || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-orange-400">Em Risco</p>
            <p className="text-xs text-gray-400 mt-1">Vence em menos de 24h</p>
          </div>

          {/* Card Vencidos */}
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-6 rounded-xl border border-red-700/30 hover:border-red-600/50 transition-all cursor-pointer group" onClick={() => router.push('/oficios')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors animate-pulse">
                <Clock className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{stats?.vencidos || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-red-500">Vencidos</p>
            <p className="text-xs text-gray-400 mt-1">Ação urgente necessária</p>
          </div>

          {/* Card Respondidos */}
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-6 rounded-xl border border-green-700/30 hover:border-green-600/50 transition-all cursor-pointer group" onClick={() => router.push('/oficios')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{stats?.respondidos || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-400">Respondidos</p>
            <p className="text-xs text-gray-400 mt-1">Concluídos com sucesso</p>
          </div>
        </div>

        {/* Recent Oficios */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Ofícios Recentes</h3>
            <button
              onClick={() => router.push('/oficios')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Ver todos →
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              Erro ao carregar ofícios: {error}
            </div>
          )}

          {oficios.length === 0 && !loading && (
            <p className="text-gray-400 text-center py-8">
              Nenhum ofício cadastrado ainda
            </p>
          )}

          <div className="space-y-4">
            {oficios.slice(0, 5).map((oficio) => {
              const prazoDate = new Date(oficio.prazo);
              const now = new Date();
              const diffMs = prazoDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              let prazoText = '';
              let prazoColor = '';

              if (oficio.status === 'vencido') {
                const diasVencido = Math.abs(diffDays);
                prazoText = diasVencido === 0 ? 'Venceu hoje' : `Vencido há ${diasVencido} dia${diasVencido > 1 ? 's' : ''}`;
                prazoColor = 'text-red-400';
              } else if (oficio.status === 'respondido') {
                prazoText = 'Respondido';
                prazoColor = 'text-green-400';
              } else if (diffDays <= 1) {
                prazoText = diffDays === 0 ? 'Vence hoje' : `${diffDays} dia restante`;
                prazoColor = 'text-red-400';
              } else if (diffDays <= 3) {
                prazoText = `${diffDays} dias restantes`;
                prazoColor = 'text-yellow-400';
              } else {
                prazoText = `${diffDays} dias restantes`;
                prazoColor = 'text-green-400';
              }

              return (
                <div key={oficio.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                  <div>
                    <p className="font-medium text-white">Ofício #{oficio.numero}</p>
                    <p className="text-sm text-gray-400">Processo: {oficio.processo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white text-sm">{oficio.autoridade}</p>
                    <p className={`text-sm ${prazoColor}`}>{prazoText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}