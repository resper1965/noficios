/**
 * Firebase Authentication - Integração para Backend Python/GCP
 * 
 * Este módulo adiciona Firebase Auth ao lado do Supabase
 * para permitir autenticação com o backend Python.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithCustomToken, User } from 'firebase/auth';

// Configuração Firebase (usar variáveis de ambiente)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton Firebase App
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;

/**
 * Inicializar Firebase (lazy)
 */
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else if (!firebaseApp) {
    firebaseApp = getApps()[0];
  }
  return firebaseApp;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
}

/**
 * Obter ID Token do usuário autenticado no Firebase
 * Este token é usado para autenticar com backend Python/GCP
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    console.warn('Usuário não autenticado no Firebase');
    return null;
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Erro ao obter Firebase ID token:', error);
    return null;
  }
}

/**
 * Autenticar com Firebase usando custom token
 * Usado quando usuário faz login via Supabase
 */
export async function signInFirebaseWithCustomToken(
  customToken: string
): Promise<User | null> {
  const auth = getFirebaseAuth();

  try {
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user;
  } catch (error) {
    console.error('Erro ao autenticar com custom token:', error);
    return null;
  }
}

/**
 * Sincronizar autenticação: Supabase → Firebase
 * 
 * FLUXO:
 * 1. Usuário faz login via Supabase (Google OAuth ou Email)
 * 2. Frontend chama backend para gerar custom token Firebase
 * 3. Frontend usa custom token para autenticar no Firebase
 * 4. Agora usuário tem tokens de ambos (Supabase + Firebase)
 */
export async function syncSupabaseToFirebase(
  supabaseToken: string
): Promise<string | null> {
  try {
    // Chamar endpoint que converte token Supabase → Firebase custom token
    const response = await fetch('/api/auth/sync-firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const customToken = data.firebaseCustomToken;

    // Autenticar no Firebase com custom token
    const user = await signInFirebaseWithCustomToken(customToken);

    if (user) {
      console.log('✅ Firebase auth sincronizado:', user.uid);
      return await getFirebaseIdToken();
    }

    return null;
  } catch (error) {
    console.error('Erro ao sincronizar Supabase → Firebase:', error);
    return null;
  }
}

/**
 * Hook para usar em componentes React
 */
export function useFirebaseAuth() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  return {
    user,
    getIdToken: getFirebaseIdToken,
    signInWithCustomToken: signInFirebaseWithCustomToken,
  };
}

