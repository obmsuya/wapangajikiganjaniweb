"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api/api-client";

/**
 * Hook for fetching revenue analytics data
 * @param {Object} initialParams - Initial parameters for analytics (period, year, month)
 * @returns {Object} The analytics data, loading state, error, and helper functions
 */
export function useRevenueAnalytics(initialParams = null) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  // Skip request if params is null (useful for comparison where we may not want data)
  const shouldFetch = params !== null;

  /**
   * Fetch analytics data based on current parameters
   */
  const fetchAnalytics = useCallback(async () => {
    if (!shouldFetch) return;

    try {
      setLoading(true);

      // Build query string from params
      const queryParams = new URLSearchParams();

      // Fix: Change 'monthly' to 'month' for the period parameter
      const adjustedParams = { ...params };
      if (adjustedParams.period === "monthly") {
        adjustedParams.period = "month";
      }

      Object.entries(adjustedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `/api/v1/payments/admin/revenue-analytics/?${queryString}`
        : "/api/v1/payments/admin/revenue-analytics/";

      const response = await api.get(endpoint);

      setAnalytics(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching revenue analytics:", err);
      setError(err);

      // Provide default data structure on error
      setAnalytics({
        total_revenue: 0,
        subscription_revenue: 0,
        rent_revenue: 0,
        transaction_counts: { total: 0, subscription: 0, rent: 0 },
        months: [],
        plan_breakdown: [],
      });
    } finally {
      setLoading(false);
    }
  }, [params, shouldFetch]);

  /**
   * Update params and refetch data
   * @param {Object} newParams - New parameters to set
   */
  const updateParams = useCallback((newParams) => {
    // Fix: Ensure we convert 'monthly' to 'month' if it's being set
    const adjustedParams = { ...newParams };
    if (adjustedParams.period === "monthly") {
      adjustedParams.period = "month";
    }

    setParams((prev) => ({
      ...prev,
      ...adjustedParams,
    }));
  }, []);

  /**
   * Refresh analytics data
   */
  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    if (shouldFetch) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, shouldFetch]);

  return {
    analytics,
    loading,
    error,
    params,
    updateParams,
    refreshAnalytics,
  };
}

/**
 * Hook for fetching transaction history
 * @param {Object} initialFilters - Initial filters for transactions
 * @returns {Object} The transaction data, loading state, error, and helper functions
 */
