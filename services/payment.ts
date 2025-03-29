/**
 * Payment service for admin dashboard
 * Provides functionality for managing payments, transactions, subscriptions,
 * and generating payment reports
 */
import { api } from '@/lib/api';

// API base paths
const PAYMENTS_API_BASE = '/api/v1/payments';
const ADMIN_API_BASE = `${PAYMENTS_API_BASE}/admin`;

// Define more specific types for previously 'any' typed objects
export interface PaymentMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SubscriptionFeature {
  [key: string]: string | number | boolean | null | undefined;
}

export interface PaymentDataDetails {
  [key: string]: string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined>;
}

// Payment types
export interface Transaction {
  id: number;
  transaction_id: string;
  external_id: string;
  user: {
    id: number;
    name: string;
    phone_number: string;
  };
  amount: number;
  provider: string;
  account_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  payment_data?: PaymentDataDetails;
  error_message?: string;
}

export interface TransactionDetail extends Transaction {
  callbacks: Array<{
    id: number;
    msisdn: string;
    amount: number;
    reference: string;
    utilityref: string;
    status: string;
    message: string;
    provider: string;
    created_at: string;
  }>;
  payment_records: Array<{
    id: number;
    amount: number;
    payment_type: string;
    status: string;
    payer: string;
    recipient: string | null;
    created_at: string;
  }>;
}

export interface PaymentSummary {
  total_completed: {
    count: number;
    amount: number;
  };
  total_pending: {
    count: number;
    amount: number;
  };
  total_failed: {
    count: number;
    amount: number;
  };
}

export interface PaymentAnalytics {
  summary: PaymentSummary;
  recent_transactions: Transaction[];
  daily_totals: Array<{
    date: string;
    total: number;
    count: number;
  }>;
  payment_methods: Array<{
    provider: string;
    total: number;
    count: number;
  }>;
}

// Subscription Plan type
export interface SubscriptionPlan {
  id?: number;
  name: string;
  plan_type: 'basic' | 'premium' | 'enterprise';
  duration: 'monthly' | 'quarterly' | 'annual';
  price: number;
  property_limit: number;
  description: string;
  is_active: boolean;
  features: Record<string, string | number | boolean | null | undefined>;
  created_at?: string;
}

// Subscription type
export interface Subscription {
  id: number;
  landlord: {
    id: number;
    name: string;
    phone_number: string;
  } | null;
  plan: {
    id: number;
    name: string;
    price: number;
    plan_type: string;
  };
  status: string;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
  days_remaining: number | null;
}

export interface RevenueReport {
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
  };
  time_series: Array<{
    period: string;
    total: number;
    count: number;
  }>;
  provider_breakdown: Array<{
    provider: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  payment_type_breakdown: Array<{
    payment_type: string;
    total: number;
    count: number;
    percentage: number;
  }>;
}

// Subscription Report type
export interface SubscriptionReport {
  summary: {
    total_active_subscriptions: number;
    monthly_recurring_revenue: number;
    upcoming_renewals_30d: number;
  };
  subscriptions_by_plan: Array<{
    plan: string;
    count: number;
  }>;
  auto_renew_breakdown: Array<{
    auto_renew: boolean;
    count: number;
  }>;
  upcoming_renewals: Array<{
    id: number;
    landlord: string;
    plan: string;
    end_date: string;
    days_remaining: number | null;
  }>;
}

// Paginated response type
export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransactionUpdateRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CreatePlanRequest {
  name: string;
  plan_type: 'basic' | 'premium' | 'enterprise';
  duration: 'monthly' | 'quarterly' | 'annual';
  price: number;
  property_limit: number;
  description: string;
  is_active?: boolean;
  features?: SubscriptionFeature;
}

export interface ReconcileTransactionRequest {
  payment_type: 'rent' | 'subscription' | 'deposit' | 'other';
  payer_id: number;
  recipient_id?: number;
  property_id?: number;
  payment_period_start?: string;
  payment_period_end?: string;
  notes?: string;
  metadata?: PaymentMetadata;
  subscription_id?: number;
  rent_payment_id?: number;
}

