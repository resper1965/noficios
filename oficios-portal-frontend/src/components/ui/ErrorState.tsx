'use client';

import { AlertTriangle, HelpCircle, Mail } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  error?: string;
  suggestions?: string[];
  onRetry?: () => void;
  showSupport?: boolean;
}

export function ErrorState({
  title,
  error,
  suggestions = [],
  onRetry,
  showSupport = true,
}: ErrorStateProps) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 max-w-2xl">
      <div className="flex items-start space-x-4 mb-4">
        <div className="p-2 bg-red-900/30 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-1">{title}</h3>
          {error && (
            <p className="text-sm text-red-300/80 mb-3">{error}</p>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="h-4 w-4 text-blue-400" />
            <p className="text-sm font-medium text-blue-400">O que você pode fazer:</p>
          </div>
          <ul className="space-y-1.5 ml-6">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start">
                <span className="mr-2 text-blue-400">{index + 1}.</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-red-800/50">
        {showSupport && (
          <a
            href="mailto:suporte@ness.com.br"
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>suporte@ness.com.br</span>
          </a>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
}

