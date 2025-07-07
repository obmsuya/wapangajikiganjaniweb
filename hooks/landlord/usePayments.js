// hooks/landlord/usePayments.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import PaymentService from '@/services/landlord/payment';

export function useRentPayments(initialFilters = {}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchPayments = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersWithPagination = {
        ...currentFilters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await PaymentService.getRentPayments(filtersWithPagination);
      
      if (response.success && Array.isArray(response.payments)) {
        const formattedPayments = response.payments.map(PaymentService.formatPaymentForDisplay);
        setPayments(formattedPayments);
        
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total || response.total_count || 0,
            totalPages: response.pagination.totalPages || Math.ceil((response.total_count || 0) / prev.limit)
          }));
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching rent payments:', err);
      setError(err.message || 'Failed to fetch rent payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const confirmPayment = useCallback(async (paymentId, action, rejectionReason = '') => {
    try {
      setError(null);
      
      const validation = PaymentService.validatePaymentConfirmation(
        payments.find(p => p.id === paymentId),
        action,
        rejectionReason
      );
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const response = await PaymentService.confirmPayment(paymentId, action, rejectionReason);
      
      if (response.success) {
        // Update the payment in the local state
        setPayments(prev => 
          prev.map(payment => 
            payment.id === paymentId 
              ? { 
                  ...payment, 
                  status: action === 'accept' ? 'confirmed' : 'rejected',
                  rejectionReason: action === 'reject' ? rejectionReason : ''
                }
              : payment
          )
        );
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to confirm payment');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Failed to confirm payment');
      throw err;
    }
  }, [payments]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    changePage,
    confirmPayment,
    refetchPayments: fetchPayments
  };
}

export function usePaymentSummary(dateRange = null) {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.getPaymentSummary(startDate, endDate);
      setSummary(response);
    } catch (err) {
      console.error('Error fetching payment summary:', err);
      setError(err.message || 'Failed to fetch payment summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSummary = useCallback((startDate = null, endDate = null) => {
    fetchSummary(startDate, endDate);
  }, [fetchSummary]);

  useEffect(() => {
    if (dateRange) {
      fetchSummary(dateRange.startDate, dateRange.endDate);
    } else {
      fetchSummary();
    }
  }, [fetchSummary, dateRange]);

  return {
    summary,
    loading,
    error,
    refreshSummary
  };
}

export function useRentSchedule(initialFilters = {}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchSchedules = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.getRentSchedule(currentFilters);
      
      if (response.success && Array.isArray(response.schedules)) {
        setSchedules(response.schedules);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error fetching rent schedules:', err);
      setError(err.message || 'Failed to fetch rent schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    filters,
    updateFilters,
    refetchSchedules: fetchSchedules
  };
}

export function useLandlordWallet() {
  const [wallet, setWallet] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.getLandlordWallet();
      setWallet(response);
    } catch (err) {
      console.error('Error fetching landlord wallet:', err);
      setError(err.message || 'Failed to fetch wallet information');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestWithdrawal = useCallback(async (amount, withdrawalMethod, recipientDetails) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.requestWalletWithdrawal(
        amount, 
        withdrawalMethod, 
        recipientDetails
      );
      
      if (response.success) {
        // Refresh wallet after successful withdrawal request
        await fetchWallet();
        return response;
      } else {
        throw new Error(response.message || 'Failed to request withdrawal');
      }
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      setError(err.message || 'Failed to request withdrawal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    wallet,
    loading,
    error,
    requestWithdrawal,
    refetchWallet: fetchWallet
  };
}

export function usePropertyPaymentSettings(propertyId) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.getPropertyPaymentSettings(propertyId);
      setSettings(response);
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      setError(err.message || 'Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const updateSettings = useCallback(async (newSettings) => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.updatePropertyPaymentSettings(propertyId, newSettings);
      
      if (response.success) {
        setSettings(newSettings);
        return response;
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating payment settings:', err);
      setError(err.message || 'Failed to update payment settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetchSettings: fetchSettings
  };
}

export function usePaymentAnalytics(dateRange = null) {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    averagePayment: 0,
    paymentCount: 0,
    rejectionRate: 0,
    monthlyTrend: [],
    paymentsByStatus: {},
    paymentsByMethod: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [paymentsResponse, summaryResponse] = await Promise.all([
        PaymentService.getRentPayments(dateRange ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000 // Get more data for analytics
        } : { limit: 1000 }),
        PaymentService.getPaymentSummary(
          dateRange?.startDate,
          dateRange?.endDate
        )
      ]);
      
      if (paymentsResponse.success && paymentsResponse.payments) {
        const payments = paymentsResponse.payments.map(PaymentService.formatPaymentForDisplay);
        
        const totalRevenue = PaymentService.calculateTotalRevenue(payments);
        const paymentCount = payments.length;
        const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;
        
        const paymentsByStatus = payments.reduce((acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        }, {});
        
        const paymentsByMethod = payments.reduce((acc, payment) => {
          acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
          return acc;
        }, {});
        
        const monthlyGroups = PaymentService.groupPaymentsByPeriod(payments, 'month');
        const monthlyTrend = Object.entries(monthlyGroups).map(([month, monthPayments]) => ({
          month,
          amount: PaymentService.calculateTotalRevenue(monthPayments),
          count: monthPayments.length
        })).sort((a, b) => a.month.localeCompare(b.month));
        
        setAnalytics({
          totalRevenue,
          averagePayment,
          paymentCount,
          rejectionRate: summaryResponse.rejection_rate || 0,
          monthlyTrend,
          paymentsByStatus,
          paymentsByMethod
        });
      }
    } catch (err) {
      console.error('Error calculating payment analytics:', err);
      setError(err.message || 'Failed to calculate analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics: calculateAnalytics
  };
}