export interface CheckoutDetails {
  [key: string]: string | number | boolean | undefined | null | Array<string | number | boolean | undefined | null>;
}

export interface CheckoutResponse {
  message: string;
  transaction_id: string;
  external_id: string;
  status: string;
  details: CheckoutDetails;
}

// Add these new interfaces for the financial reports

export interface TrialBalanceAccount {
  account_name: string;
  account_code: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  report_period: {
    from_date: string;
    to_date: string;
  };
  accounts: {
    assets: TrialBalanceAccount[];
    liabilities: TrialBalanceAccount[];
    equity: TrialBalanceAccount[];
    revenue: TrialBalanceAccount[];
    expenses: TrialBalanceAccount[];
  };
  totals: {
    debit_total: number;
    credit_total: number;
  };
  is_balanced: boolean;
}

export interface ProfitLossItem {
  name: string;
  amount: number;
  percentage?: number;
}

export interface ProfitLossReport {
  report_period: {
    from_date: string;
    to_date: string;
  };
  revenue: {
    items: ProfitLossItem[];
    total: number;
  };
  expenses: {
    items: ProfitLossItem[];
    total: number;
  };
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
  comparison?: {
    period: {
      from_date: string;
      to_date: string;
    };
    summary: {
      total_revenue: number;
      total_expenses: number;
      net_profit: number;
      profit_margin: number;
    };
    changes: {
      revenue_change: {
        amount: number;
        percentage: number;
      };
      expenses_change: {
        amount: number;
        percentage: number;
      };
      profit_change: {
        amount: number;
        percentage: number;
      };
    };
  };
}

export interface ExpenseItem {
  category: string;
  vendor: string;
  amount: number;
  date: string;
  description: string;
}

export interface ExpensesReport {
  report_period: {
    from_date: string;
    to_date: string;
  };
  total_expenses: number;
  grouped_by: string;
  expenses: {
    [key: string]: {
      total: number;
      items?: ExpenseItem[];
    };
  };
}

// =========================================
// Payment Service
// =========================================

/**
 * Service for payment operations
 * Provides functions for payment dashboard and system-wide payment management
 */
const PaymentService = {
  /**
   * Get payment analytics for the admin dashboard
   * @returns Promise with payment analytics data
   */
  getPaymentAnalytics: async (): Promise<PaymentAnalytics> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/dashboard`);
      return response.data;
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    throw error;
  }
  },

  /**
   * Get transactions with optional filtering
   * @param params Optional filter parameters
   * @returns Promise with paginated transactions
   */
  getTransactions: async (params?: {
    page?: number;
    page_size?: number;
  status?: string;
  provider?: string;
  from_date?: string;
  to_date?: string;
    search?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/transactions`, { params });
      return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
  },

/**
   * Get detailed information about a specific transaction
   * @param transactionId Transaction ID
 * @returns Promise with transaction details
 */
  getTransactionDetail: async (transactionId: number): Promise<TransactionDetail> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/transactions/${transactionId}`);
      return response.data;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
  },

/**
 * Update a transaction's status
   * @param transactionId Transaction ID
   * @param status New status
 * @returns Promise with updated transaction
 */
  updateTransactionStatus: async (transactionId: number, status: string): Promise<Transaction> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/transactions/${transactionId}/update-status`, { status });
      return response.data.transaction;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
  },

  /**
   * Delete a transaction
   * @param transactionId Transaction ID
   * @returns Promise with success message
   */
  deleteTransaction: async (transactionId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/transactions/${transactionId}/delete`);
      return response.data;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  /**
   * Get all subscription plans
   * @returns Promise with subscription plans
   */
  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/subscription-plans`);
      return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
  },

