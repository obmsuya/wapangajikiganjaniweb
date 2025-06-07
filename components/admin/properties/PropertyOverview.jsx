'use client';

import { useState } from 'react';
import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { Home, UserCheck, Clock } from 'lucide-react';

/**
 * PropertyOverview component for the dashboard tab
 * Displays various charts and statistics about properties
 */
export default function PropertyOverview() {
  const { summary, loading } = useDashboardSummary();
  const [timeRange, setTimeRange] = useState('6months');
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Format data for category pie chart
  const categoryData = summary?.properties?.properties_by_category?.map(item => ({
    name: item.category,
    value: item.count
  })) || [];
  
  // Format data for location bar chart
  const locationData = summary?.properties?.properties_by_location?.map(item => ({
    name: item.location,
    value: item.count
  })) || [];
  
  // Format data for occupancy trends - using real data from summary if available
  const occupancyTrendsData = []; // This would be populated from API data

  return (
    <div className="space-y-6">
      {/* Top Row - Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Properties by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Properties by Category</CardTitle>
            <CardDescription>Distribution of properties by type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Property Distribution by Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Distribution</CardTitle>
            <CardDescription>Top locations by property count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : locationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Units by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Units by Status</CardTitle>
            <CardDescription>Distribution of units by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : summary?.units?.units_by_status?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.units.units_by_status}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Units" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No unit status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Row - Recent Activity & Top Landlords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {summary?.recent_activities?.length > 0 ? (
                  summary.recent_activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                        {activity.type === 'property' ? (
                          <Home className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        ) : activity.type === 'tenant' ? (
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-300" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-32 text-gray-500">
                    No recent activities to display
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Landlords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Landlords</CardTitle>
            <CardDescription>By property count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {summary?.landlords?.top_landlords?.length > 0 ? (
                  summary.landlords.top_landlords.map((landlord, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{landlord.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {landlord.property_count} {landlord.property_count === 1 ? 'property' : 'properties'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {landlord.subscription_status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-32 text-gray-500">
                    No landlord data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}