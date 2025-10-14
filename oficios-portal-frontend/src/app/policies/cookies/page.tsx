'use client';

import { Cookie } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Política de Cookies"
            subtitle="Última atualização: Outubro de 2024 | Versão 1.0"
            icon={<Cookie className="h-8 w-8" />}
          />

          <Card className="bg-card border border-border/60">
            <CardContent className="prose prose-sm max-w-none pt-6 text-foreground">
              <h2>1. O que são Cookies?</h2>
              <p>
                Cookies são pequenos arquivos de texto armazenados no seu navegador quando 
                você visita um site. Eles permitem que o site reconheça seu dispositivo e 
                lembre suas preferências.
              </p>

              <h2>2. Como Usamos Cookies</h2>
              <p>
                O n.Oficios utiliza cookies para melhorar sua experiência, garantir segurança 
                e cumprir requisitos da LGPD (Art. 7º, V - consentimento livre e informado).
              </p>

              <h2>3. Tipos de Cookies</h2>

              <h3>3.1 Cookies Necessários (Essenciais)</h3>
              <p>
                <strong>Não podem ser desabilitados.</strong> São fundamentais para o funcionamento da plataforma.
              </p>
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Finalidade</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>firebase_auth</code></td>
                    <td>Autenticação de usuário</td>
                    <td>Sessão</td>
                  </tr>
                  <tr>
                    <td><code>jwt_token</code></td>
                    <td>Token de acesso seguro</td>
                    <td>1 hora</td>
                  </tr>
                  <tr>
                    <td><code>org_context</code></td>
                    <td>Contexto da organização</td>
                    <td>Sessão</td>
                  </tr>
                </tbody>
              </table>

              <h3>3.2 Cookies Analíticos (Opcionais)</h3>
              <p>
                <strong>Requerem consentimento.</strong> Ajudam a entender como você usa a plataforma.
              </p>
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Finalidade</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>_ga</code></td>
                    <td>Google Analytics - visitantes únicos</td>
                    <td>2 anos</td>
                  </tr>
                  <tr>
                    <td><code>_gid</code></td>
                    <td>Google Analytics - sessões</td>
                    <td>24 horas</td>
                  </tr>
                </tbody>
              </table>

              <h3>3.3 Cookies de Marketing (Opcionais)</h3>
              <p>
                <strong>Requerem consentimento.</strong> Usados para personalizar conteúdo e anúncios.
              </p>
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Finalidade</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>marketing_pref</code></td>
                    <td>Preferências de comunicação</td>
                    <td>1 ano</td>
                  </tr>
                </tbody>
              </table>

              <h2>4. Gerenciamento de Cookies</h2>
              <p>
                Você pode gerenciar suas preferências de cookies a qualquer momento:
              </p>
              <ul>
                <li><strong>Banner de Cookies:</strong> Primeira visita ao site</li>
                <li><strong>Configurações da Conta:</strong> Acesse "Privacidade e Cookies"</li>
                <li><strong>Navegador:</strong> Configure diretamente no seu navegador</li>
              </ul>

              <h2>5. Cookies de Terceiros</h2>
              <p>
                Utilizamos serviços de terceiros que podem definir seus próprios cookies:
              </p>
              <ul>
                <li><strong>Google Analytics:</strong> Análise de uso (somente com consentimento)</li>
                <li><strong>Firebase:</strong> Autenticação e infraestrutura (necessário)</li>
              </ul>

              <h2>6. Conformidade LGPD</h2>
              <p>
                Respeitamos o Art. 7º, V da LGPD:
              </p>
              <ul>
                <li>Consentimento livre, informado e inequívoco</li>
                <li>Finalidade específica para cada tipo de cookie</li>
                <li>Possibilidade de revogação a qualquer momento</li>
                <li>Transparência sobre uso de dados</li>
              </ul>

              <h2>7. Recusa de Cookies</h2>
              <p>
                Você pode recusar cookies opcionais sem prejuízo ao uso da plataforma. 
                No entanto, cookies essenciais são necessários para o funcionamento básico.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Bloquear cookies essenciais pode impedir o acesso 
                  à plataforma ou causar erros de funcionamento.
                </p>
              </div>

              <h2>8. Contato</h2>
              <p>
                Dúvidas sobre cookies? Entre em contato:
              </p>
              <ul>
                <li><strong>E-mail:</strong> dpo@n-oficios.com.br</li>
                <li><strong>DPO:</strong> Encarregado de Proteção de Dados</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



