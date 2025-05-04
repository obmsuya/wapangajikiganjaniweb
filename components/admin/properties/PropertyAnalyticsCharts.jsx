'use client';

import { useState, useEffect } from 'react';
import { useDashboardSummary } from '@/hooks/useAdminProperties';
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
        
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Top Row - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Rate Trends */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                Occupancy Rate Trends
              </CardTitle>
              <CardDescription>
                Occupancy rate changes over {timeRange === '30days' ? 'the last 30 days' : 
                  timeRange === '3months' ? 'the last 3 months' : 
                  timeRange === '6months' ? 'the last 6 months' : 'the last year'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center text-red-500">
                Failed to load occupancy data
              </div>
            ) : occupancyTrendsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={occupancyTrendsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Occupancy Rate']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#0088FE"
                      strokeWidth={2}
                      name="Occupancy Rate"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                <p>No occupancy trend data available for the selected time range</p>
                <p className="text-sm mt-1">Data will appear here as it becomes available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Property Growth Over Time */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Property Growth Over Time
              </CardTitle>
              <CardDescription>
                Number of properties added over time
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center text-red-500">
                Failed to load property growth data
              </div>
            ) : propertyGrowthData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={propertyGrowthData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: '#e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#00C49F"
                      fill="#00C49F"
                      fillOpacity={0.3}
                      name="Properties"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                <p>No property growth data available for the selected time range</p>
                <p className="text-sm mt-1">Data will appear here as it becomes available</p>
              </div>
            )}
          </CardContent>
        </Card>
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
      
      {/* Additional Analytics Features */}
      <Tabs defaultValue="occupancy" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="occupancy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Analysis</CardTitle>
              <CardDescription>Detailed breakdown of occupancy metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Average Occupancy</p>
                      <h3 className="text-2xl font-bold">{summary?.tenants?.occupancy_rate || 0}%</h3>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Top Property</p>
                      <h3 className="text-2xl font-bold truncate">
                        {summary?.properties?.properties_by_occupancy?.[0]?.name || 'N/A'}
                      </h3>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Low Occupancy</p>
                      <h3 className="text-2xl font-bold">{summary?.low_occupancy_count || 0} properties</h3>
                    </div>
                  </div>
                  
                  <div className="py-4 text-center text-gray-500">
                    More detailed analytics would be displayed here based on the available data
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Financial performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-gray-500">
                Revenue analysis data will be available in a future update
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Comparison</CardTitle>
              <CardDescription>Compare performance across properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-gray-500">
                Property comparison tools will be available in a future update
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}