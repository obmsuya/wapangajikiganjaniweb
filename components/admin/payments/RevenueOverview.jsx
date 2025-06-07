'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueAnalytics } from '@/hooks/admin/useAdminPayment';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Revenue overview component displaying metrics and charts
 */
export default function RevenueOverview() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [isClient, setIsClient] = useState(false);
  
  // Get current date info
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Use the analytics hook
  const { analytics, loading, error, params, updateParams } = useRevenueAnalytics({
    period: activeTab,
    year: currentYear,
    month: currentMonth
  });

  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update when tab changes
  useEffect(() => {
    if (isClient) {
      updateParams({ period: activeTab });
    }
  }, [activeTab, isClient, updateParams]);

  // Format currency to TZS
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Process data for monthly view
  const monthlyData = useMemo(() => {
    if (!analytics || activeTab !== 'monthly') return [];
    
    // Create daily revenue points (mock data for now)
    const daysInMonth = new Date(params.year, params.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      // Create some randomized data
      const subscriptionRevenue = Math.random() * (analytics.subscription_revenue / daysInMonth * 2);
      const rentRevenue = Math.random() * (analytics.rent_revenue / daysInMonth * 2);
      
      return {
        name: `${day}`,
        'Subscription Revenue': Math.round(subscriptionRevenue),
        'Rent Revenue': Math.round(rentRevenue),
        'Total': Math.round(subscriptionRevenue + rentRevenue)
      };
    });
  }, [analytics, activeTab, params]);

  // Process data for yearly view
  const yearlyData = useMemo(() => {
    if (!analytics || activeTab !== 'yearly' || !analytics.months) return [];
    
    // Month abbreviations
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return analytics.months.map(month => ({
      name: monthNames[month.month - 1],
      'Subscription Revenue': month.subscription_revenue,
      'Rent Revenue': month.rent_revenue,
      'Total': month.total_revenue
    }));
  }, [analytics, activeTab]);

  // Custom tooltip to format values as TZS
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Plan breakdown data for pie chart
  const planBreakdown = useMemo(() => {
    if (!analytics || !analytics.plan_breakdown) return [];
    return analytics.plan_breakdown.map(plan => ({
      name: plan.plan_name,
      value: plan.revenue,
      percentage: plan.percentage
    }));
  }, [analytics]);

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-6">Revenue Overview</h2>
        
        <Tabs defaultValue="monthly" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="pt-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-error-50 text-error-700 rounded-md">
                Failed to load revenue data. Please try again.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue Chart */}
                <div className="h-[300px]">
                  {isClient && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={value => formatCurrency(value).replace('TZS', '')} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Subscription Revenue" 
                          stroke="#2E90FA" 
                          strokeWidth={2} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Rent Revenue" 
                          stroke="#F97066" 
                          strokeWidth={2} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Total" 
                          stroke="#7F56D9" 
                          strokeWidth={2} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard 
                    title="Total Revenue" 
                    value={analytics?.total_revenue} 
                    formatter={formatCurrency} 
                  />
                  <MetricCard 
                    title="Subscription Revenue" 
                    value={analytics?.subscription_revenue} 
                    formatter={formatCurrency} 
                  />
                  <MetricCard 
                    title="Rent Revenue" 
                    value={analytics?.rent_revenue} 
                    formatter={formatCurrency} 
                  />
                </div>
                
                {/* Plan Breakdown */}
                {planBreakdown.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Subscription Plan Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bar Chart */}
                      <div className="h-[240px]">
                        {isClient && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planBreakdown}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis tickFormatter={value => formatCurrency(value).replace('TZS', '')} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" fill="#7F56D9" name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      
                      {/* Plan Breakdown Table */}
                      <div className="overflow-hidden border border-card-border rounded-lg">
                        <table className="min-w-full divide-y divide-card-border">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-card-border">
                            {planBreakdown.map((plan, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm">{plan.name}</td>
                                <td className="px-4 py-3 text-sm text-right">{formatCurrency(plan.value)}</td>
                                <td className="px-4 py-3 text-sm text-right">{plan.percentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="yearly" className="pt-4">
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : error ? (
              <div className="p-4 bg-error-50 text-error-700 rounded-md">
                Failed to load yearly revenue data. Please try again.
              </div>
            ) : (
              <div>
                {/* Yearly Revenue Chart */}
                <div className="h-[300px]">
                  {isClient && yearlyData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={value => formatCurrency(value).replace('TZS', '')} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Subscription Revenue" fill="#2E90FA" />
                        <Bar dataKey="Rent Revenue" fill="#F97066" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                {/* Yearly Total */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-medium">Total Revenue for {params.year}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(analytics?.yearly_total ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

/**
 * Metric card component
 */
function MetricCard({ title, value, formatter = (val) => val }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-xl font-bold mt-1">
        {value !== null && value !== undefined ? formatter(value) : '—'}
      </p>
    </div>
  );
}