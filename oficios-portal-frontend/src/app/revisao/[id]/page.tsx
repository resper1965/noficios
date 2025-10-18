'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuthSupabase';
import { ProductBrand } from '@/components/Logo';
import { WizardSteps, type WizardStep } from '@/components/hitl/WizardSteps';
import { OverallConfidenceBadge } from '@/components/hitl/ConfidenceBadge';
import { DocumentViewer } from '@/components/hitl/DocumentViewer';
import { ExtractionResults } from '@/components/hitl/ExtractionResults';
import { ComplianceReviewForm } from '@/components/hitl/ComplianceReviewForm';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface OficioData {
  id: string;
  numero: string;
  processo: string;
  autoridade: string;
  prazo: string;
  descricao?: string;
  pdfUrl?: string;
  ocrText?: string;
  dados_ia: {
    numero_oficio?: string;
    numero_processo?: string;
    autoridade_emissora?: string;
    prazo_resposta?: string;
    classificacao_intencao?: string;
    confianca_geral: number;
    confiancas_por_campo?: Record<string, number>;
  };
}

const wizardSteps: WizardStep[] = [
  {
    number: 1,
    label: 'Ver',
    description: 'Documento original',
  },
  {
    number: 2,
    label: 'Revisar',
    description: 'Dados extraídos',
  },
  {
    number: 3,
    label: 'Corrigir',
    description: 'Editar e enriquecer',
  },
  {
    number: 4,
    label: 'Aprovar',
    description: 'Decisão final',
  },
];

