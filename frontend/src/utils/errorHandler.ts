import { toast } from 'react-hot-toast';

// Error types
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: Date;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToAnalytics?: boolean;
  fallbackMessage?: string;
}

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  OPERATION_FAILED: 'OPERATION_FAILED',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.CONNECTION_REFUSED]: 'Unable to connect to server. Please try again later.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.FORBIDDEN]: 'Access denied. You do not have permission to perform this action.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [ERROR_CODES.API_ERROR]: 'An error occurred while processing your request.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type. Please choose a supported file format.',
  [ERROR_CODES.UPLOAD_FAILED]: 'File upload failed. Please try again.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions for this action.',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.OPERATION_FAILED]: 'Operation failed. Please try again.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
} as const;

// Error handler class
class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create error object
  createError(
    message: string,
    code?: keyof typeof ERROR_CODES,
    status?: number,
    details?: any
  ): AppError {
    return {
      message,
      code: code ? ERROR_CODES[code] : ERROR_CODES.UNKNOWN_ERROR,
      status,
      details,
      timestamp: new Date(),
    };
  }

  // Handle error with options
  handleError(
    error: Error | string | AppError,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const {
      showToast = true,
      logToConsole = true,
      reportToAnalytics = true,
      fallbackMessage = 'An unexpected error occurred',
    } = options;

    let appError: AppError;

    // Convert different error types to AppError
    if (typeof error === 'string') {
      appError = this.createError(error);
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createError(error.message || fallbackMessage);
    }

    // Show toast notification
    if (showToast) {
      this.showErrorToast(appError);
    }

    // Log to console
    if (logToConsole) {
      this.logError(appError);
    }

    // Report to analytics
    if (reportToAnalytics) {
      this.reportError(appError);
    }

    // Notify listeners
    this.notifyListeners(appError);

    return appError;
  }

  // Handle API errors
  handleApiError(
    response: Response | any,
    options: ErrorHandlerOptions = {}
  ): AppError {
    let message = 'API request failed';
    let code: keyof typeof ERROR_CODES = ERROR_CODES.API_ERROR;
    let status: number | undefined;

    if (response instanceof Response) {
      status = response.status;
      
      switch (response.status) {
        case 400:
          message = 'Invalid request';
          code = ERROR_CODES.VALIDATION_ERROR;
          break;
        case 401:
          message = 'Authentication required';
          code = ERROR_CODES.UNAUTHORIZED;
          break;
        case 403:
          message = 'Access denied';
          code = ERROR_CODES.FORBIDDEN;
          break;
        case 404:
          message = 'Resource not found';
          code = ERROR_CODES.RESOURCE_NOT_FOUND;
          break;
        case 429:
          message = 'Too many requests';
          code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
          break;
        case 500:
          message = 'Server error';
          code = ERROR_CODES.SERVER_ERROR;
          break;
        default:
          message = `HTTP ${response.status} error`;
      }
    } else if (response?.status) {
      status = response.status;
      message = response.message || 'API error';
    }

    return this.handleError(this.createError(message, code, status), options);
  }

  // Handle network errors
  handleNetworkError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): AppError {
    let message = 'Network error';
    let code: keyof typeof ERROR_CODES = ERROR_CODES.NETWORK_ERROR;

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      message = 'Network connection error';
      code = ERROR_CODES.NETWORK_ERROR;
    } else if (error.name === 'AbortError') {
      message = 'Request was cancelled';
      code = ERROR_CODES.TIMEOUT_ERROR;
    } else if (error.code === 'ECONNREFUSED') {
      message = 'Connection refused';
      code = ERROR_CODES.CONNECTION_REFUSED;
    }

    return this.handleError(this.createError(message, code), options);
  }

  // Handle validation errors
  handleValidationError(
    errors: Record<string, string[]> | string[],
    options: ErrorHandlerOptions = {}
  ): AppError {
    let message = 'Validation error';
    
    if (Array.isArray(errors)) {
      message = errors.join(', ');
    } else if (typeof errors === 'object') {
      const errorMessages = Object.values(errors).flat();
      message = errorMessages.join(', ');
    }

    return this.handleError(this.createError(message, ERROR_CODES.VALIDATION_ERROR), options);
  }

  // Handle file upload errors
  handleFileError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): AppError {
    let message = 'File error';
    let code: keyof typeof ERROR_CODES = ERROR_CODES.UPLOAD_FAILED;

    if (error.name === 'FileTooLargeError') {
      message = 'File is too large';
      code = ERROR_CODES.FILE_TOO_LARGE;
    } else if (error.name === 'InvalidFileTypeError') {
      message = 'Invalid file type';
      code = ERROR_CODES.INVALID_FILE_TYPE;
    }

    return this.handleError(this.createError(message, code), options);
  }

  // Show error toast
  private showErrorToast(error: AppError): void {
    const message = this.getErrorMessage(error);
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  }

  // Log error to console
  private logError(error: AppError): void {
    console.error('Application Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.details?.stack,
    });
  }

  // Report error to analytics
  private reportError(error: AppError): void {
    // This would integrate with your analytics service
    // Example: Google Analytics, Sentry, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  // Get user-friendly error message
  getErrorMessage(error: AppError): string {
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    return error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  }

  // Add error listener
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Notify error listeners
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  // Type guard for AppError
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'message' in error && 'timestamp' in error;
  }

  // Clear all error listeners
  clearListeners(): void {
    this.errorListeners = [];
  }
}

// Create singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export function handleError(
  error: Error | string | AppError,
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handleError(error, options);
}

export function handleApiError(
  response: Response | any,
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handleApiError(response, options);
}

export function handleNetworkError(
  error: any,
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handleNetworkError(error, options);
}

export function handleValidationError(
  errors: Record<string, string[]> | string[],
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handleValidationError(errors, options);
}

export function handleFileError(
  error: any,
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handleFileError(error, options);
}

// React hook for error handling
export function useErrorHandler() {
  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleFileError,
    addErrorListener: errorHandler.addErrorListener.bind(errorHandler),
  };
}

// Export types and constants
export type { AppError, ErrorHandlerOptions };
export { ERROR_CODES, ERROR_MESSAGES };
