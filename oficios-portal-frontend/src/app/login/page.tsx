'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, isSigningIn, loginError, clearLoginError } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const params = new URLSearchParams(window.location.search);
      setShowDebug(params.get('debugAuth') === '1');
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    clearLoginError();
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md mx-auto border border-border rounded-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center mb-2">
            <Logo variant="light" size="lg" />
          </div>
          <CardTitle className="text-2xl text-foreground">n.Oficios</CardTitle>
          <CardDescription className="text-muted-foreground">Acesse com sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Formulário (shadcn/ui) - placeholder para futuros métodos */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu.nome@empresa.com" autoComplete="email" disabled />
          </div>
          <Button
            variant="default"
            onClick={handleLogin}
            disabled={isSigningIn}
            className="w-full"
          >
            {isSigningIn ? 'Conectando...' : 'Entrar com Google'}
          </Button>

          {mounted && showDebug && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('forcePopup', '1');
                    window.history.replaceState({}, '', url.toString());
                    await handleLogin();
                  } catch {}
                }}
              >
                Tentar com popup
              </Button>
            </div>
          )}

          {loginError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded p-2 text-center">
              {loginError}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Ao acessar, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </CardContent>
        {mounted && showDebug && (
          <div className="p-4 border-t border-border text-left text-xs text-muted-foreground overflow-x-auto">
            <pre>{JSON.stringify({ userPresent: !!user, loading, loginError, env: typeof window !== 'undefined' ? (window as any).__ENV : null }, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}



