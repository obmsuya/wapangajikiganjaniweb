// hooks/landlord/useDashboard.js
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardService from '@/services/landlord/dashboard';

/**
 * Hook for managing the main landlord dashboard
 * @param {Object} options - Configuration options
 * @returns {Object} Dashboard state and management functions
 */
export function useDashboard(options = {}) {
  const { autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default
  
  const [dashboardStats, setDashboardStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const stats = await DashboardService.getDashboardStats();
      setDashboardStats(stats);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err);
    }
  }, []);

  // Fetch properties with details
  const fetchProperties = useCallback(async (filters = {}) => {
    try {
      const propertiesData = await DashboardService.getPropertiesWithDetails(filters);
      setProperties(propertiesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
      setProperties([]);
    }
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      const activity = await DashboardService.getRecentActivity(10);
      setRecentActivity(activity);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setRecentActivity([]);
    }
  }, []);

  // Fetch financial overview
  const fetchFinancialOverview = useCallback(async (period = 'month') => {
    try {
      const overview = await DashboardService.getFinancialOverview(period);
      setFinancialOverview(overview);
    } catch (err) {
      console.error("Error fetching financial overview:", err);
      setFinancialOverview(null);
    }
  }, []);

  // Comprehensive dashboard data fetch
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchProperties(),
        fetchRecentActivity(),
        fetchFinancialOverview()
      ]);
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchProperties, fetchRecentActivity, fetchFinancialOverview]);

  // Refresh single property data
  const refreshProperty = useCallback(async (propertyId) => {
    try {
      const updatedProperty = await DashboardService.getPropertyDetails(propertyId);
      
      setProperties(prev => 
        prev.map(property => 
          property.id === propertyId ? updatedProperty : property
        )
      );
      
      // Also refresh stats
      await fetchDashboardStats();
      
      return updatedProperty;
    } catch (err) {
      console.error(`Error refreshing property ${propertyId}:`, err);
      throw err;
    }
  }, [fetchDashboardStats]);

  // Add new property to list (after creation)
  const addProperty = useCallback((newProperty) => {
    setProperties(prev => [newProperty, ...prev]);
    fetchDashboardStats(); // Refresh stats
  }, [fetchDashboardStats]);

  // Remove property from list
  const removeProperty = useCallback((propertyId) => {
    setProperties(prev => prev.filter(property => property.id !== propertyId));
    fetchDashboardStats(); // Refresh stats
  }, [fetchDashboardStats]);

  // Search and filter properties
  const searchProperties = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    try {
      const searchFilters = {
        ...filters,
        search: searchTerm
      };
      await fetchProperties(searchFilters);
    } finally {
      setLoading(false);
    }
  }, [fetchProperties]);

  // Memoized computed values
  const computedStats = useMemo(() => {
    if (!dashboardStats) return null;
    
    return {
      ...dashboardStats,
      revenue: {
        monthly: dashboardStats.totalMonthlyRent,
        annual: dashboardStats.totalMonthlyRent * 12,
        perUnit: dashboardStats.totalUnits > 0 
          ? dashboardStats.totalMonthlyRent / dashboardStats.totalUnits 
          : 0
      },
      alerts: {
        lowOccupancy: dashboardStats.occupancyRate < 80,
        noProperties: dashboardStats.totalProperties === 0,
        overduePayments: dashboardStats.overduePayments > 0
      }
    };
  }, [dashboardStats]);

  // Group properties by status for easy access
  const groupedProperties = useMemo(() => {
    return {
      all: properties,
      highOccupancy: properties.filter(p => p.stats?.occupancyRate >= 90),
      lowOccupancy: properties.filter(p => p.stats?.occupancyRate < 50),
      fullyOccupied: properties.filter(p => p.stats?.occupancyRate === 100),
      vacant: properties.filter(p => p.stats?.occupancyRate === 0)
    };
  }, [properties]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  return {
    // Core data
    dashboardStats,
    properties,
    recentActivity,
    financialOverview,
    
    // Computed data
    computedStats,
    groupedProperties,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchDashboardData,
    refreshProperty,
    addProperty,
    removeProperty,
    searchProperties,
    
    // Individual fetch functions
    fetchProperties,
    fetchDashboardStats,
    fetchRecentActivity,
    fetchFinancialOverview
  };
}

/**
 * Hook for managing single property details view
 * @param {string|number} propertyId - The property ID
 * @returns {Object} Property details state and management functions
 */
export function usePropertyDetails(propertyId) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPropertyDetails = useCallback(async () => {
    if (!propertyId) return;

    setLoading(true);
    setError(null);

    try {
      const propertyData = await DashboardService.getPropertyDetails(propertyId);
      setProperty(propertyData);
    } catch (err) {
      console.error(`Error fetching property details for ID ${propertyId}:`, err);
      setError(err);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // Refresh property data
  const refreshProperty = useCallback(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  // Update single unit data
  const updateUnit = useCallback((unitId, unitData) => {
    setProperty(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        units: prev.units.map(unit => 
          unit.id === unitId ? { ...unit, ...unitData } : unit
        )
      };
    });
  }, []);

  // Group units by floor for easy display
  const unitsByFloor = useMemo(() => {
    if (!property?.units) return {};
    
    return property.units.reduce((groups, unit) => {
      const floor = unit.floorNumber || 0;
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(unit);
      return groups;
    }, {});
  }, [property?.units]);

  // Get units by status
  const unitsByStatus = useMemo(() => {
    if (!property?.units) return {};
    
    return property.units.reduce((groups, unit) => {
      const status = unit.status || 'unknown';
      if (!groups[status]) groups[status] = [];
      groups[status].push(unit);
      return groups;
    }, {});
  }, [property?.units]);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [fetchPropertyDetails, propertyId]);

  return {
    property,
    loading,
    error,
    unitsByFloor,
    unitsByStatus,
    fetchPropertyDetails,
    refreshProperty,
    updateUnit
  };
}