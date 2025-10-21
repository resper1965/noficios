'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já está autenticado
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Verificar se há token válido no localStorage
      const token = localStorage.getItem('google_access_token');
      if (token) {
        // Verificar se o token ainda é válido
        const isValid = await validateToken(token);
        if (isValid) {
          const userInfo = await getUserInfo(token);
          setUser(userInfo);
        } else {
          // Token expirado, limpar
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_refresh_token');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const getUserInfo = async (token: string): Promise<GoogleUser> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao obter informações do usuário');
    }
    
    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Configurar OAuth2
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = window.location.origin + '/auth/callback';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly')}&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Redirecionar para Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Limpar tokens
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
      setUser(null);
      
      // Redirecionar para logout do Google
      window.location.href = 'https://accounts.google.com/logout';
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      // Verificar se o token ainda é válido
      const isValid = await validateToken(token);
      if (isValid) {
        return token;
      } else {
        // Tentar renovar com refresh token
        const refreshToken = localStorage.getItem('google_refresh_token');
        if (refreshToken) {
          try {
            const newToken = await refreshAccessToken(refreshToken);
            if (newToken) {
              localStorage.setItem('google_access_token', newToken);
              return newToken;
            }
          } catch (error) {
            console.error('Erro ao renovar token:', error);
          }
        }
      }
    }
    return null;
  };

  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.accessToken;
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
    }
    return null;
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    getAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




