'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Cookie, Settings } from 'lucide-react';

type CookiePreference = 'all' | 'necessary' | 'custom' | null;

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Sempre habilitado
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verifica se usuário já fez escolha
    const consent = localStorage.getItem('cookie_consent');
    
    if (!consent) {
      // Pequeno delay para não aparecer imediatamente
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Carrega preferências salvas
      try {
        const savedPrefs = JSON.parse(localStorage.getItem('cookie_preferences') || '{}');
        setPreferences({
          necessary: true,
          analytics: savedPrefs.analytics || false,
          marketing: savedPrefs.marketing || false,
        });
        
        // Aplica preferências
        applyPreferences({
          necessary: true,
          analytics: savedPrefs.analytics || false,
          marketing: savedPrefs.marketing || false,
        });
      } catch (e) {
        console.error('Erro ao carregar preferências de cookies:', e);
      }
    }
  }, []);

  // Ouvinte para abrir preferências via evento global (ex: clique no rodapé)
  useEffect(() => {
    const handler = () => {
      setShowPreferences(true);
      setShowBanner(true);
    };
    window.addEventListener('open-cookie-preferences', handler as EventListener);
    return () => window.removeEventListener('open-cookie-preferences', handler as EventListener);
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Cookies necessários (Firebase Auth, JWT) - sempre habilitados
    // Não é possível bloqueá-los, mas informamos o usuário

    // Analytics (Google Analytics, etc)
    if (prefs.analytics) {
      // Habilitar Google Analytics
      // window.gtag('consent', 'update', { analytics_storage: 'granted' });
      console.log('Analytics cookies habilitados');
    } else {
      // Desabilitar
      // window.gtag('consent', 'update', { analytics_storage: 'denied' });
      console.log('Analytics cookies desabilitados');
    }

    // Marketing
    if (prefs.marketing) {
      // Habilitar marketing cookies
      console.log('Marketing cookies habilitados');
    } else {
      console.log('Marketing cookies desabilitados');
    }
  };

  const saveConsent = (consent: CookiePreference, prefs?: CookiePreferences) => {
    localStorage.setItem('cookie_consent', consent || 'necessary');
    
    const finalPrefs = prefs || preferences;
    localStorage.setItem('cookie_preferences', JSON.stringify(finalPrefs));
    
    applyPreferences(finalPrefs);
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const allPrefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allPrefs);
    saveConsent('all', allPrefs);
  };

  const handleRejectOptional = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    saveConsent('necessary', necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent('custom', preferences);
    setShowPreferences(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
      <Card className="max-w-5xl mx-auto shadow-lg border-2">
        <CardContent className="p-6">
          {!showPreferences ? (
            // Banner principal
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  Gerenciamento de Cookies e Privacidade
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Utilizamos cookies <strong>essenciais</strong> para autenticação e funcionamento da plataforma (Firebase Auth, JWT). 
                  Também podemos usar cookies <strong>opcionais</strong> para análise de uso e melhorias. 
                  Você pode escolher suas preferências abaixo, conforme <strong>Art. 7º, V da LGPD</strong>.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleAcceptAll} size="sm">
                    Aceitar Todos
                  </Button>
                  
                  <Button onClick={handleRejectOptional} variant="outline" size="sm">
                    Apenas Essenciais
                  </Button>
                  
                  <Button
                    onClick={() => setShowPreferences(true)}
                    variant="ghost"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Preferências
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Painel de preferências
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Preferências de Cookies
              </h3>

              <div className="space-y-4 mb-6">
                {/* Cookies Necessários */}
                <div className="flex items-start justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      Cookies Necessários (Essenciais)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Necessários para autenticação (Firebase) e funcionamento da plataforma. 
                      Não podem ser desabilitados.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="h-4 w-4"
                    />
                  </div>
                </div>

                {/* Cookies Analíticos */}
                <div className="flex items-start justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      Cookies Analíticos (Opcionais)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ajudam a entender como você usa a plataforma para melhorias (ex: Google Analytics).
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>

                {/* Cookies de Marketing */}
                <div className="flex items-start justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      Cookies de Marketing (Opcionais)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Usados para personalizar conteúdo e anúncios relevantes.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button onClick={handleSavePreferences} className="flex-1">
                  Salvar Preferências
                </Button>
                <Button
                  onClick={() => setShowPreferences(false)}
                  variant="outline"
                >
                  Voltar
                </Button>
              </div>

              {/* Informação LGPD */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Suas preferências podem ser alteradas a qualquer momento nas configurações.
                <br />
                Conforme <strong>Art. 7º, V da LGPD</strong> - Consentimento livre e informado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



