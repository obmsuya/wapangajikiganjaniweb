// hooks/landlord/useSubscription.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import SubscriptionService from '@/services/landlord/subscription';

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.getSubscriptionPlans();
      const formattedPlans = Array.isArray(response) 
        ? response.map(SubscriptionService.formatPlanForDisplay)
        : [];
      
      setPlans(formattedPlans);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError(err.message || 'Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetchPlans: fetchPlans
  };
}

export function useCurrentSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.getCurrentSubscription();
      const formattedSubscription = SubscriptionService.formatSubscriptionForDisplay(response);
      
      setSubscription(formattedSubscription);
    } catch (err) {
      console.error('Error fetching current subscription:', err);
      setError(err.message || 'Failed to fetch current subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.cancelSubscription();
      
      // Refresh current subscription after cancellation
      await fetchCurrentSubscription();
      
      return response;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentSubscription]);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  return {
    subscription,
    loading,
    error,
    cancelSubscription,
    refetchSubscription: fetchCurrentSubscription
  };
}

export function useSubscriptionStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.getSubscriptionStatus();
      setStatus(response);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err.message || 'Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetchStatus: fetchStatus
  };
}

export function useSubscriptionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.getSubscriptionHistory();
      const formattedHistory = Array.isArray(response) 
        ? response.map(SubscriptionService.formatSubscriptionForDisplay)
        : [];
      
      setHistory(formattedHistory);
    } catch (err) {
      console.error('Error fetching subscription history:', err);
      setError(err.message || 'Failed to fetch subscription history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetchHistory: fetchHistory
  };
}

export function usePropertyVisibility() {
  const [propertyVisibility, setPropertyVisibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertyVisibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.getPropertyVisibility();
      setPropertyVisibility(response);
    } catch (err) {
      console.error('Error fetching property visibility:', err);
      setError(err.message || 'Failed to fetch property visibility');
    } finally {
      setLoading(false);
    }
  }, []);

  const upgradeProperty = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.upgradeProperty(propertyId);
      
      // Refresh property visibility after upgrade
      await fetchPropertyVisibility();
      
      return response;
    } catch (err) {
      console.error('Error upgrading property:', err);
      setError(err.message || 'Failed to upgrade property');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPropertyVisibility]);

  useEffect(() => {
    fetchPropertyVisibility();
  }, [fetchPropertyVisibility]);

  return {
    propertyVisibility,
    loading,
    error,
    upgradeProperty,
    refetchPropertyVisibility: fetchPropertyVisibility
  };
}

export function useSubscriptionCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCheckout = useCallback(async (planId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.generateSubscriptionCheckout(planId);
      return response;
    } catch (err) {
      console.error('Error generating checkout:', err);
      setError(err.message || 'Failed to generate checkout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processMNOPayment = useCallback(async (planId, accountNumber, provider) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.processSubscriptionMNOPayment(
        planId, 
        accountNumber, 
        provider
      );
      return response;
    } catch (err) {
      console.error('Error processing MNO payment:', err);
      setError(err.message || 'Failed to process MNO payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processBankPayment = useCallback(async (planId, accountNumber, bankName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.processSubscriptionBankPayment(
        planId, 
        accountNumber, 
        bankName
      );
      return response;
    } catch (err) {
      console.error('Error processing bank payment:', err);
      setError(err.message || 'Failed to process bank payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (planId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SubscriptionService.subscribeToplan(planId);
      return response;
    } catch (err) {
      console.error('Error subscribing to plan:', err);
      setError(err.message || 'Failed to subscribe to plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateCheckout,
    processMNOPayment,
    processBankPayment,
    subscribe
  };
}