'use client';

import Link from 'next/link';
import Logo from './Logo';
import { Shield, FileText, Cookie, Lock, Settings } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Linha principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Coluna 1: Branding */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span className="font-montserrat">n.Oficios</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Plataforma cognitiva de automação jurídica com conformidade LGPD total.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>powered by</span>
              <Logo variant="dark" size="sm" />
            </div>
          </div>

          {/* Coluna 2: Links Legais */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Políticas e Termos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/policies/terms" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link 
                  href="/policies/privacy" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link 
                  href="/policies/cookies" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Cookie className="h-4 w-4" />
                  Política de Cookies
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
                    } catch {}
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Preferências de Cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Segurança e Compliance */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Segurança e Compliance</h4>
            <Link 
              href="/security" 
              className="block p-3 border rounded-md hover:bg-muted transition-colors group"
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    Segurança e Privacidade
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Conformidade LGPD, arquitetura de segurança e proteção de dados
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Linha inferior: Badges e Copyright */}
        <div className="pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Badges de conformidade */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">LGPD Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">ISO 27001</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                <span className="font-medium">🇧🇷 Soberania de Dados BR</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground">
              © {currentYear} n.Oficios. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