export default function RevisaoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const oficioId = params?.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [oficio, setOficio] = useState<OficioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Carregar dados do ofício
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && oficioId) {
      loadOficioData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, oficioId]);

  const loadOficioData = async () => {
    setLoading(true);
    try {
      // Buscar do backend via API Gateway
      const { apiClient } = await import('@/lib/api-client');
      
      const oficioData = await apiClient.getOficio(oficioId);
      
      // Transformar para formato do componente
      const transformedData: OficioData = {
        id: oficioData.oficio_id,
        numero: oficioData.dados_extraidos?.numero_oficio || '',
        processo: oficioData.dados_extraidos?.numero_processo || '',
        autoridade: oficioData.dados_extraidos?.autoridade_emissora || '',
        prazo: oficioData.dados_extraidos?.prazo_resposta || '',
        descricao: oficioData.dados_extraidos?.classificacao_intencao || '',
        pdfUrl: oficioData.anexos_urls?.[0],
        ocrText: oficioData.conteudo_bruto,
        dados_ia: {
          numero_oficio: oficioData.dados_extraidos?.numero_oficio,
          numero_processo: oficioData.dados_extraidos?.numero_processo,
          autoridade_emissora: oficioData.dados_extraidos?.autoridade_emissora,
          prazo_resposta: oficioData.dados_extraidos?.prazo_resposta,
          classificacao_intencao: oficioData.dados_extraidos?.classificacao_intencao,
          confianca_geral: oficioData.dados_extraidos?.confianca_geral || 0,
          confiancas_por_campo: oficioData.dados_extraidos?.confiancas_por_campo || {},
        },
      };

      setOficio(transformedData);
    } catch (error) {
      console.error('Erro ao carregar ofício:', error);
      alert('Erro ao carregar ofício. Redirecionando...');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRascunho = async (data: Record<string, unknown>) => {
    console.log('Salvando rascunho:', data);
    
    try {
      const { apiClient } = await import('@/lib/api-client');
      
      await apiClient.adicionarContexto(oficioId, {
        dados_apoio: data.contexto as string,
        notas: data.notas as string,
        referencias: data.referencias as string[],
      });
      
      alert('✅ Rascunho salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      alert('❌ Erro ao salvar rascunho. Tente novamente.');
    }
  };

  const handleAprovar = async (data: Record<string, unknown>) => {
    console.log('Aprovando ofício:', data);
    
    try {
      const { apiClient } = await import('@/lib/api-client');
      
      // Aprovar via API Gateway → Backend Python W3
      await apiClient.aprovarOficio(oficioId, {
        dados_apoio: data.contexto as string,
        notas: data.notas as string,
        referencias: data.referencias as string[],
        responsavel: data.responsavel as string,
      });
      
      console.log('✅ Ofício aprovado com sucesso');
      
      setCurrentStep(4);
      setShowSuccessModal(true);
      
      // Aguardar 3 segundos e redirecionar
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
      alert('❌ Erro ao aprovar ofício. Tente novamente.');
    }
  };

  const handleRejeitar = async (motivo: string) => {
    console.log('Rejeitando ofício:', motivo);
    
    try {
      const { apiClient } = await import('@/lib/api-client');
      
      // Rejeitar via API Gateway → Backend Python W3
      await apiClient.rejeitarOficio(oficioId, motivo);
      
      console.log('✅ Ofício rejeitado com sucesso');
      
      alert('❌ Ofício rejeitado com sucesso.');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Erro ao rejeitar:', error);
      alert('❌ Erro ao rejeitar ofício. Tente novamente.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando revisão...</p>
        </div>
      </div>
    );
  }

  if (!oficio) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Ofício não encontrado</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const diasRestantes = Math.ceil(
    (new Date(oficio.prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <ProductBrand product="Oficios" size="md" variant="light" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Ofício #{oficio.numero}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className={`text-sm font-semibold ${
                  diasRestantes <= 3 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Usuário</p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Wizard Steps */}
      <WizardSteps
        steps={wizardSteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Ver Documento */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                📄 PASSO 1: Visualizar Documento Original
              </h2>
              <p className="text-gray-400">
                Leia o ofício para se familiarizar com o conteúdo antes de revisar os dados extraídos pela IA.
              </p>
            </div>

            <div className="h-[600px]">
              <DocumentViewer
                pdfUrl={oficio.pdfUrl}
                ocrText={oficio.ocrText}
                oficioNumero={oficio.numero}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex-1 mr-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>Dica:</strong> Use o zoom para ler detalhes do PDF. Você pode alternar entre PDF e texto OCR.
                </p>
              </div>
              
              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                CONTINUAR PARA PASSO 2 →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Revisar Dados */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🤖 PASSO 2: Revisar o que a IA Extraiu
              </h2>
              <p className="text-gray-400">
                Verifique os dados que a Inteligência Artificial encontrou no documento.
              </p>
            </div>

            <OverallConfidenceBadge confidence={oficio.dados_ia.confianca_geral} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
              <DocumentViewer
                pdfUrl={oficio.pdfUrl}
                ocrText={oficio.ocrText}
                oficioNumero={oficio.numero}
              />
              <ExtractionResults dados={oficio.dados_ia} />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                ← VOLTAR
              </button>
              
              <button
                onClick={() => setCurrentStep(3)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                CORRIGIR DADOS NO PASSO 3 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Corrigir e Enriquecer */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ✏️  PASSO 3: Corrigir Dados e Adicionar Contexto
              </h2>
              <p className="text-gray-400">
                Revise e corrija os campos extraídos. Adicione contexto jurídico para ajudar a IA a gerar uma resposta mais precisa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[700px]">
                <DocumentViewer
                  pdfUrl={oficio.pdfUrl}
                  ocrText={oficio.ocrText}
                  oficioNumero={oficio.numero}
                />
              </div>
              <div className="h-[700px]">
                <ComplianceReviewForm
                  initialData={{
                    numero_oficio: oficio.dados_ia.numero_oficio,
                    numero_processo: oficio.dados_ia.numero_processo,
                    autoridade_emissora: oficio.dados_ia.autoridade_emissora,
                    prazo_resposta: oficio.dados_ia.prazo_resposta,
                    descricao: oficio.descricao,
                  }}
                  confidences={oficio.dados_ia.confiancas_por_campo}
                  onSave={handleSaveRascunho}
                  onApprove={handleAprovar}
                  onReject={handleRejeitar}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                ← VOLTAR PARA PASSO 2
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-green-600 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">
              ✅ Ofício Aprovado!
            </h3>
            
            <p className="text-gray-300 mb-2">
              A IA está gerando a resposta automaticamente.
            </p>
            
            <p className="text-sm text-gray-400 mb-6">
              Você será notificado quando a resposta estiver pronta para revisão final.
            </p>

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            
            <p className="text-xs text-gray-500">
              Redirecionando para o dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

