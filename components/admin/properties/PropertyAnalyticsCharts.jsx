'use client';

import { useState, useEffect } from 'react';
import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart4, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

/**
 * PropertyAnalyticsCharts Component
 * Provides visual data analysis through various charts
 */
export default function PropertyAnalyticsCharts() {
  const { summary, loading, error } = useDashboardSummary();
  const [timeRange, setTimeRange] = useState('6months');
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Format data for category pie chart
  const categoryData = summary?.properties?.properties_by_category?.map(item => ({
    name: item.category,
    value: item.count
  })) || [];
  
  // Format data for units by status chart
  const unitStatusData = summary?.units?.units_by_status?.map(item => ({
    name: item.status,
    value: item.count
  })) || [];
  
  // Get data from summary for occupancy trends if available
  // Note: In a real app, this would be fetched from a time-series API endpoint
  const occupancyTrendsData = [];
  
  // Get data for property growth over time
  // Note: In a real app, this would be fetched from a time-series API endpoint
  const propertyGrowthData = [];
  
  // Fill with data from summary if available, keeping empty otherwise
  // This ensures the component works even if the data isn't yet available
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Property Analytics</h2>
      </div>
      
      {/* Bottom Row - Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Category Distribution */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-purple-500" />
                Property Category Distribution
              </CardTitle>
              <CardDescription>
                Properties by category type
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center text-red-500">
                Failed to load category data
              </div>
            ) : categoryData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} properties`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                <p>No category distribution data available</p>
                <p className="text-sm mt-1">Add properties with different categories to see this chart</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Units by Status */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center">
                <BarChart4 className="h-5 w-5 mr-2 text-amber-500" />
                Units by Status
              </CardTitle>
              <CardDescription>
                Distribution of units by current status
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center text-red-500">
                Failed to load unit status data
              </div>
            ) : unitStatusData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unitStatusData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} units`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Units"
                      fill="#FFBB28"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                <p>No unit status data available</p>
                <p className="text-sm mt-1">Add units with different statuses to see this chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}