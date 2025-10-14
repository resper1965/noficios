'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  signInWithRedirect,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  org_id: string | null;
  role: 'platform_admin' | 'org_admin' | 'user' | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isSigningIn: boolean;
  loginError: string | null;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Processa retorno de redirect (se houver)
  useEffect(() => {
    // Somente processa redirect na página de login ou quando houver parâmetros típicos de retorno OAuth
    const isClient = typeof window !== 'undefined';
    const path = isClient ? window.location.pathname : '';
    const hasOauthParams = isClient ? (window.location.search.includes('state=') || window.location.search.includes('oauth')) : false;
    if (isClient && path !== '/login' && !hasOauthParams) {
      return; // evita execução desnecessária no dashboard
    }
    const auth = getFirebaseAuth();
    try { console.info('[auth] getRedirectResult: start'); } catch {}
    getRedirectResult(auth).then((result) => {
      // Quando não há redirect pendente, retorna null silenciosamente
      if (!result) {
        try { console.info('[auth] getRedirectResult: no result (null)'); } catch {}
        return;
      }
      if (result.user) {
        try { console.info('[auth] getRedirectResult: user returned', { uid: result.user.uid, email: result.user.email }); } catch {}
        // Usuário autenticado via redirect
        setLoginError(null);
        // Redireciona imediatamente para o dashboard após retorno do OAuth
        try {
          if (typeof window !== 'undefined') {
            window.location.replace('/dashboard');
          }
        } catch {}
      }
    }).catch((error: any) => {
      // Ignora erro "auth/no-auth-event" e similares quando não há redirect válido
      const benign = ['auth/no-auth-event', 'auth/operation-not-supported-in-this-environment'];
      if (error && benign.includes(error.code)) return;
      console.error('Erro no redirect:', error);
      setLoginError(String(error.message || error.code || 'Falha no redirect de autenticação.'));
    });
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try { console.info('[auth] onAuthStateChanged', { hasUser: !!firebaseUser }); } catch {}
      setUser(firebaseUser);

      if (firebaseUser) {
        // Obtém custom claims do token
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const claims = idTokenResult.claims;

        const userData: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          org_id: (claims.org_id as string) || null,
          role: (claims.role as any) || null,
        };

        setUserData(userData);
        try {
          (window as any).DEBUG_AUTH = { userData, claims };
        } catch {}

        // Salva no localStorage para acesso rápido
        localStorage.setItem('user_data', JSON.stringify(userData));
      } else {
        setUserData(null);
        localStorage.removeItem('user_data');
      }

      setLoading(false);

      // Redirecionamento pós-auth robusto: se estiver na raiz ou login, envia ao dashboard
      try {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (firebaseUser && (path === '/' || path === '/login')) {
            window.location.replace('/dashboard');
          }
        }
      } catch {}
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setLoginError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      try { await setPersistence(auth, browserLocalPersistence); } catch (e) { console.warn('[auth] setPersistence failed', e); }
      const forcePopup = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forcePopup') === '1';
      try {
        // Tenta POPUP primeiro (melhor UX quando permitido)
        if (forcePopup) throw new Error('forcePopup');
        console.info('[auth-btn] signInWithPopup -> start');
        await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        const code = popupErr?.code || '';
        const msg = String(popupErr?.message || '').toLowerCase();
        const shouldRedirect = (
          code === 'auth/popup-blocked' ||
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/unauthorized-domain' ||
          msg.includes('blocked') ||
          msg.includes('not supported') ||
          msg.includes('forcepopup')
        );
        if (!shouldRedirect) throw popupErr;
        console.info('[auth-btn] popup fallback -> signInWithRedirect');
        await signInWithRedirect(auth, provider);
        return;
      }
    } catch (error: any) {
      console.error('Erro no login (popup):', error);
      const code = error?.code || '';
      const msg = error?.message || '';
      const shouldFallback = (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/unauthorized-domain' ||
        msg.toLowerCase().includes('request action is invalid')
      );
      if (shouldFallback) {
        try {
          const auth = getFirebaseAuth();
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error('Erro no login (redirect):', redirectErr);
          setLoginError(String(redirectErr.message || redirectErr.code || 'Falha ao autenticar (redirect).'));
          throw redirectErr;
        }
      }
      const message = (error && (error.message || error.code))
        ? String(error.message || error.code)
        : 'Falha ao autenticar. Tente novamente.';
      setLoginError(message);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signOut,
        getToken,
        isSigningIn,
        loginError,
        clearLoginError: () => setLoginError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

/**
 * Hook auxiliar para verificar role
 */
export function useUserData() {
  const { userData } = useAuth();
  return userData;
}

/**
 * Hook para verificar se é Platform Admin
 */
export function useIsPlatformAdmin(): boolean {
  const userData = useUserData();
  return userData?.role === 'platform_admin';
}

/**
 * Hook para verificar se é Org Admin ou superior
 */
export function useIsOrgAdmin(): boolean {
  const userData = useUserData();
  return userData?.role === 'org_admin' || userData?.role === 'platform_admin';
}

