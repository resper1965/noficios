'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Shield } from 'lucide-react';
import { acceptPolicy } from '@/hooks/usePolicyAcceptance';

interface Policy {
  document_id: string;
  org_id: string;
  type: string;
  version: string;
  content: string;
}

interface PolicyAcceptanceModalProps {
  policies: Policy[];
  onAcceptAll: () => void;
  getToken: () => Promise<string | null>;
}

export default function PolicyAcceptanceModal({
  policies,
  onAcceptAll,
  getToken,
}: PolicyAcceptanceModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPolicy = policies[currentIndex];
  const isLastPolicy = currentIndex === policies.length - 1;

  useEffect(() => {
    // Reset scroll detection quando muda de política
    setHasScrolledToBottom(false);
  }, [currentIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!currentPolicy) return;

    setAccepting(true);

    try {
      // Registra aceite
      await acceptPolicy(
        getToken,
        currentPolicy.type,
        currentPolicy.version,
        currentPolicy.org_id
      );

      if (isLastPolicy) {
        // Última política - finaliza
        onAcceptAll();
      } else {
        // Próxima política
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      alert('Erro ao registrar aceite. Tente novamente.');
      console.error(error);
    } finally {
      setAccepting(false);
    }
  };

  if (!currentPolicy) {
    return null;
  }

  const policyTitle = {
    TERMOS_DE_USO: 'Termos de Uso',
    POLITICA_PRIVACIDADE: 'Política de Privacidade',
    POLITICA_COOKIES: 'Política de Cookies',
  }[currentPolicy.type] || currentPolicy.type;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {policyTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Versão {currentPolicy.version} · 
            {policies.length > 1 && ` ${currentIndex + 1} de ${policies.length}`}
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Conteúdo da política com scroll */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto border rounded-md p-4 mb-4 prose prose-sm max-w-none"
          >
            <div dangerouslySetInnerHTML={{ __html: currentPolicy.content }} />
          </div>

          {/* Instruções */}
          {!hasScrolledToBottom && (
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Role até o final do documento para habilitar o botão de aceite
            </p>
          )}

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || accepting}
              className="flex-1"
            >
              {accepting
                ? 'Registrando...'
                : isLastPolicy
                ? 'Aceito e Concordo - Acessar Plataforma'
                : 'Aceito e Concordo - Próximo'}
            </Button>
          </div>

          {/* Informação legal */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Ao aceitar, você confirma que leu e concorda com os termos apresentados.
            <br />
            Seu aceite será registrado conforme Art. 7º, V da LGPD.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}





