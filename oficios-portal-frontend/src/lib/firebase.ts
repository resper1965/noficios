import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
);

const firebaseConfig = (() => {
  const wenv = typeof window !== 'undefined' ? (window as any).__ENV : undefined;
  if (wenv) {
    const apiKeyDev = wenv.NEXT_PUBLIC_FIREBASE_API_KEY_DEV;
    const apiKeyProd = wenv.NEXT_PUBLIC_FIREBASE_API_KEY;
    return {
      apiKey: isLocalhost && apiKeyDev ? apiKeyDev : apiKeyProd,
      authDomain: wenv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: wenv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: wenv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: wenv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: wenv.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }
  // Fallback para ambientes sem window (não usado no cliente)
  return {
    apiKey: isLocalhost && process.env.NEXT_PUBLIC_FIREBASE_API_KEY_DEV
      ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY_DEV
      : (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
})();

// Variáveis que serão inicializadas apenas no cliente
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Função para garantir inicialização (apenas no cliente)
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase só pode ser inicializado no cliente');
  }
  
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  
  return app;
}

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth só pode ser inicializado no cliente');
  }
  
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  
  return auth;
}

// Exports padrão (deprecated, use as funções acima)
export { app, auth };
