'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { useOficios } from '@/hooks/useOficios';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  LogOut,
  User,
  Settings,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { oficios, stats, loading: oficiosLoading, error } = useOficios();
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
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-white">
                ness<span className="text-[#00ADE8]">.</span>
              </div>
              <div className="text-lg text-gray-300 font-medium">
                oficios
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </button>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Ofícios Ativos</p>
                <p className="text-3xl font-bold text-white">{stats?.ativos || 0}</p>
                <p className="text-sm text-gray-400">Em andamento</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Em Risco</p>
                <p className="text-3xl font-bold text-red-400">{stats?.emRisco || 0}</p>
                <p className="text-sm text-gray-400">Prazo &lt; 24h</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Vencidos</p>
                <p className="text-3xl font-bold text-red-500">{stats?.vencidos || 0}</p>
                <p className="text-sm text-gray-400">Urgente</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Respondidos</p>
                <p className="text-3xl font-bold text-green-400">{stats?.respondidos || 0}</p>
                <p className="text-sm text-gray-400">Concluídos</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
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