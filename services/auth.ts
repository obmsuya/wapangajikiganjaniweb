// services/auth.ts
import api from '@/lib/api';
import { AxiosError } from 'axios';
import axios from 'axios';

/**
 * Authentication service for handling user authentication, token management, and related operations
 * Integrates with Django backend using JWT authentication
 */

// Types for authentication
export interface LoginCredentials {
  phone_number: string;
  password: string;
}

export interface RegisterData {
  phone_number: string;
  full_name: string;
  password: string;
  language?: 'en' | 'sw';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserData {
  id: string;
  phone_number: string;
  full_name: string;
  language: string;
  is_superuser: boolean;
  user_type: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface PasswordResetRequest {
  phone_number: string;
}

export interface PasswordResetData {
  phone_number: string;
  otp: string;
  new_password: string;
}

export interface UserStatusUpdate {
  status: string;
}

export interface AdminPasswordReset {
  new_password: string;
}

// Dashboard analytics interface
export interface DashboardAnalytics {
  user_metrics: {
    total_users: number;
    active_users: number;
    inactive_users: number;
  };
  recent_users: Array<{
    id: string | number;
    full_name: string;
    phone_number: string;
    date_joined: string;
  }>;
  system_status: {
    status: string;
    last_checked: string;
  };
}

// User list response interface
export interface UserListResponse {
  results: UserData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Activity log interface
export interface ActivityLog {
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
}

// User detail response interface
export interface UserDetailResponse extends UserData {
  activity_logs: ActivityLog[];
}

// Bulk operation parameters
export interface BulkOperationParams {
  operation: 'activate' | 'deactivate';
  user_ids: string[];
}

// Bulk operation response
export interface BulkOperationResponse {
  message: string;
}

// Custom error interface for authentication errors
export interface AuthError extends Error {
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Base API URL for authentication endpoints
 */
const AUTH_API_BASE = '/api/v1/auth';

/**
 * Create a specific authentication error with code and details
 * @param message - Error message
 * @param code - Error code for client identification
 * @param details - Additional error details
 * @returns Properly typed authentication error
 */
function createAuthError(message: string, code: string, details?: Record<string, unknown>): AuthError {
  const error = new Error(message) as AuthError;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Initialize the authentication service
 * Sets up event listeners for unauthorized errors
 */
export function initAuthService(): void {
  if (typeof window === 'undefined') return;

  // Setup global unauthorized handler
  const unsubscribe = handleUnauthorized(() => {
    // Clear tokens and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });
}

/**
 * Handle unauthorized errors
 * @param callback - Function to call when unauthorized
 * @returns Unsubscribe function
 */
export function handleUnauthorized(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    if (event instanceof CustomEvent && event.detail?.status === 401) {
      callback();
    }
  };

  window.addEventListener('auth:unauthorized', handler);
  return () => window.removeEventListener('auth:unauthorized', handler);
}

/**
 * Login user with credentials
 * @param credentials - User login credentials
 * @returns Promise with user data and tokens
 * @throws AuthError with specific error code
 */
export async function loginUser(credentials: LoginCredentials): Promise<{ user: UserData; tokens: AuthTokens }> {
  try {
    // Use axios directly for login to avoid the interceptor adding the token
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${AUTH_API_BASE}/login/`, 
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.tokens.access);
      localStorage.setItem('refreshToken', response.data.tokens.refresh);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      if (status === 401) {
        throw createAuthError(
          'Invalid credentials. Please check your phone number and password.',
          'invalid_credentials'
        );
      } else if (status === 400) {
        throw createAuthError(
          'Invalid input. Please check your credentials and try again.',
          'invalid_input',
          error.response?.data as Record<string, unknown>
        );
      }
    }
    
    throw createAuthError(
      'Failed to login. Please try again later.',
      'login_failed'
    );
  }
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Promise with user data and tokens
 * @throws AuthError with specific error code
 */
export async function registerUser(userData: RegisterData): Promise<{ user: UserData; tokens: AuthTokens }> {
  try {
    const response = await api.post(`${AUTH_API_BASE}/register/`, userData);
    
    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.tokens.access);
      localStorage.setItem('refreshToken', response.data.tokens.refresh);
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      if (status === 400) {
        throw createAuthError(
          'Invalid registration data. Please check your information and try again.',
          'invalid_registration_data',
          error.response?.data as Record<string, unknown>
        );
      }
    }
    
    throw createAuthError(
      'Failed to register. Please try again later.',
      'registration_failed'
    );
  }
}

/**
 * Logout the current user
 * @returns Promise with success status
 * @throws AuthError with specific error code
 */
export async function logoutUser(): Promise<{ detail: string }> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post(`${AUTH_API_BASE}/logout/`, { refresh: refreshToken });
    
    // Clear tokens from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear tokens anyway on error
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    throw createAuthError(
      'Failed to logout properly. Your session has been cleared.',
      'logout_failed'
    );
  }
}

/**
 * Refresh the access token using the refresh token
 * @returns Promise with new tokens
 * @throws AuthError with specific error code
 */
export async function refreshToken(): Promise<AuthTokens> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw createAuthError(
        'No refresh token available.',
        'no_refresh_token'
      );
    }
    
    const response = await api.post(`${AUTH_API_BASE}/token/refresh/`, {
      refresh: refreshToken
    });
    
    // Update tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.access);
      // Note: The refresh token typically stays the same
    }
    
    return {
      access: response.data.access,
      refresh: refreshToken
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      if (status === 401) {
        throw createAuthError(
          'Invalid or expired refresh token.',
          'invalid_refresh_token'
        );
      }
    }
    
    throw createAuthError(
      'Failed to refresh token. Please login again.',
      'refresh_failed'
    );
  }
}

/**
 * Get current user information
 * @returns Promise with user data
 * @throws AuthError with specific error code
 */
export async function getCurrentUser(): Promise<UserData> {
  try {
    const response = await api.get(`${AUTH_API_BASE}/me/`);
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      if (status === 401) {
        throw createAuthError(
          'Authentication required. Please login.',
          'authentication_required'
        );
      }
    }
    
    throw createAuthError(
      'Failed to get user information. Please try again later.',
      'user_info_failed'
    );
  }
}

/**
 * Request password reset
 * @param data - Password reset request data
 * @returns Promise with success message
 * @throws AuthError with specific error code
 */
export async function requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
  try {
    const response = await api.post(`${AUTH_API_BASE}/password-reset/request/`, data);
    return response.data;
  } catch (error) {
    // Avoid logging the entire error object which may contain circular references
    if (error instanceof AxiosError) {
      console.error('Password reset request error:', 
        error.message, 
        error.response?.status, 
        error.response?.data
      );
      
      const status = error.response?.status;
      
      if (status === 404) {
        throw createAuthError(
          'No account found with this phone number.',
          'account_not_found'
        );
      } else if (status === 400) {
        throw createAuthError(
          'Invalid phone number format.',
          'invalid_phone',
          error.response?.data as Record<string, unknown>
        );
      }
    }
    
    throw createAuthError(
      'Failed to request password reset. Please try again later.',
      'password_reset_request_failed'
    );
  }
}

/**
 * Complete password reset with OTP and new password
 * @param data - Password reset completion data
 * @returns Promise with success message and tokens
 * @throws AuthError with specific error code
 */
export async function completePasswordReset(data: PasswordResetData): Promise<{ message: string; tokens: AuthTokens }> {
  try {
    const response = await api.post(`${AUTH_API_BASE}/password-reset/complete/`, data);
    
    // Store tokens in localStorage
    if (typeof window !== 'undefined' && response.data.tokens) {
      localStorage.setItem('token', response.data.tokens.access);
      localStorage.setItem('refreshToken', response.data.tokens.refresh);
    }
    
    return response.data;
  } catch (error) {
    console.error('Password reset completion error:', error);
    
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      if (status === 404) {
        throw createAuthError(
          'No pending password reset found for this phone number.',
          'no_reset_found'
        );
      } else if (status === 401) {
        throw createAuthError(
          'Invalid or expired OTP code.',
          'invalid_otp'
        );
      } else if (status === 400) {
        throw createAuthError(
          'Invalid password. Please check requirements and try again.',
          'invalid_password',
          error.response?.data as Record<string, unknown>
        );
      }
    }
    
    throw createAuthError(
      'Failed to reset password. Please try again later.',
      'password_reset_failed'
    );
  }
}

/**
 * Admin User Service for admin-only operations
 */
export const AdminUserService = {
  /**
   * Get admin dashboard analytics
   * @returns Promise with dashboard analytics
   * @throws AuthError with specific error code
   */
  getDashboard: async (): Promise<DashboardAnalytics> => {
    try {
      const response = await api.get(`${AUTH_API_BASE}/admin/dashboard/`);
      return response.data;
    } catch (error) {
      console.error('Get dashboard error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 403) {
          throw createAuthError(
            'You do not have permission to access the admin dashboard.',
            'permission_denied'
          );
        }
      }
      
      throw createAuthError(
        'Failed to load dashboard data. Please try again later.',
        'dashboard_failed'
      );
    }
  },

  /**
   * Get list of all users (admin only)
   * @param page - Page number for pagination
   * @param pageSize - Number of items per page
   * @returns Promise with paginated user list
   * @throws AuthError with specific error code
   */
  getUsers: async (page = 1, pageSize = 10): Promise<UserListResponse> => {
    try {
      const response = await api.get(`${AUTH_API_BASE}/admin/users/`, {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 403) {
          throw createAuthError(
            'You do not have permission to access user data.',
            'permission_denied'
          );
        }
      }
      
      throw createAuthError(
        'Failed to load users. Please try again later.',
        'users_failed'
      );
    }
  },

  /**
   * Get details for a specific user (admin only)
   * @param userId - User ID to get details for
   * @returns Promise with user details
   * @throws AuthError with specific error code
   */
  getUserDetails: async (userId: string): Promise<UserDetailResponse> => {
    try {
      const response = await api.get(`${AUTH_API_BASE}/admin/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Get user details error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw createAuthError(
            `User with ID ${userId} not found.`,
            'user_not_found'
          );
        } else if (status === 403) {
          throw createAuthError(
            'You do not have permission to access user details.',
            'permission_denied'
          );
        }
      }
      
      throw createAuthError(
        'Failed to load user details. Please try again later.',
        'user_details_failed'
      );
    }
  },

  /**
   * Update user status (admin only)
   * @param userId - User ID to update
   * @param data - Status update data
   * @returns Promise with updated user data
   * @throws AuthError with specific error code
   */
  updateUserStatus: async (userId: string, data: UserStatusUpdate): Promise<UserData> => {
    try {
      const response = await api.patch(`${AUTH_API_BASE}/admin/users/${userId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Update user status error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw createAuthError(
            `User with ID ${userId} not found.`,
            'user_not_found'
          );
        } else if (status === 403) {
          throw createAuthError(
            'You do not have permission to update user status.',
            'permission_denied'
          );
        } else if (status === 400) {
          throw createAuthError(
            'Invalid status update. Please check your input and try again.',
            'invalid_status_update',
            error.response?.data as Record<string, unknown>
          );
        }
      }
      
      throw createAuthError(
        'Failed to update user status. Please try again later.',
        'status_update_failed'
      );
    }
  },

  /**
   * Reset user password (admin only)
   * @param userId - User ID to reset password for
   * @param data - New password data
   * @returns Promise with success message
   * @throws AuthError with specific error code
   */
  resetUserPassword: async (userId: string, data: AdminPasswordReset): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${AUTH_API_BASE}/admin/users/${userId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Reset user password error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw createAuthError(
            `User with ID ${userId} not found.`,
            'user_not_found'
          );
        } else if (status === 403) {
          throw createAuthError(
            'You do not have permission to reset user passwords.',
            'permission_denied'
          );
        } else if (status === 400) {
          throw createAuthError(
            'Invalid password. Please check requirements and try again.',
            'invalid_password',
            error.response?.data as Record<string, unknown>
          );
        }
      }

      throw createAuthError(
        'Failed to reset password. Please try again later.',
        'password_reset_failed'
      );
    }
  },

  /**
   * Perform bulk operations on users (admin only)
   * @param params - Bulk operation parameters
   * @returns Promise with success message
   * @throws AuthError with specific error code
   */
  bulkOperation: async (params: BulkOperationParams): Promise<BulkOperationResponse> => {
    try {
      const response = await api.post(`${AUTH_API_BASE}/admin/users/bulk-operation/`, params);
      return response.data;
    } catch (error) {
      console.error('Bulk operation error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 403) {
          throw createAuthError(
            'You do not have permission to perform bulk operations.',
            'permission_denied'
          );
        } else if (status === 400) {
          throw createAuthError(
            'Invalid operation parameters. Please check and try again.',
            'invalid_operation_params',
            error.response?.data as Record<string, unknown>
          );
        }
      }
      
      throw createAuthError(
        'Failed to perform bulk operation. Please try again later.',
        'bulk_operation_failed'
      );
    }
  },

  /**
   * Gets activity logs for a specific user (admin only)
   * @param userId - User ID to get logs for
   * @returns Promise with activity logs
   * @throws AuthError with specific error code
   */
  getUserActivityLogs: async (userId: string): Promise<ActivityLog[]> => {
    try {
      const response = await api.get(`${AUTH_API_BASE}/admin/users/${userId}/activity-logs/`);
      return response.data;
    } catch (error) {
      console.error('Get user activity logs error:', error);
      
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw createAuthError(
            `User with ID ${userId} not found.`,
            'user_not_found'
          );
        } else if (status === 403) {
          throw createAuthError(
            'You do not have permission to access user activity logs.',
            'permission_denied'
          );
        }
      }
      
      throw createAuthError(
        'Failed to load activity logs. Please try again later.',
        'activity_logs_failed'
      );
    }
  }
};

/**
* Checks if user is authenticated based on token presence
* @returns boolean indicating authentication status
*/
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false; // Always return false during server-side rendering
  }
  return !!localStorage.getItem('token');
}

/**
* Checks if the current user has admin privileges
* @returns boolean indicating admin status
*/
export async function isAdmin(): Promise<boolean> {
  try {
    if (!isAuthenticated()) {
      return false;
    }

    const user = await getCurrentUser();
    return user.is_staff === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Checks if the current user is system admin
 */
export async function isSystemAdmin(): Promise<boolean> {
    try {
        if (!isAuthenticated()) {
            return false;
        }

        const user = await getCurrentUser();
        return user.is_superuser === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Initialize auth service when imported
if (false) {
  initAuthService();
}

export const authService = {
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
  refreshToken,
  getCurrentUser,
  requestPasswordReset,
  completePasswordReset,
  isAuthenticated,
  isAdmin,
  isSystemAdmin,
  initAuthService,
  AdminUserService,
  // Get the current token (if available)
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }
};