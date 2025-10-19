'use client';

import { useState } from 'react';
import { X, CheckCircle, ArrowRight, Mail, FileText, LayoutDashboard } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  action?: string;
  actionLabel?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao n.Oficios!',
    description: 'Automatize o processamento de ofícios judiciais em 3 passos simples. Transforme 3,5 horas de trabalho manual em apenas 5 minutos.',
    icon: CheckCircle,
  },
  {
    id: 'gmail',
    title: '1. Conectar Gmail',
    description: 'Configure a integração com Gmail para importar ofícios automaticamente. Basta aplicar a label INGEST nos emails e o sistema faz o resto.',
    icon: Mail,
    action: '/configuracoes',
    actionLabel: 'Configurar Agora',
  },
  {
    id: 'processo',
    title: '2. Revisar Ofícios',
    description: 'Nossa IA extrai dados automaticamente dos PDFs. Você só precisa revisar, adicionar contexto jurídico e aprovar em 4 passos guiados.',
    icon: FileText,
  },
  {
    id: 'dashboard',
    title: '3. Acompanhar SLA',
    description: 'Monitore prazos em tempo real com cards de risco. Nunca mais perca um prazo! Dashboard mostra ofícios urgentes, em risco e vencidos.',
    icon: LayoutDashboard,
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-blue-500'
                        : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {currentStep + 1} de {steps.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 bg-blue-900/30 rounded-2xl mb-6">
              <Icon className="h-12 w-12 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-gray-300 max-w-md leading-relaxed">{step.description}</p>
          </div>

          {currentStep === 0 && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">⏱️ <strong className="text-white">Tempo médio:</strong> 5 minutos por ofício</p>
              <p className="text-sm text-gray-400 mb-2">🎯 <strong className="text-white">Economia:</strong> 98% de redução de tempo manual</p>
              <p className="text-sm text-gray-400">✨ <strong className="text-white">IA integrada:</strong> Extração automática de dados</p>
            </div>
          )}

          {/* Tips */}
          {currentStep === 1 && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-400 font-medium mb-2">💡 Dica:</p>
              <p className="text-sm text-gray-300">Crie uma regra automática no Gmail para aplicar a label INGEST em emails de tribunais. Assim tudo fica 100% automatizado!</p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400 font-medium mb-2">✅ Portal HITL (4 passos):</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>1. Visualizar PDF do ofício</li>
                <li>2. Revisar dados extraídos pela IA</li>
                <li>3. Adicionar contexto jurídico</li>
                <li>4. Aprovar para processamento</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 border-t border-gray-700 px-8 py-4 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Pular tutorial
          </button>
          <div className="flex items-center space-x-3">
            {step.action && (
              <a
                href={step.action}
                className="px-4 py-2 text-sm font-medium text-blue-400 border border-blue-600 hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                {step.actionLabel}
              </a>
            )}
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>{isLastStep ? 'Começar a Usar' : 'Próximo'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