export function useTransactionHistory(initialFilters = {}) {
  const [transactions, setTransactions] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /**
   * Fetch transaction history based on current filters and pagination
   */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // Build query string from filters and pagination
      const queryParams = new URLSearchParams();

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      // Add pagination
      queryParams.append("page", page);
      queryParams.append("page_size", pageSize);

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/payments/admin/transactions/?${queryString}`;

      const response = await api.get(endpoint);

      setTransactions({ results: response, total: response.length });
      setError(null);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError(err);

      // Set empty data on error
      setTransactions({ results: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  /**
   * Update filters and reset pagination
   * @param {Object} newFilters - New filters to set
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Update pagination
   * @param {number} newPage - New page number
   * @param {number} newPageSize - New page size
   */
  const updatePagination = useCallback(
    (newPage, newPageSize = pageSize) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [pageSize]
  );

  /**
   * Refresh transaction data
   */
  const refreshTransactions = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions: transactions.results || [],
    totalTransactions: transactions.total || 0,
    currentPage: page,
    pageSize,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    refreshTransactions,
  };
}

/**
 * Hook for fetching subscription plans
 * @returns {Object} The subscription plans data, loading state, error, and helper functions
 */
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch subscription plans
   */
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/api/v1/payments/admin/subscription-plans/"
      );

      setPlans(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
      setError(err);

      // Set empty data on error
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new subscription plan
   * @param {Object} planData - The plan data
   */
  const createPlan = useCallback(
    async (planData) => {
      try {
        setLoading(true);

        const response = await api.post(
          "/api/v1/payments/admin/subscription-plans/",
          planData
        );

        await fetchPlans(); // Refresh the plans list
        return response;
      } catch (err) {
        console.error("Error creating subscription plan:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans]
  );

  /**
   * Update a subscription plan
   * @param {Object} planData - The updated plan data
   */
  const updatePlan = useCallback(
    async (planData) => {
      try {
        setLoading(true);

        const response = await api.put(
          "/api/v1/payments/admin/subscription-plans/",
          planData
        );

        await fetchPlans(); // Refresh the plans list
        return response;
      } catch (err) {
        console.error("Error updating subscription plan:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans]
  );

  /**
   * Delete a subscription plan
   * @param {string|number} planId - The ID of the plan to delete
   */
  const deletePlan = useCallback(
    async (planId) => {
      try {
        setLoading(true);

        const response = await api.delete(
          `/api/v1/payments/admin/subscription-plans/?id=${planId}`
        );

        await fetchPlans(); // Refresh the plans list
        return response;
      } catch (err) {
        console.error("Error deleting subscription plan:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans]
  );

  // Initial fetch
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refreshPlans: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
}

/**
 * Hook for fetching landlord subscriptions
 * @param {Object} initialFilters - Initial filters
 * @returns {Object} The landlord subscriptions data, loading state, error, and helper functions
 */
export function useLandlordSubscriptions(initialFilters = {}) {
  const [subscriptions, setSubscriptions] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /**
   * Fetch landlord subscriptions based on current filters and pagination
   */
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);

      // Build query string from filters and pagination
      const queryParams = new URLSearchParams();

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      // Add pagination
      queryParams.append("page", page);
      queryParams.append("page_size", pageSize);

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/payments/admin/subscriptions/?${queryString}`;

      const response = await api.get(endpoint);

      setSubscriptions(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching landlord subscriptions:", err);
      setError(err);

      // Set empty data on error
      setSubscriptions({ results: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  /**
   * Update filters and reset pagination
   * @param {Object} newFilters - New filters to set
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Update pagination
   * @param {number} newPage - New page number
   * @param {number} newPageSize - New page size
   */
  const updatePagination = useCallback(
    (newPage, newPageSize = pageSize) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [pageSize]
  );

  /**
   * Update a landlord's subscription
   * @param {Object} subscriptionData - Data containing landlord_id and plan_id
   */
  const updateLandlordSubscription = useCallback(
    async (subscriptionData) => {
      try {
        setLoading(true);

        const response = await api.post(
          "/api/v1/payments/admin/subscriptions/",
          subscriptionData
        );

        await fetchSubscriptions(); // Refresh the list
        return response;
      } catch (err) {
        console.error("Error updating landlord subscription:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSubscriptions]
  );

  /**
   * Refresh subscriptions data
   */
  const refreshSubscriptions = useCallback(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions: subscriptions.results || [],
    totalSubscriptions: subscriptions.total || 0,
    currentPage: page,
    pageSize,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    updateLandlordSubscription,
    refreshSubscriptions,
  };
}

/**
 * Hook for fetching failed payments
 * @param {number} limit - Maximum number of failed payments to fetch
 * @returns {Object} The failed payments data, loading state, error, and refresh function
 */
export function useFailedPayments(limit = 50) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch failed payments
   */
  const fetchFailedPayments = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = `/api/v1/payments/admin/failed-payments/?limit=${limit}`;
      const response = await api.get(endpoint);

      setPayments(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching failed payments:", err);
      setError(err);

      // Provide empty data on error
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Refresh failed payments data
   */
  const refreshPayments = useCallback(() => {
    fetchFailedPayments();
  }, [fetchFailedPayments]);

  // Initial fetch
  useEffect(() => {
    fetchFailedPayments();
  }, [fetchFailedPayments]);

  return {
    payments,
    loading,
    error,
    refreshPayments,
  };
}

/**
 * Hook for fetching a single transaction's details
 * @param {string|number} transactionId - The ID of the transaction
 * @returns {Object} The transaction details, loading state, error, and refresh function
 */
export function useTransactionDetails(transactionId) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch transaction details
   */
  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);

      const endpoint = `/api/v1/payments/admin/transactions/${transactionId}/`;
      const response = await api.get(endpoint);

      setTransaction(response);
      setError(null);
    } catch (err) {
      console.error(
        `Error fetching transaction details for ID ${transactionId}:`,
        err
      );
      setError(err);

      // Provide null data on error
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  /**
   * Refresh transaction details
   */
  const refreshTransaction = useCallback(() => {
    fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  // Initial fetch
  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [fetchTransactionDetails, transactionId]);

  return {
    transaction,
    loading,
    error,
    refreshTransaction,
  };
}

/**
 * Hook for fetching subscription statistics
 * @returns {Object} The subscription statistics, loading state, error, and refresh function
 */
export function useSubscriptionStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch subscription statistics
   */
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = "/api/v1/payments/admin/subscription-statistics/";
      const response = await api.get(endpoint);

      setStatistics(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription statistics:", err);
      setError(err);

      // Provide null data on error
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh statistics data
   */
  const refreshStatistics = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStatistics,
  };
}

/**
 * Hook for fetching payment history for a specific landlord
 * @param {string|number} landlordId - The ID of the landlord
 * @returns {Object} The landlord's payment history, loading state, error, and refresh function
 */
export function useLandlordPaymentHistory(landlordId) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentHistory = useCallback(async () => {
    if (!landlordId) return;

    try {
      setLoading(true);

      const endpoint = `/api/v1/payments/admin/landlord/${landlordId}/payment-history/`;
      const response = await api.get(endpoint);

      setHistory(response);
      setError(null);
    } catch (err) {
      console.error(
        `Error fetching payment history for landlord ${landlordId}:`,
        err
      );
      setError(err);

      // Provide default data structure on error
      setHistory({
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [landlordId]);

  const refreshHistory = useCallback(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  // Initial fetch
  useEffect(() => {
    if (landlordId) {
      fetchPaymentHistory();
    }
  }, [fetchPaymentHistory, landlordId]);

  return {
    history,
    loading,
    error,
    refreshHistory,
  };
}
