'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import AdminPartnerService from '@/services/admin/admin-partner';

/**
 * Hook for fetching partner performance statistics
 * @returns {Object} The performance data, loading state, error, and helper functions
 */
export function usePartnerPerformance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch partner performance statistics
   */
  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await AdminPartnerService.getPartnerPerformance();
      
      setPerformance(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching partner performance:", err);
      setError(err);
      toast.error("Failed to load partner performance data");
      
      // Provide default data structure on error
      setPerformance({
        partner_stats: {
          total_partners: 0,
          active_partners: 0,
          suspended_partners: 0,
          partners_with_referrals: 0,
          total_referrals: 0,
          conversion_rate: 0
        },
        financial_stats: {
          total_commissions_paid: 0,
          total_payouts: 0,
          outstanding_balance: 0,
          lifetime_earned: 0,
          lifetime_withdrawn: 0
        },
        top_partners: [],
        recent_activity: [],
        pending_payouts: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh performance data
   */
  const refreshPerformance = useCallback(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Initial fetch
  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refreshPerformance
  };
}

/**
 * Hook for fetching partners list with pagination and filtering
 * @param {Object} initialFilters - Initial filters for partners
 * @returns {Object} The partners data, loading state, error, and helper functions
 */
export function usePartnersList(initialFilters = {}) {
  const [partners, setPartners] = useState({ partners: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /**
   * Fetch partners list based on current filters and pagination
   */
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters with pagination
      const queryFilters = {
        ...filters,
        page,
        limit: pageSize
      };
      
      const response = await AdminPartnerService.getPartnersList(queryFilters);
      
      setPartners(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching partners list:", err);
      setError(err);
      toast.error("Failed to load partners list");
      
      // Set empty data on error
      setPartners({ partners: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  /**
   * Update filters and reset pagination
   * @param {Object} newFilters - New filters to set
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Update pagination
   * @param {number} newPage - New page number
   * @param {number} newPageSize - New page size
   */
  const updatePagination = useCallback((newPage, newPageSize = pageSize) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, [pageSize]);

  /**
   * Refresh partners list
   */
  const refreshPartners = useCallback(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners: partners.partners || [],
    pagination: partners.pagination || {},
    currentPage: page,
    pageSize,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    refreshPartners
  };
}

/**
 * Hook for fetching detailed partner information
 * @param {string|number} partnerId - The ID of the partner
 * @returns {Object} The partner details, loading state, error, and refresh function
 */
export function usePartnerDetails(partnerId) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch partner details
   */
  const fetchPartnerDetails = useCallback(async () => {
    if (!partnerId) return;
    
    try {
      setLoading(true);
      
      const response = await AdminPartnerService.getPartnerDetails(partnerId);
      
      setPartner(response);
      setError(null);
    } catch (err) {
      console.error(`Error fetching partner details for ID ${partnerId}:`, err);
      setError(err);
      toast.error("Failed to load partner details");
      
      // Provide null data on error
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  /**
   * Refresh partner details
   */
  const refreshPartner = useCallback(() => {
    fetchPartnerDetails();
  }, [fetchPartnerDetails]);

  // Initial fetch
  useEffect(() => {
    if (partnerId) {
      fetchPartnerDetails();
    }
  }, [fetchPartnerDetails, partnerId]);

  return {
    partner,
    loading,
    error,
    refreshPartner
  };
}

/**
 * Hook for partner management actions (suspend/activate)
 * @returns {Object} Action functions with loading states
 */
export function usePartnerActions() {
  const [suspending, setSuspending] = useState(false);
  const [activating, setActivating] = useState(false);

  /**
   * Suspend a partner account
   * @param {string|number} partnerId - Partner ID
   * @param {string} reason - Suspension reason
   * @returns {Promise} Suspension result
   */
  const suspendPartner = useCallback(async (partnerId, reason) => {
    try {
      setSuspending(true);
      
      const response = await AdminPartnerService.suspendPartner(partnerId, reason);
      
      toast.success(`Partner suspended successfully: ${response.message}`);
      return response;
    } catch (err) {
      console.error("Error suspending partner:", err);
      toast.error(err.response?.data?.error || "Failed to suspend partner");
      throw err;
    } finally {
      setSuspending(false);
    }
  }, []);

  /**
   * Activate a partner account
   * @param {string|number} partnerId - Partner ID
   * @returns {Promise} Activation result
   */
  const activatePartner = useCallback(async (partnerId) => {
    try {
      setActivating(true);
      
      const response = await AdminPartnerService.activatePartner(partnerId);
      
      toast.success(`Partner activated successfully: ${response.message}`);
      return response;
    } catch (err) {
      console.error("Error activating partner:", err);
      toast.error(err.response?.data?.error || "Failed to activate partner");
      throw err;
    } finally {
      setActivating(false);
    }
  }, []);

  return {
    suspendPartner,
    activatePartner,
    suspending,
    activating
  };
}

/**
 * Hook for fetching and managing commission rates
 * @returns {Object} The commission rates data, loading state, error, and helper functions
 */
export function useCommissionRates() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch commission rates
   */
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await AdminPartnerService.getCommissionRates();
      
      setRates(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching commission rates:", err);
      setError(err);
      toast.error("Failed to load commission rates");
      
      // Provide default data structure on error
      setRates({
        plans_with_rates: [],
        plans_without_rates: [],
        total_plans: 0,
        configured_plans: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update commission rates
   * @param {Array} commissionRates - Array of commission rate objects
   * @returns {Promise} Update result
   */
  const updateRates = useCallback(async (commissionRates) => {
    try {
      setUpdating(true);
      
      const response = await AdminPartnerService.updateCommissionRates(commissionRates);
      
      // Refresh rates after update
      await fetchRates();
      
      toast.success(`Commission rates updated successfully: ${response.message}`);
      return response;
    } catch (err) {
      console.error("Error updating commission rates:", err);
      toast.error(err.response?.data?.error || "Failed to update commission rates");
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [fetchRates]);

  /**
   * Refresh commission rates
   */
  const refreshRates = useCallback(() => {
    fetchRates();
  }, [fetchRates]);

  // Initial fetch
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    loading,
    updating,
    error,
    updateRates,
    refreshRates
  };
}

/**
 * Combined hook for the complete partner admin dashboard
 * @returns {Object} All partner admin data and functions
 */
export function usePartnerAdminDashboard() {
  const performance = usePartnerPerformance();
  const partnersList = usePartnersList();
  const actions = usePartnerActions();
  const commissionRates = useCommissionRates();

  /**
   * Refresh all dashboard data
   */
  const refreshDashboard = useCallback(() => {
    performance.refreshPerformance();
    partnersList.refreshPartners();
    commissionRates.refreshRates();
  }, [performance, partnersList, commissionRates]);

  return {
    performance,
    partnersList,
    actions,
    commissionRates,
    refreshDashboard
  };
}