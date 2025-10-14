'use client';

import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Política de Privacidade"
            subtitle="Última atualização: Outubro de 2024 | Versão 1.0 | Conforme LGPD (Lei nº 13.709/2018)"
            icon={<Shield className="h-8 w-8" />}
          />

          <Card className="bg-card border border-border/60">
            <CardContent className="prose prose-sm max-w-none pt-6 text-foreground">
              <h2>1. Introdução</h2>
              <p>
                Esta Política de Privacidade descreve como o n.Oficios coleta, usa, armazena 
                e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção 
                de Dados (LGPD).
              </p>

              <h2>2. Dados Coletados</h2>
              <h3>2.1 Dados de Identificação</h3>
              <ul>
                <li>Nome completo</li>
                <li>E-mail corporativo</li>
                <li>Organização</li>
                <li>Função/Cargo</li>
              </ul>

              <h3>2.2 Dados de Ofícios</h3>
              <ul>
                <li>Conteúdo dos ofícios (texto, anexos)</li>
                <li>Autoridade emissora</li>
                <li>Número de processo</li>
                <li>Prazos e solicitações</li>
              </ul>

              <h3>2.3 Dados de Uso</h3>
              <ul>
                <li>Logs de acesso (IP, data/hora, ações realizadas)</li>
                <li>Preferências de cookies</li>
                <li>Histórico de aceites de políticas</li>
              </ul>

              <h2>3. Finalidade do Tratamento</h2>
              <p>Os dados são tratados para:</p>
              <ul>
                <li><strong>Prestação do serviço:</strong> Processamento e automação de ofícios</li>
                <li><strong>Autenticação:</strong> Controle de acesso seguro</li>
                <li><strong>Compliance:</strong> Cumprimento de obrigações legais</li>
                <li><strong>Auditoria:</strong> Rastreabilidade e segurança (Art. 37 LGPD)</li>
                <li><strong>Melhoria do serviço:</strong> Análises agregadas e anônimas</li>
              </ul>

              <h2>4. Base Legal (Art. 7º LGPD)</h2>
              <ul>
                <li><strong>Consentimento:</strong> Para uso de cookies não essenciais</li>
                <li><strong>Execução de contrato:</strong> Prestação do serviço contratado</li>
                <li><strong>Obrigação legal:</strong> Cumprimento de determinações judiciais</li>
                <li><strong>Legítimo interesse:</strong> Segurança e prevenção de fraudes</li>
              </ul>

              <h2>5. Compartilhamento de Dados</h2>
              <p>
                Seus dados <strong>não são vendidos</strong> a terceiros. 
                Compartilhamos apenas quando necessário:
              </p>
              <ul>
                <li><strong>Provedores de infraestrutura:</strong> Google Cloud (servidores em São Paulo)</li>
                <li><strong>APIs de IA:</strong> Groq/OpenAI para processamento de linguagem natural</li>
                <li><strong>Autoridades legais:</strong> Quando exigido por lei</li>
              </ul>

              <h2>6. Armazenamento e Segurança</h2>
              <h3>6.1 Localização</h3>
              <p>
                Todos os dados são armazenados em <strong>São Paulo, Brasil</strong> (região southamerica-east1), 
                garantindo soberania de dados nacional.
              </p>

              <h3>6.2 Medidas de Segurança</h3>
              <ul>
                <li>Criptografia AES-256 em repouso</li>
                <li>TLS 1.3 em trânsito</li>
                <li>Autenticação multifator disponível</li>
                <li>Controle de acesso baseado em funções (RBAC)</li>
                <li>Auditoria completa de acessos</li>
                <li>Bucket restrito para conteúdo bruto (pseudonimização)</li>
              </ul>

              <h3>6.3 Retenção</h3>
              <p>
                Dados mantidos pelo tempo necessário à prestação do serviço e cumprimento 
                de obrigações legais (mínimo de 5 anos conforme legislação aplicável).
              </p>

              <h2>7. Seus Direitos (Art. 18 LGPD)</h2>
              <p>Você tem direito a:</p>
              <ul>
                <li>Confirmar a existência de tratamento</li>
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos ou inexatos</li>
                <li>Solicitar anonimização ou exclusão</li>
                <li>Revogar consentimento</li>
                <li>Exportar dados (portabilidade)</li>
                <li>Opor-se ao tratamento</li>
              </ul>

              <h2>8. Cookies</h2>
              <p>
                Utilizamos cookies essenciais (autenticação) e opcionais (análise). 
                Você pode gerenciar suas preferências no banner de cookies.
              </p>

              <h2>9. Encarregado de Dados (DPO)</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas:
              </p>
              <ul>
                <li><strong>E-mail:</strong> dpo@n-oficios.com.br</li>
                <li><strong>Telefone:</strong> +55 11 XXXX-XXXX</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Prazo de resposta: até 15 dias úteis (Art. 18, § 3º LGPD)
              </p>

              <h2>10. Alterações</h2>
              <p>
                Esta política pode ser atualizada. Notificaremos usuários sobre mudanças 
                significativas via e-mail ou notificação na plataforma.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



