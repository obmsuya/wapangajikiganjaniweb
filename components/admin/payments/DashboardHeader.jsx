'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRevenueAnalytics } from '@/hooks/admin/useAdminPayment';

function formatCurrency(amount) {
  if (!amount) return 'TSh 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({ title, value, formatter = v => v, loading }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      {loading
        ? <Skeleton className="h-7 w-24" />
        : <p className="text-2xl font-medium leading-none tabular-nums">
            {value !== null && value !== undefined ? formatter(value) : '—'}
          </p>
      }
    </div>
  );
}

export default function DashboardHeader({ title = 'Payment Dashboard' }) {
  const [isClient, setIsClient] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)),
    to:   new Date(),
  });

  const { analytics, loading, error, updateParams, refreshAnalytics } = useRevenueAnalytics({
    period: 'month',
    year:   dateRange.from.getFullYear(),
    month:  dateRange.from.getMonth() + 1,
  });

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient) return;
    updateParams({
      period: 'month',
      year:   dateRange.from.getFullYear(),
      month:  dateRange.from.getMonth() + 1,
    });
  }, [dateRange, isClient, updateParams]);

  const stats = [
    {
      title: 'Total Revenue',
      value: analytics?.total_revenue ?? 0,
      formatter: formatCurrency,
    },
    {
      title: 'Subscription Revenue',
      value: analytics?.subscription_revenue ?? 0,
      formatter: formatCurrency,
    },
    {
      title: 'Transactions',
      value: analytics?.transaction_counts?.total ?? 0,
      formatter: v => v.toLocaleString(),
    },
    {
      title: 'Active Subscriptions',
      value: analytics?.subscription_counts?.active ?? 0,
      formatter: v => v.toLocaleString(),
    },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* Title + controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Admin / Payments
          </p>
          <h1 className="text-xl font-medium">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon data-icon="inline-start" />
                {isClient
                  ? `${dateRange.from.toLocaleDateString()} – ${dateRange.to.toLocaleDateString()}`
                  : 'Select dates'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) setDateRange(range);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost" size="icon" className="size-8"
            onClick={refreshAnalytics} disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stat cards — same pattern as PropertiesHeader */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map(({ title, value, formatter }) => (
          <StatCard key={title} title={title} value={value} formatter={formatter} loading={loading} />
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load dashboard data. Please refresh.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}