/**
 * Toast Notifications - Wrapper para react-hot-toast
 * 
 * Substitui alert() por notificações elegantes
 */

import toast, { Toaster } from 'react-hot-toast';

// Estilos customizados (ness. branding)
const toastStyles = {
  success: {
    style: {
      background: '#065f46', // green-900
      color: '#fff',
      border: '1px solid #10b981', // green-500
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  },
  error: {
    style: {
      background: '#7f1d1d', // red-900
      color: '#fff',
      border: '1px solid #ef4444', // red-500
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
  loading: {
    style: {
      background: '#1e3a8a', // blue-900
      color: '#fff',
      border: '1px solid #3b82f6', // blue-500
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
  },
  warning: {
    style: {
      background: '#78350f', // yellow-900
      color: '#fff',
      border: '1px solid #f59e0b', // yellow-500
    },
    iconTheme: {
      primary: '#f59e0b',
      secondary: '#fff',
    },
  },
};

/**
 * Toast de sucesso
 */
export function toastSuccess(message: string) {
  toast.success(message, toastStyles.success);
}

/**
 * Toast de erro
 */
export function toastError(message: string) {
  toast.error(message, toastStyles.error);
}

/**
 * Toast de loading (retorna ID para dismiss)
 */
export function toastLoading(message: string) {
  return toast.loading(message, toastStyles.loading);
}

/**
 * Toast de aviso
 */
export function toastWarning(message: string) {
  toast(message, {
    icon: '⚠️',
    ...toastStyles.warning,
  });
}

/**
 * Toast de info
 */
export function toastInfo(message: string) {
  toast(message, {
    icon: '💡',
    style: {
      background: '#1e293b', // gray-800
      color: '#fff',
      border: '1px solid #64748b', // gray-500
    },
  });
}

/**
 * Dismiss toast específico
 */
export function toastDismiss(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Promise toast (automático: loading → success/error)
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      success: toastStyles.success,
      error: toastStyles.error,
      loading: toastStyles.loading,
    }
  );
}

/**
 * Componente Toaster (adicionar no layout)
 */
export { Toaster };

// Exemplo de uso:
// import { toastSuccess, toastError, toastPromise } from '@/lib/toast';
//
// toastSuccess('Ofício aprovado!');
// toastError('Erro ao processar');
//
// await toastPromise(
//   apiClient.aprovarOficio(...),
//   {
//     loading: 'Aprovando ofício...',
//     success: '✅ Ofício aprovado!',
//     error: '❌ Erro ao aprovar'
//   }
// );

