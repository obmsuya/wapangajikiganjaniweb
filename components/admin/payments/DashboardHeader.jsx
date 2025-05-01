'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRevenueAnalytics } from '@/hooks/useAdminPayment';

/**
 * Dashboard header component that displays title, statistics summary, and date range selector
 */
export default function DashboardHeader({ title = "Payment Dashboard" }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });
  const [isClient, setIsClient] = useState(false);
  
  // Use the revenue analytics hook with real data
  const { 
    analytics, 
    loading, 
    error, 
    updateParams,
    refreshAnalytics 
  } = useRevenueAnalytics({
    period: 'month',
    year: dateRange.from.getFullYear(),
    month: dateRange.from.getMonth() + 1
  });

  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update parameters when date range changes
  useEffect(() => {
    if (isClient) {
      updateParams({
        period: 'month',
        year: dateRange.from.getFullYear(),
        month: dateRange.from.getMonth() + 1
      });
    }
  }, [dateRange, isClient, updateParams]);

  // Format currency to TZS
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {isClient ? (
                    `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  ) : (
                    "Select dates"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: range.from,
                      to: range.to
                    });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refreshAnalytics()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <StatCard
          title="Total Revenue"
          value={loading ? null : analytics?.total_revenue ?? 0}
          formatter={formatCurrency}
          loading={loading}
        />
        
        {/* Subscription Revenue */}
        <StatCard
          title="Subscription Revenue"
          value={loading ? null : analytics?.subscription_revenue ?? 0}
          formatter={formatCurrency}
          loading={loading}
        />
        
        {/* Transaction Count */}
        <StatCard
          title="Transactions"
          value={loading ? null : analytics?.transaction_counts?.total ?? 0}
          formatter={(value) => value.toLocaleString()}
          loading={loading}
        />
        
        {/* Active Subscriptions - If available, otherwise show 0 */}
        <StatCard
          title="Active Subscriptions"
          value={loading ? null : analytics?.subscription_counts?.active ?? 0}
          formatter={(value) => value.toLocaleString()}
          loading={loading}
        />
      </div>
      
      {error && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md">
          Failed to load dashboard data. Please try again.
        </div>
      )}
    </div>
  );
}

/**
 * Statistic card component with loading state
 */
function StatCard({ title, value, formatter = (val) => val, loading = false }) {
  return (
    <Card className="p-5">
      <div className="space-y-2">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold">
            {value !== null ? formatter(value) : '—'}
          </p>
        )}
      </div>
    </Card>
  );
}