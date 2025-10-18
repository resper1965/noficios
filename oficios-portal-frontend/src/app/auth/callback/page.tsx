'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('Erro no OAuth:', error);
          setStatus('error');
          return;
        }

        if (!code) {
          console.error('Código de autorização não encontrado');
          setStatus('error');
          return;
        }

        // Trocar código por tokens
        const response = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Salvar tokens
          localStorage.setItem('google_access_token', data.accessToken);
          localStorage.setItem('google_refresh_token', data.refreshToken);
          
          setStatus('success');
          
          // Redirecionar para dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          const errorData = await response.json();
          console.error('Erro ao trocar código por tokens:', errorData);
          setStatus('error');
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        setStatus('error');
      }
    };

    handleCallback();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Processando autenticação...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Erro na Autenticação</h1>
          <p className="text-gray-400 mb-4">Não foi possível fazer login com o Google</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Login Realizado!</h1>
        <p className="text-gray-400">Redirecionando para o dashboard...</p>
      </div>
    </div>
  );
}



