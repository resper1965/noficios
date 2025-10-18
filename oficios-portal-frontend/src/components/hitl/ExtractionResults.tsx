'use client';

import { ConfidenceBadge } from './ConfidenceBadge';
import { FileText, Building2, Calendar, Hash, Brain } from 'lucide-react';

interface ExtractionResultsProps {
  dados: {
    numero_oficio?: string;
    numero_processo?: string;
    autoridade_emissora?: string;
    prazo_resposta?: string;
    classificacao_intencao?: string;
    confianca_geral?: number;
    confiancas_por_campo?: Record<string, number>;
  };
}

export function ExtractionResults({ dados }: ExtractionResultsProps) {
  const fields = [
    {
      icon: Hash,
      label: 'Número do Ofício',
      value: dados.numero_oficio,
      confidence: dados.confiancas_por_campo?.numero_oficio || dados.confianca_geral || 0,
    },
    {
      icon: FileText,
      label: 'Número do Processo',
      value: dados.numero_processo,
      confidence: dados.confiancas_por_campo?.numero_processo || dados.confianca_geral || 0,
    },
    {
      icon: Building2,
      label: 'Autoridade Emissora',
      value: dados.autoridade_emissora,
      confidence: dados.confiancas_por_campo?.autoridade_emissora || dados.confianca_geral || 0,
    },
    {
      icon: Calendar,
      label: 'Prazo de Resposta',
      value: dados.prazo_resposta,
      confidence: dados.confiancas_por_campo?.prazo_resposta || dados.confianca_geral || 0,
    },
  ];

  if (dados.classificacao_intencao) {
    fields.push({
      icon: Brain,
      label: 'Intenção Classificada',
      value: dados.classificacao_intencao,
      confidence: 1.0,
    });
  }

  // Campos com baixa confiança
  const camposBaixaConfianca = fields.filter(f => (f.confidence * 100) < 80).length;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-3">
          <Brain className="h-5 w-5 text-purple-400" />
          <span>O que a IA Extraiu</span>
        </h3>

        {/* Overall Confidence Alert */}
        {camposBaixaConfianca > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-300 font-medium">
              ⚠️  {camposBaixaConfianca} {camposBaixaConfianca === 1 ? 'campo precisa' : 'campos precisam'} de atenção
            </p>
            <p className="text-xs text-gray-400 mt-1">
              A IA teve dificuldade em ler alguns dados. Confira no próximo passo!
            </p>
          </div>
        )}
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {fields.map((field, index) => {
          const Icon = field.icon;
          const percent = field.confidence * 100;
          const needsAttention = percent < 80;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all ${
                needsAttention
                  ? 'bg-yellow-900/10 border-yellow-700/50'
                  : 'bg-gray-900/50 border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    {field.label}
                  </span>
                </div>
                <ConfidenceBadge confidence={field.confidence} size="sm" />
              </div>

              <p className={`text-base font-medium ${
                field.value ? 'text-white' : 'text-gray-500 italic'
              }`}>
                {field.value || 'Não detectado'}
              </p>

              {needsAttention && field.value && (
                <p className="text-xs text-yellow-400 mt-2">
                  → Confira este campo com atenção no documento original
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Tip */}
      <div className="p-4 bg-purple-900/10 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          💡 <strong>Dica:</strong> Campos com confiança abaixo de 80% devem ser conferidos manualmente no documento.
        </p>
      </div>
    </div>
  );
}

