// services/landlord/billing.js
import api from '@/lib/api/api-client';
import AuthService from '@/services/auth';

const BILLING_SESSION_KEY = 'billing_session';
const SUBSCRIPTION_PATH = '/api/v1/payments/subscription';

const getBillingSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem(BILLING_SESSION_KEY));
  } catch {
    return null;
  }
};

// A billing link token has no refresh token, so its requests must never enter the refresh flow.
// Without a billing session the tab's full landlord session is used, with the normal refresh.
const getRequestOptions = () => {
  const billingSession = getBillingSession();
  if (!billingSession) return {};
  return { accessToken: billingSession.access, skipAuthRefresh: true };
};

const BillingService = {
  getBillingSession,

  saveBillingSession: ({ access, user, expiresInSeconds }) => {
    const billingSession = {
      access,
      user,
      expires_at: Date.now() + expiresInSeconds * 1000,
    };
    sessionStorage.setItem(BILLING_SESSION_KEY, JSON.stringify(billingSession));
  },

  clearBillingSession: () => {
    sessionStorage.removeItem(BILLING_SESSION_KEY);
  },

  isBillingSessionExpired: (billingSession) => billingSession.expires_at <= Date.now(),

  getSignedInLandlord: () => {
    const user = AuthService.getCurrentUserFromToken();
    return user?.user_type === 'landlord' ? user : null;
  },

  isSessionEndedError: (error) => error?.status === 401 || error?.data?.code === 'billing_scope',

  getPlans: () => api.get(`${SUBSCRIPTION_PATH}/plans/`, getRequestOptions()),

  getSubscriptionStatus: () => api.get(`${SUBSCRIPTION_PATH}/status/`, getRequestOptions()),

  getCurrentSubscription: async () => {
    try {
      return await api.get(`${SUBSCRIPTION_PATH}/current/`, getRequestOptions());
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },

  startMobileMoneyCheckout: ({ planId, accountNumber, provider }) =>
    api.post(
      `${SUBSCRIPTION_PATH}/mno/checkout/`,
      { plan_id: planId, accountNumber, provider },
      getRequestOptions(),
    ),

  getTransactionStatus: (transactionId) =>
    api.get(`${SUBSCRIPTION_PATH}/transaction-status/${encodeURIComponent(transactionId)}/`, getRequestOptions()),
};

export default BillingService;
