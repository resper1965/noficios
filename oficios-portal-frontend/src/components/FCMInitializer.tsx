'use client';

import { useEffect } from 'react';
import { initFcmAndGetToken, onForegroundMessage } from '@/lib/fcm';
import { useAuth } from '@/hooks/useAuth';

export default function FCMInitializer() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // Inicializa FCM após login e guarda o token localmente
    initFcmAndGetToken()
      .then(async (token) => {
        if (token) {
          localStorage.setItem('fcm_token', token);
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
            const resp = await fetch(`${apiBase}/register_fcm_token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // O AuthProvider garante que o Firebase está disponível no client
                Authorization: `Bearer ${await user.getIdToken()}`,
              },
              body: JSON.stringify({ fcm_token: token, user_agent: navigator.userAgent }),
            });
            if (!resp.ok) {
              console.error('Falha ao registrar token no backend', await resp.text());
            }
          } catch (err) {
            console.error('Erro ao enviar token ao backend:', err);
          }
        }
      })
      .catch((err) => console.error('Erro ao inicializar FCM:', err));

    // Listener para mensagens em foreground
    onForegroundMessage((payload) => {
      console.log('Mensagem FCM (foreground):', payload);
    });
  }, [user, loading]);

  return null;
}


