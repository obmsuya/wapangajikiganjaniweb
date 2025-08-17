// lib/utils/errorHandler.js

import { customToast } from '@/components/ui/custom-toast';

export const ERROR_TYPES = {
  NETWORK: 'network_error',
  VALIDATION: 'validation_error', 
  PAYMENT: 'payment_error',
  AUTHENTICATION: 'auth_error',
  AUTHORIZATION: 'permission_error',
  SERVER: 'server_error',
  TIMEOUT: 'timeout_error',
  NOT_FOUND: 'not_found_error',
  RATE_LIMIT: 'rate_limit_error'
};

const USER_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: "Connection Error",
    message: "Unable to connect to our servers. Please check your internet connection and try again."
  },
  [ERROR_TYPES.VALIDATION]: {
    title: "Invalid Information", 
    message: "Please check your information and try again."
  },
  [ERROR_TYPES.PAYMENT]: {
    title: "Payment Error",
    message: "There was an issue processing your payment. Please try again or contact support."
  },
  [ERROR_TYPES.AUTHENTICATION]: {
    title: "Sign In Required",
    message: "Please sign in to continue."
  },
  [ERROR_TYPES.AUTHORIZATION]: {
    title: "Access Denied",
    message: "You don't have permission to perform this action."
  },
  [ERROR_TYPES.SERVER]: {
    title: "Server Error",
    message: "Something went wrong on our end. Please try again later."
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: "Request Timeout",
    message: "The request took too long to complete. Please try again."
  },
  [ERROR_TYPES.NOT_FOUND]: {
    title: "Not Found",
    message: "The requested information could not be found."
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    title: "Too Many Requests",
    message: "You're making requests too quickly. Please wait a moment and try again."
  }
};

const PAYMENT_ERROR_PATTERNS = {
  'insufficient funds': {
    title: "Insufficient Funds",
    message: "You don't have enough funds in your account. Please top up and try again."
  },
  'invalid account': {
    title: "Invalid Account",
    message: "The account number you entered is invalid. Please check and try again."
  },
  'transaction timeout': {
    title: "Transaction Timeout", 
    message: "The payment request timed out. Please try again."
  },
  'provider unavailable': {
    title: "Service Unavailable",
    message: "The payment provider is temporarily unavailable. Please try again later."
  },
  'payment declined': {
    title: "Payment Declined",
    message: "Your payment was declined. Please check with your bank or try another payment method."
  },
  'subscription already active': {
    title: "Subscription Active",
    message: "You already have an active subscription. Please wait for it to expire before upgrading."
  },
  'plan not found': {
    title: "Plan Unavailable",
    message: "The selected subscription plan is no longer available."
  }
};

const RENT_PAYMENT_ERROR_PATTERNS = {
  'no active occupancy': {
    title: "No Active Lease",
    message: "You don't have an active lease for this property. Please contact your landlord."
  },
  'payment already exists': {
    title: "Payment Already Made",
    message: "A payment for this period is already being processed or has been completed."
  },
  'unit not found': {
    title: "Unit Not Found", 
    message: "The specified unit could not be found. Please contact support."
  },
  'landlord not found': {
    title: "Landlord Not Available",
    message: "Unable to process payment. Please contact your landlord directly."
  },
  'payment period invalid': {
    title: "Invalid Payment Period",
    message: "The payment period is invalid. Please check the dates and try again."
  }
};

export class ErrorHandler {
  static classifyError(error, context = 'general') {
    if (!error) {
      return {
        type: ERROR_TYPES.SERVER,
        title: "Unknown Error",
        message: "An unexpected error occurred. Please try again."
      };
    }

    const errorMessage = (error.message || error.toString()).toLowerCase();
    const statusCode = error.status || error.response?.status;

    if (statusCode === 401) {
      return {
        type: ERROR_TYPES.AUTHENTICATION,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHENTICATION]
      };
    }

