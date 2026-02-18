import { toast } from 'sonner';

/**
 * Toast Notification Helpers
 * 
 * Centralized toast notifications with consistent styling and behavior
 */

export const showToast = {
  /**
   * Success toast - green checkmark
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Error toast - red X
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Warning toast - yellow warning
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Info toast - blue info
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Loading toast - with spinner
   * Returns toast ID to dismiss later
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Promise toast - automatically shows loading/success/error
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Dismiss specific toast by ID
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Form validation error toast
 */
export function showValidationError(fieldName: string, error: string) {
  showToast.error('Erro de validação', `${fieldName}: ${error}`);
}

/**
 * Network error toast
 */
export function showNetworkError(message = 'Erro de conexão. Tente novamente.') {
  showToast.error('Erro de Rede', message);
}

/**
 * Permission denied toast
 */
export function showPermissionError(message = 'Você não tem permissão para esta ação.') {
  showToast.error('Permissão Negada', message);
}

/**
 * Generic API error toast with retry option
 */
export function showApiError(error: any, onRetry?: () => void) {
  const message = error?.message || 'Ocorreu um erro inesperado.';
  
  if (onRetry) {
    toast.error('Erro', {
      description: message,
      action: {
        label: 'Tentar novamente',
        onClick: onRetry,
      },
      duration: 6000,
    });
  } else {
    showToast.error('Erro', message);
  }
}
