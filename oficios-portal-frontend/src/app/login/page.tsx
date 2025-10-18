'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="text-6xl font-bold text-white mb-2">
              ness<span className="text-[#00ADE8]">.</span>
            </div>
            <div className="text-xl text-gray-300 font-medium">
              oficios
            </div>
          </div>
          <p className="text-gray-300 text-lg">
            Acesse sua conta para continuar
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
          >
            Continuar com Google
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative bg-gray-800/50 px-4 text-sm text-gray-400 uppercase tracking-wider">
              ou
            </div>
          </div>

          <button
            className="w-full bg-transparent border border-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:border-gray-500 hover:text-white cursor-not-allowed opacity-60"
            disabled
          >
            Continuar com E-mail
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Plataforma de automação jurídica com conformidade LGPD total
          </p>
          <div className="mt-4 text-xs text-gray-500">
            Powered by <span className="text-[#00ADE8] font-medium">ness.</span>
          </div>
        </div>
      </div>
    </div>
  );
}