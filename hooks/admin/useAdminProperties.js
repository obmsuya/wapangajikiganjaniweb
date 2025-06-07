"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminTenantService from '@/services/admin/admin-tenant';

/**
 * Hook for fetching dashboard summary data
 * @returns {Object} The dashboard summary data, loading state, error, and refresh function
 */
export function useDashboardSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AdminTenantService.getDashboardSummary();
      setSummary(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
      setError(err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSummary = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Initial fetch
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refreshSummary,
  };
}

/**
 * Hook for fetching properties list with pagination and filtering
 * @param {Object} initialFilters - Initial filters for properties
 * @returns {Object} The properties data, loading state, error, and helper functions
 */
export function usePropertiesList(initialFilters = {}) {
  const [properties, setProperties] = useState({
    properties: [],
    pagination: { total: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);

      // Add pagination to filters
      const queryParams = {
        ...filters,
        page,
        limit,
      };

      const response = await AdminTenantService.getPropertiesList(queryParams);
      setProperties(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties list:", err);
      setError(err);
      setProperties({ properties: [], pagination: { total: 0 } });
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const updatePagination = useCallback(
    (newPage, newLimit = limit) => {
      setPage(newPage);
      setLimit(newLimit);
    },
    [limit]
  );

  const refreshProperties = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties: properties.properties || [],
    totalProperties: properties.pagination?.total || 0,
    currentPage: page,
    limit,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    refreshProperties,
  };
}

/**
 * Hook for fetching tenants list with pagination and filtering
 * @param {Object} initialFilters - Initial filters for tenants
 * @returns {Object} The tenants data, loading state, error, and helper functions
 */
export function useTenantsList(initialFilters = {}) {
  const [tenants, setTenants] = useState({
    tenants: [],
    pagination: { total: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);

      // Add pagination to filters
      const queryParams = {
        ...filters,
        page,
        limit,
      };

      const response = await AdminTenantService.getTenantsList(queryParams);
      setTenants(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching tenants list:", err);
      setError(err);
      setTenants({ tenants: [], pagination: { total: 0 } });
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const updatePagination = useCallback(
    (newPage, newLimit = limit) => {
      setPage(newPage);
      setLimit(newLimit);
    },
    [limit]
  );

  const refreshTenants = useCallback(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants: tenants.tenants || [],
    totalTenants: tenants.pagination?.total || 0,
    currentPage: page,
    limit,
    loading,
    error,
    filters,
    updateFilters,
    updatePagination,
    refreshTenants,
  };
}

/**
 * Hook for fetching property details
 * @param {string|number} propertyId - The ID of the property
 * @returns {Object} The property details, loading state, error, and refresh function
 */
export function usePropertyDetails(propertyId) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      const response = await AdminTenantService.getPropertyDetails(propertyId);
      setProperty(response);
      setError(null);
    } catch (err) {
      console.error(
        `Error fetching property details for ID ${propertyId}:`,
        err
      );
      setError(err);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const refreshProperty = useCallback(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  // Initial fetch
  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, propertyId]);

  return {
    property,
    loading,
    error,
    refreshProperty,
  };
}
