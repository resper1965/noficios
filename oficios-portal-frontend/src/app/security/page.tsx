'use client';

import { Shield, Lock, Eye, FileCheck, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <PageHeader
          title="Segurança e Privacidade"
          subtitle="Conformidade total com LGPD e arquitetura de segurança de nível empresarial"
          icon={<Shield className="h-10 w-10" />}
        />
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Conformidade LGPD */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              Conformidade LGPD (Lei nº 13.709/2018)
            </h2>
            
            <div className="grid gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Art. 6º, III - Minimização de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Implementamos <strong>pseudonimização e minimização</strong> desde o design:
                  </p>
                  <ul className="text-sm space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Conteúdo bruto (raw_text) armazenado em bucket separado e restrito</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Apenas dados estruturados necessários no banco de dados principal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Preview truncado de 500 caracteres para visualização rápida</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Hash SHA256 para garantir integridade dos dados</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Art. 37 - Registro de Operações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Auditoria completa</strong> de todas as operações com dados pessoais:
                  </p>
                  <ul className="text-sm space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Registro de quem acessou, quando e de onde (IP + User Agent)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Logs imutáveis de acesso ao conteúdo bruto dos ofícios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Relatórios de conformidade para auditoria ANPD</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Histórico completo de aceites de políticas e consentimentos</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Art. 46 - Medidas de Segurança Técnicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Implementação de <strong>controles técnicos rigorosos</strong>:
                  </p>
                  <ul className="text-sm space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>URLs assinadas temporárias</strong> válidas por apenas 60 minutos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>IAM (Identity Access Management)</strong> com permissões granulares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>RBAC (Role-Based Access Control)</strong> em 3 níveis hierárquicos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Multi-tenancy</strong> com isolamento completo entre organizações</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Arquitetura de Segurança */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Arquitetura de Segurança
            </h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Camadas de Proteção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 p-3 bg-muted rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1">Criptografia em Trânsito e Repouso</div>
                      <div className="text-xs text-muted-foreground">
                        TLS 1.3 para comunicação + AES-256 para armazenamento
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-muted rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1">Autenticação Forte (Firebase Auth)</div>
                      <div className="text-xs text-muted-foreground">
                        OAuth 2.0, JWT com expiração, MFA disponível
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-muted rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1">Controle de Acesso Granular (RBAC)</div>
                      <div className="text-xs text-muted-foreground">
                        3 níveis: Platform Admin, Org Admin, User - cada um com permissões específicas
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 bg-muted rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      4
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1">Isolamento de Dados (Multi-Tenancy)</div>
                      <div className="text-xs text-muted-foreground">
                        Cada organização com dados completamente isolados via org_id
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Soberania de Dados */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              🇧🇷 Soberania de Dados Brasileira
            </h2>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm mb-1">
                        Armazenamento 100% Nacional
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Todos os dados armazenados em <strong>São Paulo, Brasil</strong> (região southamerica-east1).
                        Sem replicação internacional.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm mb-1">
                        Conformidade com Lei nº 13.853/2019
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dados de cidadãos brasileiros permanecem em território nacional, 
                        respeitando a soberania digital do país.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm mb-1">
                        Processamento Local
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Toda a infraestrutura de processamento (Cloud Functions, Firestore, Storage) 
                        opera exclusivamente na região brasileira.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Direitos dos Titulares */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Seus Direitos (Art. 18 LGPD)
            </h2>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Como titular de dados pessoais, você tem direito a:
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Anonimização ou exclusão:</strong> Solicitar remoção de dados desnecessários</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Portabilidade:</strong> Exportar seus dados em formato estruturado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Revogação de consentimento:</strong> Retirar autorização a qualquer momento</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Contato DPO */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Encarregado de Dados (DPO)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados:
                </p>
                <div className="space-y-2 text-sm">
                  <div><strong>E-mail:</strong> dpo@n-oficios.com.br</div>
                  <div><strong>Telefone:</strong> +55 11 XXXX-XXXX</div>
                  <div className="text-xs text-muted-foreground mt-3">
                    Respondemos todas as solicitações em até 15 dias úteis, conforme Art. 18, § 3º da LGPD.
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Certificações */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Certificações e Conformidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">LGPD Compliant</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lei nº 13.709/2018
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">ISO/IEC 27001</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Segurança da Informação
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Google Cloud</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Infraestrutura Certificada
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Última atualização */}
          <div className="text-center pt-8 border-t">
            <p className="text-xs text-muted-foreground">
              Última atualização: Outubro de 2024
              <br />
              Revisamos periodicamente nossas práticas de segurança e privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



