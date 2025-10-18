'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { ProductBrand } from '@/components/Logo';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError('Verifique seu email para confirmar o cadastro');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <ProductBrand product="Oficios" size="lg" variant="light" />
          </div>
          <p className="text-gray-300 text-lg">
            Acesse sua conta para continuar
          </p>
        </div>
        
        {!showEmailForm ? (
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
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-transparent border border-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:border-gray-500 hover:text-white"
            >
              Continuar com E-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className={`p-3 rounded-lg ${error.includes('Verifique') ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'} text-sm`}>
                {error}
              </div>
            )}
            
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                className="w-full bg-gray-700/50 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                minLength={6}
                className="w-full bg-gray-700/50 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false);
                setError(null);
              }}
              className="w-full bg-transparent border border-gray-600 text-gray-300 font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:border-gray-500 hover:text-white text-sm"
            >
              ← Voltar
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Plataforma de automação jurídica com conformidade LGPD total
          </p>
        </div>
      </div>
    </div>
  );
}