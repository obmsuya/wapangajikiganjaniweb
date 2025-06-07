// app/components/cloudflare/DashboardStats.js
'use client'
import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock, 
  Activity, 
  Building, 
  Home,
  User
} from 'lucide-react';
import { useDashboardData } from '@/hooks/admin/useAdminData';
import { CloudflareCard, CloudflareCardGrid, CloudflareStatCard } from './Card';

/**
 * DashboardStats Component
 * 
 * A Cloudflare-style dashboard stats component showing user statistics and metrics
 * Now using REST API data from the admin endpoint
 */
const CloudflareDashboardStats = () => {
  const { loading, error, userSummary, activityMetrics, rawData } = useDashboardData();

  // Log the raw data we're receiving for debugging
  console.log("Raw dashboard data:", rawData);
  console.log("Transformed user summary:", userSummary);
  console.log("Transformed activity metrics:", activityMetrics);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <CloudflareCard className="p-4 bg-error-50 text-error-700 dark:bg-error-900 dark:text-error-300">
        <p>Error loading dashboard data: {error.message}</p>
        <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </CloudflareCard>
    );
  }

  // Calculate percentage changes (mockup for demo)
  // In a real app, you'd fetch historical data from API
  const getChangePercent = (value) => {
    // Simulate random change between -20% and +30%
    return ((Math.random() * 50) - 20).toFixed(1);
  };

  const getTrendFromChange = (change) => {
    const num = parseFloat(change);
    return num > 0 ? 'up' : num < 0 ? 'down' : 'neutral';
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0';
  };

  return (
    <div className="space-y-8">
      {/* User metrics section */}
      <section>
        <h2 className="text-lg font-medium mb-4">User Metrics</h2>
        <CloudflareCardGrid columns={3}>
          <CloudflareStatCard
            title="Total Users"
            value={formatNumber(userSummary.totalUsers)}
            icon={<Users className="h-5 w-5" />}
            previousValue={userSummary.totalUsers * 0.95} // Mock previous value
          />
          <CloudflareStatCard
            title="Active Users"
            value={formatNumber(userSummary.activeUsers)}
            icon={<UserCheck className="h-5 w-5" />}
            previousValue={userSummary.activeUsers * 0.9} // Mock previous value
            className="border-l-4 border-l-green-500"
          />
          <CloudflareStatCard
            title="Inactive Users"
            value={formatNumber(rawData?.user_metrics?.inactive_users || 0)}
            icon={<UserX className="h-5 w-5" />}
            previousValue={(rawData?.user_metrics?.inactive_users || 0) * 1.05} // Mock previous value
            className="border-l-4 border-l-red-500"
          />
        </CloudflareCardGrid>
      </section>
      
      {/* Recent Users section */}
      {rawData?.recent_users && rawData.recent_users.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">Recent User Registrations</h2>
          <CloudflareCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {rawData.recent_users.map((user, index) => (
                    <tr key={user.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.date_joined).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CloudflareCard>
        </section>
      )}
      
      {/* System Status section */}
      {rawData?.system_status && (
        <section>
          <h2 className="text-lg font-medium mb-4">System Status</h2>
          <CloudflareCard className="p-4">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                rawData.system_status.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {rawData.system_status.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last checked: {new Date(rawData.system_status.last_checked).toLocaleString()}
            </div>
          </CloudflareCard>
        </section>
      )}
    </div>
  );
};

export { CloudflareDashboardStats };