/**
 * Create a new subscription plan
   * @param plan Plan data
 * @returns Promise with created plan
 */
  createSubscriptionPlan: async (plan: SubscriptionPlan): Promise<SubscriptionPlan> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/subscription-plans/create`, plan);
      return response.data;
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    throw error;
  }
  },

  /**
   * Update an existing subscription plan
   * @param planId Plan ID
   * @param plan Updated plan data
   * @returns Promise with updated plan
   */
  updateSubscriptionPlan: async (planId: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/subscription-plans/${planId}/update`, plan);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  },

  /**
   * Delete a subscription plan
   * @param planId Plan ID
   * @returns Promise with success message
   */
  deleteSubscriptionPlan: async (planId: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/subscription-plans/${planId}/delete`);
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      throw error;
    }
  },

  /**
   * Get user subscriptions with optional filtering
   * @param params Optional filter parameters
   * @returns Promise with paginated subscriptions
   */
  getUserSubscriptions: async (params?: {
  page?: number;
  page_size?: number;
    status?: string;
    plan?: string;
  }): Promise<PaginatedResponse<Subscription>> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/subscriptions`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  },

  /**
   * Update a subscription
   * @param subscriptionId Subscription ID
   * @param data Updated subscription data
   * @returns Promise with updated subscription
   */
  updateSubscription: async (subscriptionId: number, data: {
    status?: string;
    end_date?: string;
    auto_renew?: boolean;
  }): Promise<Subscription> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/subscriptions/${subscriptionId}/update`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  /**
   * Delete a subscription
   * @param subscriptionId Subscription ID
   * @returns Promise with success message
   */
  deleteSubscription: async (subscriptionId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${ADMIN_API_BASE}/subscriptions/${subscriptionId}/delete`);
      return response.data;
  } catch (error) {
      console.error('Error deleting subscription:', error);
    throw error;
  }
  },

  /**
   * Get subscription report
   * @returns Promise with subscription report
   */
  getSubscriptionReport: async (): Promise<SubscriptionReport> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/reports/subscriptions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription report:', error);
      throw error;
    }
  },

  /**
   * Get transactions that need reconciliation
   * @param params Query parameters for filtering
   * @returns Promise with paginated unreconciled transaction list
   */
  getUnreconciledTransactions: async (params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedResponse<Transaction>> => {
    try {
      const response = await api.get(`${PAYMENTS_API_BASE}/admin/reconciliation/unreconciled`, { params });
      return response.data;
  } catch (error) {
    console.error('Error fetching unreconciled transactions:', error);
    throw error;
  }
  },

/**
 * Reconcile a transaction manually
 * @param transactionId Transaction ID to reconcile
 * @param reconcileData Reconciliation data
 * @returns Promise with reconciliation result
 */
  reconcileTransaction: async (
  transactionId: number, 
  reconcileData: ReconcileTransactionRequest
  ): Promise<{ message: string; payment_id: number }> => {
    try {
      const response = await api.post(
        `${PAYMENTS_API_BASE}/admin/reconciliation/${transactionId}`, 
        reconcileData
      );
      return response.data;
  } catch (error) {
    console.error('Error reconciling transaction:', error);
    throw error;
  }
  },

/**
 * Generate revenue report with filtering by date range
 * @param params Query parameters for filtering
 * @returns Promise with revenue report
 */
  getRevenueReport: async (params: {
  from_date: string;
  to_date: string;
  group_by?: 'day' | 'week' | 'month';
  }): Promise<RevenueReport> => {
  try {
    if (!params.from_date || !params.to_date) {
      throw new Error('from_date and to_date are required');
    }
    
      const response = await api.get(`${PAYMENTS_API_BASE}/admin/reports/revenue`, { params });
      return response.data;
  } catch (error) {
    console.error('Error generating revenue report:', error);
    throw error;
  }
  },

/**
 * Process mobile money checkout for a user
 * @param checkoutData Checkout data
 * @returns Promise with checkout result
 */
  processMobileMoneyCheckout: async (checkoutData: {
  accountNumber: string;
  amount: number;
  provider: string;
  }): Promise<CheckoutResponse> => {
    try {
      const response = await api.post(`${PAYMENTS_API_BASE}/azampay/mno/checkout`, checkoutData);
      return response.data;
  } catch (error) {
    console.error('Error processing mobile money checkout:', error);
    throw error;
  }
  },

/**
 * Process bank checkout for a user
 * @param checkoutData Checkout data
 * @returns Promise with checkout result
 */
  processBankCheckout: async (checkoutData: {
  amount: number;
  provider: string;
  account_number: string;
  otp: string;
}): Promise<{
  message: string;
  transaction_id: string;
  external_id: string;
  }> => {
    try {
      const response = await api.post(`${PAYMENTS_API_BASE}/azampay/bank/checkout`, checkoutData);
      return response.data;
  } catch (error) {
    console.error('Error processing bank checkout:', error);
    throw error;
  }
  },

/**
 * Process web checkout for a user
 * @param checkoutData Checkout data
 * @returns Promise with checkout result including redirect URL
 */
  processWebCheckout: async (checkoutData: {
  amount: number;
  provider: string;
  customer_email: string;
}): Promise<{
  message: string;
  redirect_url: string;
  }> => {
    try {
      const response = await api.post(`${PAYMENTS_API_BASE}/azampay/webcheckout`, checkoutData);
      return response.data;
  } catch (error) {
    console.error('Error processing web checkout:', error);
    throw error;
  }
  },

  /**
   * Get detailed information about a specific subscription
   * @param subscriptionId Subscription ID
   * @returns Promise with subscription details
   */
  getSubscriptionDetail: async (subscriptionId: number): Promise<Subscription & {
    payment_history: Array<{
      id: number;
      amount: number;
  status: string;
      created_at: string;
    }>;
  }> => {
    try {
      const response = await api.get(`${ADMIN_API_BASE}/subscriptions/${subscriptionId}`);
      return response.data;
  } catch (error) {
      console.error('Error fetching subscription details:', error);
    throw error;
  }
},

/**
 * Generate trial balance report
 * @param params Query parameters for filtering
 * @returns Promise with trial balance report
 */
getTrialBalanceReport: async (params: {
  from_date: string;
  to_date: string;
}): Promise<TrialBalanceReport> => {
  try {
    if (!params.from_date || !params.to_date) {
      throw new Error('from_date and to_date are required');
    }
    
    const response = await api.get(`${PAYMENTS_API_BASE}/admin/reports/trial-balance`, { params });
    return response.data;
  } catch (error) {
    console.error('Error generating trial balance report:', error);
    throw error;
  }
},

/**
 * Generate profit and loss report
 * @param params Query parameters for filtering
 * @returns Promise with profit and loss report
 */
getProfitLossReport: async (params: {
  from_date: string;
  to_date: string;
  compare_previous?: boolean;
}): Promise<ProfitLossReport> => {
  try {
    if (!params.from_date || !params.to_date) {
      throw new Error('from_date and to_date are required');
    }
    
    const response = await api.get(`${PAYMENTS_API_BASE}/admin/reports/profit-loss`, { params });
    return response.data;
  } catch (error) {
    console.error('Error generating profit and loss report:', error);
    throw error;
  }
},

/**
 * Generate expenses report
 * @param params Query parameters for filtering
 * @returns Promise with expenses report
 */
getExpensesReport: async (params: {
  from_date: string;
  to_date: string;
  group_by?: 'category' | 'vendor' | 'date';
}): Promise<ExpensesReport> => {
  try {
    if (!params.from_date || !params.to_date) {
      throw new Error('from_date and to_date are required');
    }
    
    const response = await api.get(`${PAYMENTS_API_BASE}/admin/reports/expenses`, { params });
    return response.data;
  } catch (error) {
    console.error('Error generating expenses report:', error);
    throw error;
  }
}
};

export default PaymentService;