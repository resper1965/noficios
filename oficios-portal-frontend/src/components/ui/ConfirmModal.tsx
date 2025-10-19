'use client';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  details?: string[];
}

const icons = {
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colors = {
  danger: {
    bg: 'bg-red-900/20',
    border: 'border-red-700',
    icon: 'text-red-400',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700',
    icon: 'text-yellow-400',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-700',
    icon: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    bg: 'bg-green-900/20',
    border: 'border-green-700',
    icon: 'text-green-400',
    button: 'bg-green-600 hover:bg-green-700',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  details,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className={`${colorScheme.bg} ${colorScheme.border} border rounded-t-xl p-6`}>
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg bg-gray-900/50`}>
              <Icon className={`h-6 w-6 ${colorScheme.icon}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-300">{message}</p>
            </div>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="px-6 py-4 bg-gray-900/30">
            <p className="text-sm font-medium text-gray-400 mb-2">O que vai acontecer:</p>
            <ul className="space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-800 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${colorScheme.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

