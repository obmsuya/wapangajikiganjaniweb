// services/auth.js - Updated with referral support
import api from '@/lib/api/api-client';

const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login/', credentials);
      const { user, tokens } = response;
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      
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
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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

  // Get partner profile (for partners)
  getPartnerProfile: async () => {
    try {
      const response = await api.get('/api/v1/auth/partner/profile/');
      return response;
    } catch (error) {
      console.error('Get partner profile error:', error);
      throw error;
    }
  },

  // Update partner profile
  updatePartnerProfile: async (profileData) => {
    try {
      const response = await api.put('/api/v1/auth/partner/profile/', profileData);
      return response;
    } catch (error) {
      console.error('Update partner profile error:', error);
      throw error;
    }
  },

  // Get partner referrals
  getPartnerReferrals: async () => {
    try {
      const response = await api.get('/api/v1/auth/partner/referrals/');
      return response;
    } catch (error) {
      console.error('Get partner referrals error:', error);
      throw error;
    }
  },

  // Get partner statistics
  getPartnerStatistics: async () => {
    try {
      const response = await api.get('/api/v1/auth/partner/statistics/');
      return response;
    } catch (error) {
      console.error('Get partner statistics error:', error);
      throw error;
    }
  },

  // Log out user
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/v1/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  },

  // Reset password
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/api/v1/auth/password-reset/', resetData);
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (changeData) => {
    try {
      const response = await api.put('/api/v1/auth/password/change/', changeData);
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/v1/auth/me/');
      return response;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  // Get stored access token
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  // Get stored refresh token
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
};

export default AuthService;