// lib/hooks/useAdminData.js
'use client'
import { useState, useEffect } from 'react';
import api from '@/lib/api/api-client';

/**
 * Hook for fetching dashboard summary data from the REST API
 */
export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/auth/admin/dashboard/');
        console.log('Dashboard response:', response);
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Transform the REST API data to match the format expected by the dashboard component
  const userSummary = {
    totalUsers: data?.user_metrics?.total_users || 0,
    activeUsers: data?.user_metrics?.active_users || 0,
    landlordsCount: 0, // You'll need to add these to your API response
    tenantsCount: 0,
    managersCount: 0,
    systemAdminsCount: 0,
    activeStatusCount: data?.user_metrics?.active_users || 0,
    suspendedStatusCount: 0,
    blockedStatusCount: 0
  };

  // Mock activity metrics for now, will need to be added to your API
  const activityMetrics = {
    newUsersThisWeek: data?.recent_users?.length || 0,
    loginsLast_24h: 0,
    activeSessions: 0
  };

  return {
    loading,
    error,
    userSummary,
    activityMetrics,
    rawData: data,
    refetchDashboard: async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/v1/auth/admin/dashboard/');
        setData(response);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };
}

/**
 * Hook for fetching and filtering users list from the REST API
 */
export function useUsersList(page = 1, pageSize = 10) {
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/auth/admin/users/?page=${page}&page_size=${pageSize}`);
        console.log('Users response:', response);
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, pageSize]);

  return {
    loading,
    error,
    users: data.results || [],
    totalUsers: data.total || 0,
    currentPage: data.page || page,
    totalPages: data.total_pages || 1,
    pageSize: data.page_size || pageSize,
    refetchUsers: async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/v1/auth/admin/users/?page=${page}&page_size=${pageSize}`);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };
}

/**
 * Hook for fetching single user details from the REST API
 */
export function useUserDetails(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/auth/admin/users/${userId}/`);
        console.log('User details response:', response);
        setData(response);
        setError(null);
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  return {
    loading,
    error,
    user: data,
    refetchUser: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/v1/auth/admin/users/${userId}/`);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    updateUser: async (userData) => {
      if (!userId) return;
      try {
        // Filter to only include fields supported by the backend
        const supportedFields = {
          full_name: userData.full_name,
          email: userData.email,
          is_active: userData.is_active,
          is_staff: userData.is_staff
        };
        
        const response = await api.patch(`/api/v1/auth/admin/users/${userId}/`, supportedFields);
        setData(response);
        return response;
      } catch (err) {
        console.error(`Error updating user ${userId}:`, err);
        setError(err);
        throw err;
      }
    },
    resetPassword: async (newPassword) => {
      if (!userId) return;
      try {
        const response = await api.post(`/api/v1/auth/admin/users/${userId}/reset-password/`, {
          new_password: newPassword
        });
        return response;
      } catch (err) {
        console.error(`Error resetting password for user ${userId}:`, err);
        setError(err);
        throw err;
      }
    },
    deleteUser: async () => {
      if (!userId) return;
      try {
        // Call the newly added DELETE endpoint
        const response = await api.delete(`/api/v1/auth/admin/users/${userId}/`);
        return response;
      } catch (err) {
        console.error(`Error deleting user ${userId}:`, err);
        setError(err);
        throw err;
      }
    }
  };
}

/**
 * Hook for bulk user operations
 */
export function useUserOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performOperation = async (operation, userIds) => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/auth/admin/users/', {
        operation,
        user_ids: userIds
      });
      setError(null);
      return response;
    } catch (err) {
      console.error('Error performing user operation:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    activateUsers: (userIds) => performOperation('activate', userIds),
    deactivateUsers: (userIds) => performOperation('deactivate', userIds),
    deleteUsers: (userIds) => performOperation('delete', userIds) // Add bulk delete capability if your backend supports it
  };
}