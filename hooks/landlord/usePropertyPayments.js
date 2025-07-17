import { useState, useEffect, useCallback } from 'react';
import PaymentService from '@/services/landlord/payment';

export function usePropertyPayments(propertyId, initialFilters = {}) {
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalExpected: 0,
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0
  });
  const [unitBreakdown, setUnitBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchPropertyPayments = useCallback(async (currentFilters = filters) => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.getPropertyPayments(propertyId, currentFilters);
      
      if (response.success) {
        const stats = PaymentService.calculatePropertyStats(response);
        setPaymentStats(stats);
        
        setUnitBreakdown(response.unit_breakdown || []);
        
        const allPayments = response.unit_breakdown?.reduce((acc, unit) => {
          return acc.concat(unit.payments || []);
        }, []) || [];
        
        const formattedPayments = allPayments.map(PaymentService.formatPaymentForDisplay);
        setPayments(formattedPayments);
      } else {
        setPayments([]);
        setPaymentStats({
          totalExpected: 0,
          totalCollected: 0,
          outstanding: 0,
          collectionRate: 0
        });
        setUnitBreakdown([]);
      }
    } catch (err) {
      console.error('Error fetching property payments:', err);
      setError(err.message || 'Failed to fetch property payments');
      setPayments([]);
      setPaymentStats({
        totalExpected: 0,
        totalCollected: 0,
        outstanding: 0,
        collectionRate: 0
      });
      setUnitBreakdown([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const confirmPayment = useCallback(async (paymentId, action, rejectionReason = '') => {
    try {
      setError(null);
      
      const payment = payments.find(p => p.id === paymentId);
      const validation = PaymentService.validatePaymentConfirmation(payment, action, rejectionReason);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const response = await PaymentService.confirmPayment(paymentId, action, rejectionReason);
      
      if (response.success) {
        setPayments(prev => 
          prev.map(payment => 
            payment.id === paymentId 
              ? { 
                  ...payment, 
                  status: action === 'accept' ? 'confirmed' : 'rejected',
                  rejectionReason: action === 'reject' ? rejectionReason : payment.rejectionReason
                }
              : payment
          )
        );
        
        await fetchPropertyPayments();
        return response;
      } else {
        throw new Error(response.message || 'Failed to confirm payment');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Failed to confirm payment');
      throw err;
    }
  }, [payments, fetchPropertyPayments]);

  const getUpcomingPayments = useCallback(() => {
    const scheduleFilters = { propertyId, paidOnly: false };
    return PaymentService.getRentSchedule(scheduleFilters);
  }, [propertyId]);

  const getOverduePayments = useCallback(() => {
    const scheduleFilters = { propertyId, overdueOnly: true };
    return PaymentService.getRentSchedule(scheduleFilters);
  }, [propertyId]);

  const getRecentPayments = useCallback((limit = 10) => {
    return payments
      .filter(payment => ['completed', 'confirmed'].includes(payment.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }, [payments]);

  useEffect(() => {
    fetchPropertyPayments();
  }, [fetchPropertyPayments]);

  return {
    payments,
    paymentStats,
    unitBreakdown,
    loading,
    error,
    filters,
    updateFilters,
    confirmPayment,
    getUpcomingPayments,
    getOverduePayments,
    getRecentPayments,
    refetchPayments: fetchPropertyPayments
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

export function usePropertyPaymentAnalytics(propertyId, dateRange = null) {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    averagePayment: 0,
    paymentCount: 0,
    monthlyTrend: [],
    paymentsByStatus: {},
    paymentsByMethod: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateAnalytics = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const filters = { propertyId };
      if (dateRange) {
        filters.startDate = dateRange.startDate;
        filters.endDate = dateRange.endDate;
      }
      
      const response = await PaymentService.getPropertyPayments(propertyId, filters);
      
      if (response.success && response.unit_breakdown) {
        const allPayments = response.unit_breakdown.reduce((acc, unit) => {
          return acc.concat((unit.payments || []).map(PaymentService.formatPaymentForDisplay));
        }, []);
        
        const totalRevenue = PaymentService.calculateTotalRevenue(allPayments);
        const paymentCount = allPayments.length;
        const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;
        
        const paymentsByStatus = allPayments.reduce((acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        }, {});
        
        const paymentsByMethod = allPayments.reduce((acc, payment) => {
          acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
          return acc;
        }, {});
        
        const monthlyGroups = PaymentService.groupPaymentsByPeriod(allPayments, 'month');
        const monthlyTrend = Object.entries(monthlyGroups).map(([month, monthPayments]) => ({
          month,
          amount: PaymentService.calculateTotalRevenue(monthPayments),
          count: monthPayments.length
        })).sort((a, b) => a.month.localeCompare(b.month));
        
        setAnalytics({
          totalRevenue,
          averagePayment,
          paymentCount,
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
  }, [propertyId, dateRange]);

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