    if (statusCode === 403) {
      return {
        type: ERROR_TYPES.AUTHORIZATION,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHORIZATION]
      };
    }

    if (statusCode === 404) {
      return {
        type: ERROR_TYPES.NOT_FOUND,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.NOT_FOUND]
      };
    }

    if (statusCode === 429) {
      return {
        type: ERROR_TYPES.RATE_LIMIT,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.RATE_LIMIT]
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || statusCode >= 500) {
      return {
        type: ERROR_TYPES.NETWORK,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.NETWORK]
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        type: ERROR_TYPES.TIMEOUT,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.TIMEOUT]
      };
    }

    if (errorMessage.includes('validation') || errorMessage.includes('required') || statusCode === 400) {
      return {
        type: ERROR_TYPES.VALIDATION,
        ...USER_FRIENDLY_MESSAGES[ERROR_TYPES.VALIDATION]
      };
    }

    if (context === 'payment' || context === 'subscription') {
      for (const [pattern, errorInfo] of Object.entries(PAYMENT_ERROR_PATTERNS)) {
        if (errorMessage.includes(pattern)) {
          return {
            type: ERROR_TYPES.PAYMENT,
            ...errorInfo
          };
        }
      }
    }

    if (context === 'rent_payment') {
      for (const [pattern, errorInfo] of Object.entries(RENT_PAYMENT_ERROR_PATTERNS)) {
        if (errorMessage.includes(pattern)) {
          return {
            type: ERROR_TYPES.PAYMENT,
            ...errorInfo
          };
        }
      }
    }

    return {
      type: ERROR_TYPES.SERVER,
      title: "Error",
      message: errorMessage.length > 100 ? USER_FRIENDLY_MESSAGES[ERROR_TYPES.SERVER].message : errorMessage
    };
  }

  static handleError(error, context = 'general', options = {}) {
    const classified = this.classifyError(error, context);
    
    const toastOptions = {
      description: classified.message,
      ...options
    };

    switch (classified.type) {
      case ERROR_TYPES.NETWORK:
      case ERROR_TYPES.TIMEOUT:
      case ERROR_TYPES.SERVER:
        customToast.error(classified.title, toastOptions);
        break;
        
      case ERROR_TYPES.VALIDATION:
        customToast.warning(classified.title, toastOptions);
        break;
        
      case ERROR_TYPES.PAYMENT:
        customToast.error(classified.title, toastOptions);
        break;
        
      case ERROR_TYPES.AUTHENTICATION:
      case ERROR_TYPES.AUTHORIZATION:
        customToast.warning(classified.title, toastOptions);
        break;
        
      default:
        customToast.error(classified.title, toastOptions);
    }

    return classified;
  }

  static handleAsyncOperation(operation, context = 'general', options = {}) {
    return async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        const classified = this.handleError(error, context, options);
        throw { ...error, classified };
      }
    };
  }

  static createErrorResponse(success = false, error = null, data = null, context = 'general') {
    if (success) {
      return { success: true, data, error: null };
    }

    const classified = this.classifyError(error, context);
    return {
      success: false,
      error: classified.message,
      errorType: classified.type,
      data: null
    };
  }

  static isRetryableError(error) {
    const classified = this.classifyError(error);
    return [
      ERROR_TYPES.NETWORK,
      ERROR_TYPES.TIMEOUT,
      ERROR_TYPES.SERVER,
      ERROR_TYPES.RATE_LIMIT
    ].includes(classified.type);
  }

  static getRetryDelay(attempt, baseDelay = 1000) {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000);
  }

  static async withRetry(operation, maxRetries = 3, context = 'general') {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }
        
        const delay = this.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

export const handleApiError = (error, context) => ErrorHandler.handleError(error, context);
export const withErrorHandling = (operation, context) => ErrorHandler.handleAsyncOperation(operation, context);
export const createErrorResponse = (success, error, data, context) => ErrorHandler.createErrorResponse(success, error, data, context);

export default ErrorHandler;