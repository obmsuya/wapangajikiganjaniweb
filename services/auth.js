// services/auth.js
import api from '@/lib/api/api-client';

// ------------------------------------------------------------------
// Helper: decide storage based on "remember me" preference.
// - rememberMe = true  → localStorage  (survives browser close)
// - rememberMe = false → sessionStorage (cleared on tab/window close)
// ------------------------------------------------------------------
const getStorage = (rememberMe) =>
  rememberMe ? localStorage : sessionStorage;

const storeTokens = (tokens, rememberMe) => {
  if (typeof window === 'undefined') return;
  const storage = getStorage(rememberMe);
  storage.setItem('access_token', tokens.access);
  storage.setItem('refresh_token', tokens.refresh);
  // Remember which storage we used so logout/refresh can find it
  localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('remember_me');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
};

const readToken = (key) => {
  if (typeof window === 'undefined') return null;
  
  const rememberMe = localStorage.getItem('remember_me');
  
  // If remember_me is explicitly 'true', use localStorage
  if (rememberMe === 'true') return localStorage.getItem(key);
  
  // Otherwise use sessionStorage
  return sessionStorage.getItem(key);
};
// ------------------------------------------------------------------
const AuthService = {

  // Login user
  // rememberMe: boolean — passed from the checkbox on the login page
  login: async (credentials, rememberMe = false) => {
    try {
      const response = await api.post('/api/v1/auth/login/', credentials);
      const { user, tokens } = response;

      storeTokens(tokens, rememberMe);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register a new user (landlord or partner)
  register: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/register/', credentials);
      const { user, tokens } = response;
      // New registrations always remember (they just signed up)
      storeTokens(tokens, true);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Partner login
  partnerLogin: async (credentials, rememberMe = false) => {
    try {
      const response = await api.post('/api/v1/auth/partner/login/', credentials);
      const { user, tokens } = response;
      storeTokens(tokens, rememberMe);
      return user;
    } catch (error) {
      console.error('Partner login error:', error);
      throw error;
    }
  },

  // Reset password — no auth required
  // Payload: { phone_number, new_password, confirm_password }
  // Backend: PasswordResetView → PasswordResetSerializer
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/api/v1/auth/password-reset/', resetData);
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Change password (authenticated user)
  changePassword: async (changeData) => {
    try {
      const response = await api.put('/api/v1/auth/password/change/', changeData);
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Log out — blacklist refresh token on backend, then clear local storage
  logout: async () => {
    try {
      const refreshToken = AuthService.getRefreshToken();
      if (refreshToken) {
        await api.post('/api/v1/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },

  // Validate referral code
  validateReferralCode: async (referralCode) => {
    try {
      const response = await api.get(`/api/v1/auth/referral/validate/${referralCode}/`);
      return response;
    } catch (error) {
      console.error('Referral validation error:', error);
      throw error;
    }
  },

  // Add referral code after registration
  addReferralCode: async (referralCode) => {
    try {
      const response = await api.post('/api/v1/auth/referral/add/', { referral_code: referralCode });
      return response;
    } catch (error) {
      console.error('Add referral code error:', error);
      throw error;
    }
  },

  // Get referral information for current user
  getReferralInfo: async () => {
    try {
      const response = await api.get('/api/v1/auth/referral/info/');
      return response;
    } catch (error) {
      console.error('Get referral info error:', error);
      throw error;
    }
  },

  // Check if user can add referral code
  checkReferralEligibility: async () => {
    try {
      const response = await api.get('/api/v1/auth/referral/eligibility/');
      return response;
    } catch (error) {
      console.error('Check referral eligibility error:', error);
      throw error;
    }
  },

  // Partner profile methods
  getPartnerProfile: async () => {
    try {
      return await api.get('/api/v1/auth/partner/profile/');
    } catch (error) {
      console.error('Get partner profile error:', error);
      throw error;
    }
  },

  updatePartnerProfile: async (profileData) => {
    try {
      return await api.put('/api/v1/auth/partner/profile/', profileData);
    } catch (error) {
      console.error('Update partner profile error:', error);
      throw error;
    }
  },

  getPartnerReferrals: async () => {
    try {
      return await api.get('/api/v1/auth/partner/referrals/');
    } catch (error) {
      console.error('Get partner referrals error:', error);
      throw error;
    }
  },

  getPartnerStatistics: async () => {
    try {
      return await api.get('/api/v1/auth/partner/statistics/');
    } catch (error) {
      console.error('Get partner statistics error:', error);
      throw error;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      return await api.get('/api/v1/auth/me/');
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  },

  // Check if user is authenticated (token present in either storage)
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!(
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token')
    );
  },

  getAccessToken: () => readToken('access_token'),
  getRefreshToken: () => readToken('refresh_token'),
};

export default AuthService;