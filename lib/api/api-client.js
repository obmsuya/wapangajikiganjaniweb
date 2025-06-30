/**
 * Base API client that uses fetch for API requests
 */
const API_BASE_URL = 'http://localhost:8000';

/**
 * Make an API request with proper error handling
 */
async function apiRequest(endpoint, options = {}) {
  // Get auth token if available - FIXED TO USE access_token INSTEAD OF authToken
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare the request
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers,
    credentials: 'include', // Include cookies for session auth if needed
    ...options,
  };
  
  // Add body for non-GET requests
  if (options.body && config.method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log(`Fetching: ${url}`, config);
    const response = await fetch(url, config);
    
    // Handle HTTP errors
    if (!response.ok) {
      // Handle 401 Unauthorized - Redirect to login page
      if (response.status === 401) {
        console.error('Authentication error, redirecting to login');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        throw new Error('Authentication failed. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }
    
    // Parse response as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Convenience methods for common HTTP methods
const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;