const API_BASE_URL = 'https://backend.wapangaji.com';

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken, refreshToken = null) => {
  if (typeof window === 'undefined') return;
  
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

const AUTH_STORAGE_KEYS = ['access_token', 'refresh_token', 'user_data', 'tokens'];

const clearTokens = () => {
  if (typeof window === 'undefined') return;

  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;

  clearTokens();
  const currentPath = window.location.pathname + window.location.search;
  const isOnLoginPage = window.location.pathname.startsWith('/login');
  window.location.href = isOnLoginPage ? '/login' : `/login?next=${encodeURIComponent(currentPath)}`;
};

// One refresh at a time: with rotating refresh tokens, a second parallel refresh would spend a blacklisted token.
let refreshInFlight = null;

const refreshAccessToken = () => {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const requestNewAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error('No refresh token available');
    redirectToLogin();
    return null;
  }

  try {
    console.log('Attempting to refresh access token...');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    const newAccessToken = data.access;
    const newRefreshToken = data.refresh; 

    setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
    
  } catch (error) {
    // Another tab may have rotated the refresh token while this request was in flight.
    const latestRefreshToken = getRefreshToken();
    if (latestRefreshToken && latestRefreshToken !== refreshToken) {
      return getAccessToken();
    }
    console.error('Token refresh failed:', error);
    redirectToLogin();
    return null;
  }
};

async function apiRequest(endpoint, options = {}) {
  const makeRequest = async (token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      ...options,
    };
    
    if (options.body && config.method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const requestError = response.status === 401
        ? new Error('UNAUTHORIZED')
        : new Error(errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`);
      requestError.status = response.status;
      requestError.data = errorData;
      throw requestError;
    }

    return await response.json();
  };

  try {
    // accessToken: null sends no token (public endpoints); a string sends that token instead of the stored one.
    const currentToken = 'accessToken' in options ? options.accessToken : getAccessToken();
    console.log(`Making API request to: ${endpoint}`);
    
    return await makeRequest(currentToken);
    
  } catch (error) {
    if (error.message === 'UNAUTHORIZED' && !options._isRetry && !options.skipAuthRefresh) {
      console.log('Access token expired, attempting refresh...');
      
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        console.log('Retrying request with new access token...');
        return await apiRequest(endpoint, { ...options, _isRetry: true });
      }
    }

    console.error('API request failed:', error);
    throw error;
  }
}

// API methods
const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  
  // Utility methods for token management
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated: () => !!getAccessToken(),
  
  // Manual refresh method (if needed)
  refreshToken: refreshAccessToken
};

export default api;