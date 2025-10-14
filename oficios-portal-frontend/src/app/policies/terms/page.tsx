'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Termos de Uso"
            subtitle="Última atualização: Outubro de 2024 | Versão 1.0"
            icon={<FileText className="h-8 w-8" />}
          />

          <Card className="bg-card border border-border/60">
            <CardContent className="prose prose-sm max-w-none pt-6 text-foreground">
              <h2>1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o n.Oficios, você concorda em cumprir estes Termos de Uso 
                e todas as leis e regulamentos aplicáveis, incluindo a Lei Geral de Proteção 
                de Dados (LGPD - Lei nº 13.709/2018).
              </p>

              <h2>2. Descrição do Serviço</h2>
              <p>
                O n.Oficios é uma plataforma de automação jurídica que processa ofícios legais 
                utilizando inteligência artificial, proporcionando triagem, extração de dados 
                estruturados e sugestões de resposta com conformidade LGPD.
              </p>

              <h2>3. Requisitos de Uso</h2>
              <ul>
                <li>Ser maior de 18 anos ou representante legal de pessoa jurídica</li>
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade das credenciais de acesso</li>
                <li>Não usar o serviço para fins ilegais ou não autorizados</li>
              </ul>

              <h2>4. Responsabilidades do Usuário</h2>
              <p>
                O usuário é responsável por:
              </p>
              <ul>
                <li>Revisar e validar todas as informações extraídas automaticamente</li>
                <li>Garantir a conformidade das respostas geradas com a legislação vigente</li>
                <li>Proteger o acesso à plataforma com credenciais seguras</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
              </ul>

              <h2>5. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, design, código-fonte e funcionalidades do n.Oficios são 
                de propriedade exclusiva da ness. e protegidos por leis de direitos autorais.
              </p>

              <h2>6. Limitação de Responsabilidade</h2>
              <p>
                O n.Oficios é uma ferramenta de apoio e não substitui a análise jurídica 
                profissional. A ness. não se responsabiliza por:
              </p>
              <ul>
                <li>Decisões tomadas com base nas sugestões da plataforma</li>
                <li>Erros de extração ou interpretação de documentos</li>
                <li>Indisponibilidade temporária do serviço</li>
              </ul>

              <h2>7. Modificações dos Termos</h2>
              <p>
                A ness. reserva-se o direito de modificar estes termos a qualquer momento. 
                Usuários serão notificados sobre mudanças significativas.
              </p>

              <h2>8. Contato</h2>
              <p>
                Para dúvidas sobre estes termos: <strong>legal@n-oficios.com.br</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



