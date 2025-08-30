// hooks/landlord/useTenantAssignment.js 
"use client";

import { useState, useCallback } from 'react';
import TenantService from '@/services/landlord/tenant';


export function useTenantAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignTenant = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);

      const validation = TenantService.validateTenantAssignment(assignmentData);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const formattedData = {
        unit_id: parseInt(assignmentData.unit_id),
        full_name: String(assignmentData.full_name).trim(),
        phone_number: String(assignmentData.phone_number).trim(),
        rent_amount: parseFloat(assignmentData.rent_amount),
        payment_frequency: assignmentData.payment_frequency,
        
        start_date: assignmentData.start_date || new Date().toISOString().split('T')[0]
      };

      console.log('Assigning tenant with simplified data:', formattedData);
      
      const result = await TenantService.assignTenantToUnit(formattedData);
      
      return result;
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.message || 'Failed to assign tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    assignTenant,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for tenant management operations - SIMPLIFIED
 */
export function useTenantManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendReminder = useCallback(async (tenantId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.sendTenantReminder(tenantId);
      return result;
    } catch (err) {
      console.error('Error sending reminder:', err);
      setError(err.message || 'Failed to send reminder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const vacateTenant = useCallback(async (tenantId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.vacateTenant(tenantId);
      return result;
    } catch (err) {
      console.error('Error vacating tenant:', err);
      setError(err.message || 'Failed to vacate tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantHistory = useCallback(async (tenantId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await TenantService.getTenantHistory(tenantId);
      return result;
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to fetch history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    sendReminder,
    vacateTenant,
    getTenantHistory,
    clearError
  };
}

/**
 * Hook for fetching property tenants - SIMPLIFIED
 */
export function usePropertyTenants(property) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(async () => {
    if (!property?.id) {
      setTenants([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await TenantService.getPropertyTenants(property.id);
      
      if (response && response.tenants && Array.isArray(response.tenants)) {
        // Format tenants for display
        const formattedTenants = response.tenants.map(tenant => 
          TenantService.formatTenantForDisplay(tenant)
        );
        setTenants(formattedTenants);
      } else {
        setTenants([]);
      }
      
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [property?.id]);

  const refreshTenants = useCallback(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Auto-fetch when property changes
  useState(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    refreshTenants
  };
}