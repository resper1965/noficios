'use client';

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number; // 0-1 ou 0-100
  field?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({ confidence, field, size = 'md' }: ConfidenceBadgeProps) {
  // Normalizar para 0-100
  const percent = confidence > 1 ? confidence : confidence * 100;
  
  // Determinar nível de confiança
  const level = percent >= 88 ? 'high' : percent >= 70 ? 'medium' : 'low';
  
  const config = {
    high: {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      icon: CheckCircle,
      label: 'Alta confiança',
      barColor: 'bg-green-500',
    },
    medium: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500',
      icon: AlertCircle,
      label: 'Confiança média',
      barColor: 'bg-yellow-500',
    },
    low: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      icon: AlertTriangle,
      label: 'Baixa confiança',
      barColor: 'bg-red-500',
    },
  };

  const { color, bgColor, borderColor, icon: Icon, label, barColor } = config[level];
  
  const sizeClasses = {
    sm: { text: 'text-xs', icon: 'h-3 w-3', padding: 'px-2 py-1' },
    md: { text: 'text-sm', icon: 'h-4 w-4', padding: 'px-3 py-1.5' },
    lg: { text: 'text-base', icon: 'h-5 w-5', padding: 'px-4 py-2' },
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Badge */}
      <div className={`inline-flex items-center space-x-2 ${bgColor} border ${borderColor} rounded-lg ${sizeClasses[size].padding}`}>
        <Icon className={`${sizeClasses[size].icon} ${color}`} />
        <span className={`${sizeClasses[size].text} font-medium ${color}`}>
          {Math.round(percent)}%
        </span>
      </div>

      {/* Progress Bar (opcional) */}
      {size !== 'sm' && (
        <div className="flex-1 max-w-xs">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tooltip Text */}
      {field && size === 'lg' && (
        <span className="text-xs text-gray-400">
          {label} em <span className="font-medium">{field}</span>
        </span>
      )}
    </div>
  );
}

/**
 * Badge de confiança geral do ofício
 */
export function OverallConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = confidence > 1 ? confidence : confidence * 100;
  const level = percent >= 88 ? 'high' : percent >= 70 ? 'medium' : 'low';

  const messages = {
    high: {
      title: '✅ Alta Confiança',
      description: 'A IA teve certeza na extração. Apenas confirme os dados!',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700',
    },
    medium: {
      title: '⚠️  Confiança Média',
      description: 'Revise com atenção os campos marcados antes de aprovar.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-700',
    },
    low: {
      title: '🚨 Baixa Confiança',
      description: 'A IA teve dificuldade. Revise TODOS os campos com cuidado!',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700',
    },
  };

  const { title, description, color, bgColor, borderColor } = messages[level];

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <p className={`font-semibold ${color} mb-1`}>{title}</p>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
        <div className={`text-3xl font-bold ${color}`}>
          {Math.round(percent)}%
        </div>
      </div>
    </div>
  );
}

