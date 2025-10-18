'use client';

import { useAuth } from '@/hooks/useAuthSupabase';
import { MCPDashboard } from '@/components/mcp/MCPDashboard';
import { ProductBrand } from '@/components/Logo';

export default function MCPPage() {
  const { user, loading } = useAuth();

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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ProductBrand />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Olá, {user.user_metadata?.full_name || user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <MCPDashboard />
      </main>
    </div>
  );
}
