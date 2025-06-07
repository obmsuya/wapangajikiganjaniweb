'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subMonths, getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  CalendarIcon, RefreshCw, TrendingUp, TrendingDown, 
  BarChart4, PieChart as PieChartIcon, ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRevenueAnalytics } from '@/hooks/admin/useAdminPayment';

/**
 * Revenue analytics chart component with multiple visualizations
 */
export default function RevenueAnalyticsChart() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar');
  const [periodType, setPeriodType] = useState('month');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  
  // Previous period for comparison
  const previousPeriod = useMemo(() => {
    const currentStartDate = dateRange.from;
    const monthDiff = periodType === 'year' ? 12 : 1;
    return {
      from: subMonths(currentStartDate, monthDiff),
      to: subMonths(dateRange.to, monthDiff)
    };
  }, [dateRange, periodType]);
  
  // Get revenue analytics data
  const { 
    analytics: currentAnalytics, 
    loading: currentLoading, 
    error: currentError, 
    params: currentParams,
    updateParams: updateCurrentParams,
    refreshAnalytics: refreshCurrentAnalytics
  } = useRevenueAnalytics({
    period: periodType,
    year: getYear(dateRange.from),
    month: getMonth(dateRange.from) + 1
  });
  
  // Get comparison data if enabled
  const { 
    analytics: previousAnalytics, 
    loading: previousLoading
  } = useRevenueAnalytics(
    comparisonEnabled ? {
      period: periodType,
      year: getYear(previousPeriod.from),
      month: getMonth(previousPeriod.from) + 1
    } : null
  );
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update parameters when date range or period type changes
  useEffect(() => {
    if (isClient) {
      updateCurrentParams({
        period: periodType,
        year: getYear(dateRange.from),
        month: getMonth(dateRange.from) + 1
      });
    }
  }, [dateRange, periodType, isClient, updateCurrentParams]);
  
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
  
  // Calculate percentage difference
  const calculateDifference = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: false };
    const difference = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(difference).toFixed(1),
      isPositive: difference >= 0
    };
  };
  
  // Get period label
  const getPeriodLabel = useCallback((date, type = 'current') => {
    if (periodType === 'month') {
      return format(type === 'current' ? dateRange.from : previousPeriod.from, 'MMMM yyyy');
    } else {
      return format(type === 'current' ? dateRange.from : previousPeriod.from, 'yyyy');
    }
  }, [dateRange, previousPeriod, periodType]);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="flex items-center text-sm">
              <span 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></span>
              <span>{entry.name}: {formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // COLORS for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  
  // Prepare data for monthly overview
  const monthlyOverviewData = useMemo(() => {
    if (!currentAnalytics || !currentAnalytics.months) return [];
    
    return (currentAnalytics.months || []).map(month => ({
      name: format(new Date(2023, month.month - 1, 1), 'MMM'),
      'Subscription Revenue': month.subscription_revenue,
      'Rent Revenue': month.rent_revenue,
      'Total': month.total_revenue
    }));
  }, [currentAnalytics]);
  
  // Prepare data for payment type breakdown
  const paymentTypeData = useMemo(() => {
    if (!currentAnalytics) return [];
    
    return [
      { name: 'Subscription', value: currentAnalytics.subscription_revenue || 0 },
      { name: 'Rent', value: currentAnalytics.rent_revenue || 0 }
    ];
  }, [currentAnalytics]);
  
  // Prepare data for plan breakdown
  const planBreakdownData = useMemo(() => {
    if (!currentAnalytics || !currentAnalytics.plan_breakdown) return [];
    
    return (currentAnalytics.plan_breakdown || []).map(plan => ({
      name: plan.plan_name,
      value: plan.revenue,
      percentage: plan.percentage
    }));
  }, [currentAnalytics]);
  
  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonEnabled || !currentAnalytics || !previousAnalytics) return [];
    
    // For monthly comparison
    if (periodType === 'month') {
      const current = { ...currentAnalytics };
      const previous = { ...previousAnalytics };
      
      return [
        {
          name: 'Total Revenue',
          'Current Period': current.total_revenue || 0,
          'Previous Period': previous.total_revenue || 0,
          difference: calculateDifference(current.total_revenue || 0, previous.total_revenue || 0)
        },
        {
          name: 'Subscription Revenue',
          'Current Period': current.subscription_revenue || 0,
          'Previous Period': previous.subscription_revenue || 0,
          difference: calculateDifference(current.subscription_revenue || 0, previous.subscription_revenue || 0)
        },
        {
          name: 'Rent Revenue',
          'Current Period': current.rent_revenue || 0,
          'Previous Period': previous.rent_revenue || 0,
          difference: calculateDifference(current.rent_revenue || 0, previous.rent_revenue || 0)
        },
        {
          name: 'Transaction Count',
          'Current Period': current.transaction_counts?.total || 0,
          'Previous Period': previous.transaction_counts?.total || 0,
          difference: calculateDifference(current.transaction_counts?.total || 0, previous.transaction_counts?.total || 0)
        }
      ];
    } else {
      // For yearly comparison
      return [
        {
          name: 'Total Revenue',
          'Current Year': current.yearly_total || 0,
          'Previous Year': previous.yearly_total || 0,
          difference: calculateDifference(current.yearly_total || 0, previous.yearly_total || 0)
        }
      ];
    }
  }, [comparisonEnabled, currentAnalytics, previousAnalytics, periodType, calculateDifference]);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl font-bold">Revenue Analytics</h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mr-2">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart4 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="plans">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Plans
              </TabsTrigger>
              {comparisonEnabled && (
                <TabsTrigger value="comparison">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Comparison
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          {isClient && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(dateRange.from, 'MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      setDateRange({
                        from: startOfMonth(date),
                        to: endOfMonth(date)
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setComparisonEnabled(!comparisonEnabled)}
            >
              {comparisonEnabled ? 'Hide Comparison' : 'Compare Periods'}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshCurrentAnalytics}
              disabled={currentLoading}
            >
              <RefreshCw className={`h-4 w-4 ${currentLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {currentError && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md mb-6">
          Failed to load revenue data. Please try again.
        </div>
      )}
      
      {/* Chart Type Selector (for Overview Tab) */}
      {activeTab === 'overview' && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-800">
            <Button
              variant={chartType === 'bar' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-md rounded-r-none"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none border-l border-r border-gray-200 dark:border-gray-800"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'area' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-md rounded-l-none"
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Top Cards - Period Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</h3>
                {currentLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-xl font-bold">
                    {formatCurrency(currentAnalytics?.total_revenue || 0)}
                  </div>
                )}
                
                {comparisonEnabled && previousAnalytics && (
                  <div className="mt-2 flex items-center">
                    {calculateDifference(
                      currentAnalytics?.total_revenue || 0,
                      previousAnalytics?.total_revenue || 0
                    ).isPositive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{calculateDifference(
                          currentAnalytics?.total_revenue || 0,
                          previousAnalytics?.total_revenue || 0
                        ).value}%
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -{calculateDifference(
                          currentAnalytics?.total_revenue || 0,
                          previousAnalytics?.total_revenue || 0
                        ).value}%
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous period</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subscription Revenue</h3>
                {currentLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-xl font-bold">
                    {formatCurrency(currentAnalytics?.subscription_revenue || 0)}
                  </div>
                )}
                
                {comparisonEnabled && previousAnalytics && (
                  <div className="mt-2 flex items-center">
                    {calculateDifference(
                      currentAnalytics?.subscription_revenue || 0,
                      previousAnalytics?.subscription_revenue || 0
                    ).isPositive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{calculateDifference(
                          currentAnalytics?.subscription_revenue || 0,
                          previousAnalytics?.subscription_revenue || 0
                        ).value}%
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -{calculateDifference(
                          currentAnalytics?.subscription_revenue || 0,
                          previousAnalytics?.subscription_revenue || 0
                        ).value}%
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous period</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transaction Count</h3>
                {currentLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-xl font-bold">
                    {(currentAnalytics?.transaction_counts?.total || 0).toLocaleString()}
                  </div>
                )}
                
                {comparisonEnabled && previousAnalytics && previousAnalytics.transaction_counts && (
                  <div className="mt-2 flex items-center">
                    {calculateDifference(
                      currentAnalytics?.transaction_counts?.total || 0,
                      previousAnalytics?.transaction_counts?.total || 0
                    ).isPositive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{calculateDifference(
                          currentAnalytics?.transaction_counts?.total || 0,
                          previousAnalytics?.transaction_counts?.total || 0
                        ).value}%
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -{calculateDifference(
                          currentAnalytics?.transaction_counts?.total || 0,
                          previousAnalytics?.transaction_counts?.total || 0
                        ).value}%
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous period</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Chart */}
            <div className="h-[400px]">
              {currentLoading ? (
                <Skeleton className="h-full w-full" />
              ) : isClient && monthlyOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={monthlyOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('TZS', '')} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Subscription Revenue" fill={COLORS[0]} />
                      <Bar dataKey="Rent Revenue" fill={COLORS[1]} />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={monthlyOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('TZS', '')} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Subscription Revenue" 
                        stroke={COLORS[0]} 
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Rent Revenue" 
                        stroke={COLORS[1]} 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Total" 
                        stroke={COLORS[2]} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={monthlyOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('TZS', '')} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="Subscription Revenue" 
                        stackId="1"
                        stroke={COLORS[0]} 
                        fill={COLORS[0]} 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Rent Revenue" 
                        stackId="1"
                        stroke={COLORS[1]} 
                        fill={COLORS[1]} 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No data available for the selected period
                </div>
              )}
            </div>
            
            {/* Payment Type Distribution */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Revenue Distribution by Payment Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-[240px]">
                  {currentLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : isClient && paymentTypeData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {paymentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)} 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--card-bg))', 
                            borderColor: 'rgb(var(--card-border))' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No data available for the selected period
                    </div>
                  )}
                </div>
                
                {/* Stats Table */}
                <div className="overflow-hidden border border-card-border rounded-lg">
                  <table className="min-w-full divide-y divide-card-border">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {currentLoading ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        </tr>
                      ) : paymentTypeData.length > 0 ? (
                        paymentTypeData.map((type, index) => {
                          const total = paymentTypeData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = total > 0 ? (type.value / total) * 100 : 0;
                          
                          return (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <span 
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></span>
                                  {type.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">{formatCurrency(type.value)}</td>
                              <td className="px-4 py-3 text-right">{percentage.toFixed(1)}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-center text-gray-500">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <>
            <h3 className="text-lg font-medium mb-4">Revenue by Subscription Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentLoading ? (
                Array(3).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))
              ) : planBreakdownData.length > 0 ? (
                planBreakdownData.slice(0, 3).map((plan, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-500">{plan.name}</h4>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {plan.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-xl font-bold mt-1">{formatCurrency(plan.value)}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-4 text-center text-gray-500">
                  No plan data available for the selected period
                </div>
              )}
            </div>
            
            {/* Bar Chart for Plans */}
            <div className="h-[400px] mb-6">
              {currentLoading ? (
                <Skeleton className="h-full w-full" />
              ) : isClient && planBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('TZS', '')} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Revenue">
                      {planBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No data available for the selected period
                </div>
              )}
            </div>
            
            {/* Plan breakdown table */}
            <div className="overflow-hidden border border-card-border rounded-lg">
              <table className="min-w-full divide-y divide-card-border">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {currentLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : planBreakdownData.length > 0 ? (
                    planBreakdownData.map((plan, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            {plan.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(plan.value)}</td>
                        <td className="px-4 py-3 text-right">{plan.percentage.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            —
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Comparison Tab */}
        {activeTab === 'comparison' && comparisonEnabled && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Period Comparison</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1.5">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Current: {getPeriodLabel('current')}
                </Badge>
                <span className="text-gray-500">vs</span>
                <Badge variant="outline" className="text-sm px-3 py-1.5">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Previous: {getPeriodLabel('previous')}
                </Badge>
              </div>
            </div>
            
            {/* Comparison Chart */}
            <div className="h-[400px] mb-6">
              {currentLoading || previousLoading ? (
                <Skeleton className="h-full w-full" />
              ) : isClient && comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={comparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value).replace('TZS', '')} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Current Period" fill={COLORS[0]} name="Current Period" />
                    <Bar dataKey="Previous Period" fill={COLORS[1]} name="Previous Period" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No comparison data available
                </div>
              )}
            </div>
            
            {/* Comparison Table */}
            <div className="overflow-hidden border border-card-border rounded-lg">
              <table className="min-w-full divide-y divide-card-border">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Previous Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {currentLoading || previousLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : comparisonData.length > 0 ? (
                    comparisonData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3 text-right">
                          {item.name.includes('Count') 
                            ? item['Current Period'].toLocaleString() 
                            : formatCurrency(item['Current Period'])}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.name.includes('Count')
                            ? item['Previous Period'].toLocaleString()
                            : formatCurrency(item['Previous Period'])}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.difference.isPositive ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{item.difference.value}%
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              -{item.difference.value}%
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                        No comparison data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}