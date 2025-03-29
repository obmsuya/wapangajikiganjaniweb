// lib/fetchClient.ts
/**
 * A simple fetch-based API client for making HTTP requests to the backend
 * Handles authentication tokens and provides consistent error handling
 */

// Base configuration for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Type definitions for request options
interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Enhanced error with additional properties
interface ApiError extends Error {
  status: number;
  data: unknown;
}

/**
 * Creates a query string from an object of parameters
 * @param params - Object containing query parameters
 * @returns Formatted query string
 */
const createQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return '';
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Gets the authentication token from localStorage (client-side only)
 * @returns The authentication token or null if not found
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Creates an error object with additional properties from the response
 * @param response - Fetch Response object
 * @param data - Response data
 * @returns Enhanced error object
 */
const createApiError = async (response: Response, data?: unknown): Promise<ApiError> => {
  const errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
  const error = new Error(errorMessage) as ApiError;
  error.status = response.status;
  
  // Try to parse error data if not already provided
  if (!data) {
    try {
      error.data = await response.json();
    } catch (e) {
      error.data = { detail: response.statusText };
      console.error('Error parsing error data:', e);
    }
  } else {
    error.data = data;
  }
  
  return error;
};

/**
 * Makes an HTTP request using fetch with consistent error handling
 * @param endpoint - API endpoint path
 * @param options - Request options including method, body, headers, etc.
 * @returns Promise resolving to the response data
 */
const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  try {
    const { params, ...fetchOptions } = options;
    
    // Build the full URL including any query parameters
    const url = `${API_BASE_URL}${endpoint}${createQueryString(params)}`;
    
    // Prepare headers with content type and auth token if available
    const headers = new Headers(fetchOptions.headers);
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Convert body to JSON string if it's an object
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body,
    });
    
    // Handle different response types
    let data: unknown;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }
    
    console.log('Response status:', response.status);
    window.location.href  = '/';
    // Check if response is successful (status code 2xx)
    if (!response.ok) {
      throw await createApiError(response, data);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`API request failed: ${error.message}`);
      
      // Check if it's an ApiError with status 401 for unauthorized
      if ((error as ApiError).status === 401) {
        if (typeof window !== 'undefined') {
          // Trigger unauthorized event
          const event = new CustomEvent('auth:unauthorized', { detail: error });
          window.dispatchEvent(event);
        }
      }
    }
    
    throw error;
  }
};

/**
 * HTTP method shortcuts with consistent interface
 */
export const fetchClient = {
  /**
   * Makes a GET request to the specified endpoint
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  get: <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'GET' });
  },
  
  /**
   * Makes a POST request to the specified endpoint
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Additional request options
   * @returns Promise resolving to the response data
   */
  post: <T>(endpoint: string, data?: BodyInit | null | object, options: FetchOptions = {}): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'POST', body: data as BodyInit });
  },
  
  /**
   * Makes a PUT request to the specified endpoint
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Additional request options
   * @returns Promise resolving to the response data
   */
  put: <T>(endpoint: string, data?: BodyInit | null | object, options: FetchOptions = {}): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'PUT', body: data as BodyInit });
  },
  
  /**
   * Makes a PATCH request to the specified endpoint
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Additional request options
   * @returns Promise resolving to the response data
   */
  patch: <T>(endpoint: string, data?: BodyInit | null | object, options: FetchOptions = {}): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: data as BodyInit });
  },
  
  /**
   * Makes a DELETE request to the specified endpoint
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  delete: <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
  }
};

/**
 * Handler for 401 Unauthorized errors
 * To be implemented by the authentication service
 */
export const handleUnauthorized = (callback: () => void): () => void => {
  if (typeof window === 'undefined') return () => {};
  
  const listener = (): void => {
    callback();
  };
  
  window.addEventListener('auth:unauthorized', listener);
  return () => window.removeEventListener('auth:unauthorized', listener);
};