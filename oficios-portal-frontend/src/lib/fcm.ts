'use client';

import { getApps } from 'firebase/app';
import { isSupported, getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseApp } from '@/lib/firebase';

// Lê VAPID do runtime window.__ENV (fallback para process.env)
const vapidKey: string | undefined =
  (typeof window !== 'undefined' && (window as any).__ENV && (window as any).__ENV.NEXT_PUBLIC_FCM_VAPID_KEY) ||
  (process.env.NEXT_PUBLIC_FCM_VAPID_KEY as string | undefined);

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return registration;
  } catch (error) {
    console.error('Falha ao registrar Service Worker do FCM:', error);
    return null;
  }
}

export async function initFcmAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!vapidKey) {
    console.warn('NEXT_PUBLIC_FCM_VAPID_KEY não definido. Ignorando FCM.');
    return null;
  }

  const supported = await isSupported();
  if (!supported) return null;

  // Garante que o app Firebase já esteja inicializado (client-side)
  const app = getApps()[0] || getFirebaseApp();

  // Permissão do usuário
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Registra o SW do FCM
  const registration = await registerServiceWorker();

  // Obtém o token FCM
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration || undefined,
  });

  return token || null;
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return;
  isSupported().then((ok) => {
    if (!ok) return;
    const app = getApps()[0] || getFirebaseApp();
    const messaging = getMessaging(app);
    onMessage(messaging, callback);
  });
}



