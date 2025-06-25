// hooks/tenants/useTenantAssignment.js
"use client";

import { useState, useCallback } from 'react';
import TenantService from '@/services/landlord/tenant';

/**
 * Hook for tenant assignment operations
 * @returns {Object} Assignment state and functions
 */
export function useTenantAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTenants = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await TenantService.searchTenants(searchTerm);
      
      // Handle different response formats
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results.results && Array.isArray(results.results)) {
        setSearchResults(results.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching tenants:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const assignTenant = useCallback(async (assignmentData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields based on your backend serializer
      const requiredFields = ['unit_id', 'rent_amount', 'deposit_amount', 'payment_frequency'];
      const missingFields = requiredFields.filter(field => !assignmentData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Format data for your backend
      const formattedData = {
        // Unit assignment
        unit_id: assignmentData.unit_id,
        
        // Tenant info (if creating new tenant)
        tenant_id: assignmentData.tenant_id || null,
        full_name: assignmentData.full_name || '',
        phone_number: assignmentData.phone_number || '',
        dob: assignmentData.dob || null,
        emergency_contact_name: assignmentData.emergency_contact_name || '',
        emergency_contact_phone: assignmentData.emergency_contact_phone || '',
        emergency_contact_relationship: assignmentData.emergency_contact_relationship || '',
        
        // Contract details
        start_date: assignmentData.start_date || new Date().toISOString().split('T')[0],
        end_date: assignmentData.end_date || null,
        rent_amount: parseFloat(assignmentData.rent_amount),
        deposit_amount: parseFloat(assignmentData.deposit_amount),
        key_deposit: parseFloat(assignmentData.key_deposit || 0),
        payment_frequency: assignmentData.payment_frequency,
        payment_day: parseInt(assignmentData.payment_day || 1),
        allowed_occupants: parseInt(assignmentData.allowed_occupants || 1),
        special_conditions: assignmentData.special_conditions || ''
      };

      console.log('Assigning tenant with formatted data:', formattedData);
      const result = await TenantService.assignTenantToUnit(formattedData);
      
      return result;
    } catch (err) {
      console.error('Error assigning tenant:', err);
      setError(err.message || 'Failed to assign tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    searchResults,
    searchLoading,
    searchTenants,
    assignTenant,
    clearSearch,
    clearError
  };
}

/**
 * Hook for tenant vacation operations
 * @returns {Object} Vacation state and functions
 */
export function useTenantVacation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vacateTenant = useCallback(async (tenantId, vacationData) => {
    try {
      setLoading(true);
      setError(null);

      // Format data for your backend
      const formattedData = {
        vacate_date: vacationData.vacate_date,
        vacate_reason: vacationData.vacate_reason || '',
        refund_deposit: vacationData.refund_deposit !== false // Default to true
      };

      console.log('Vacating tenant:', tenantId, formattedData);
      const result = await TenantService.vacateTenant(tenantId, formattedData);
      
      return result;
    } catch (err) {
      console.error('Error vacating tenant:', err);
      setError(err.message || 'Failed to vacate tenant');
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
    vacateTenant,
    clearError
  };
}