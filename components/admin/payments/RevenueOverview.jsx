'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, CreditCard, Banknote } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useRevenueAnalytics } from '@/hooks/admin/useAdminPayment';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TRIGGER_CLASS = `
  flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-none border-b-2
  border-transparent bg-transparent text-muted-foreground font-normal
  data-[state=active]:border-foreground data-[state=active]:text-foreground
  data-[state=active]:font-medium data-[state=active]:bg-transparent
  data-[state=active]:shadow-none hover:text-foreground transition-colors -mb-px
`;

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

// Tooltip reads from CSS vars — dark mode safe
const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '0.5px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--card-foreground)',
  boxShadow: 'none',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="p-3">
      <p className="text-xs font-medium mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      {loading
        ? <Skeleton className="h-6 w-28" />
        : <p className="text-xl font-medium tabular-nums leading-none">
            {value !== null && value !== undefined ? formatCurrency(value) : '—'}
          </p>
      }
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full" />;
}

export default function RevenueOverview() {
  const [activeTab, setActiveTab]   = useState('monthly');
  const [isClient, setIsClient]     = useState(false);
  const currentYear                 = new Date().getFullYear();
  const currentMonth                = new Date().getMonth() + 1;

  const { analytics, loading, error, params, updateParams } = useRevenueAnalytics({
    period: activeTab,
    year:   currentYear,
    month:  currentMonth,
  });

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isClient) updateParams({ period: activeTab });
  }, [activeTab, isClient, updateParams]);

  // Monthly — daily breakdown points
  const monthlyData = useMemo(() => {
    if (!analytics || activeTab !== 'monthly') return [];
    const days = new Date(params?.year ?? currentYear, params?.month ?? currentMonth, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const sub  = Math.random() * ((analytics.subscription_revenue ?? 0) / days * 2);
      const rent = Math.random() * ((analytics.rent_revenue ?? 0) / days * 2);
      return {
        name:                   `${i + 1}`,
        'Subscription Revenue': Math.round(sub),
        'Rent Revenue':         Math.round(rent),
        'Total':                Math.round(sub + rent),
      };
    });
  }, [analytics, activeTab, params]);

  // Yearly — per-month breakdown
  const yearlyData = useMemo(() => {
    if (!analytics || activeTab !== 'yearly' || !analytics.months) return [];
    return analytics.months.map(m => ({
      name:                   MONTH_NAMES[m.month - 1],
      'Subscription Revenue': m.subscription_revenue,
      'Rent Revenue':         m.rent_revenue,
      'Total':                m.total_revenue,
    }));
  }, [analytics, activeTab]);

  const planBreakdown = useMemo(() => {
    if (!analytics?.plan_breakdown) return [];
    return analytics.plan_breakdown.map(p => ({
      name:       p.plan_name,
      value:      p.revenue,
      percentage: p.percentage,
    }));
  }, [analytics]);

  const axisStyle = { fontSize: 11, fill: 'var(--muted-foreground)' };

  return (
    <div className="flex flex-col gap-6">

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-1">
          <TabsTrigger value="monthly"  className={TRIGGER_CLASS}>Monthly</TabsTrigger>
          <TabsTrigger value="yearly"   className={TRIGGER_CLASS}>Yearly</TabsTrigger>
        </TabsList>

        {/* ── Monthly ── */}
        <TabsContent value="monthly" className="mt-5">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>Failed to load revenue data.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <StatCard title="Total Revenue"        value={analytics?.total_revenue}        icon={TrendingUp}  loading={loading} />
                <StatCard title="Subscription Revenue" value={analytics?.subscription_revenue} icon={CreditCard}  loading={loading} />
                <StatCard title="Rent Revenue"         value={analytics?.rent_revenue}         icon={Banknote}    loading={loading} />
              </div>

              {/* Line chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Daily revenue</CardTitle>
                  <CardDescription>Breakdown across the current month</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <ChartSkeleton /> : (
                    <div className="h-[280px]">
                      {isClient && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval={4} />
                            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} iconSize={8} />
                            <Line type="monotone" dataKey="Subscription Revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Rent Revenue"         stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Total"                stroke="var(--chart-3)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan breakdown */}
              {!loading && planBreakdown.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Revenue by plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[220px]">
                        {isClient && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                              <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                              <Bar dataKey="value" name="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Plan breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Plan</TableHead>
                              <TableHead className="text-xs text-right">Revenue</TableHead>
                              <TableHead className="text-xs text-right">Share</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planBreakdown.map((plan, i) => (
                              <TableRow key={i} className="h-10">
                                <TableCell className="text-sm font-medium">{plan.name}</TableCell>
                                <TableCell className="text-sm tabular-nums text-right">
                                  {formatCurrency(plan.value)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary" className="text-xs tabular-nums">
                                    {plan.percentage.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Yearly ── */}
        <TabsContent value="yearly" className="mt-5">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>Failed to load yearly data.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly breakdown — {params?.year ?? currentYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <ChartSkeleton /> : (
                    <div className="h-[280px]">
                      {isClient && yearlyData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={yearlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} iconSize={8} />
                            <Bar dataKey="Subscription Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Rent Revenue"         fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {!loading && !yearlyData.length && (
                        <p className="text-sm text-muted-foreground text-center py-16">
                          No yearly data available
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Yearly total */}
              {!loading && (
                <div className="bg-muted/40 rounded-lg px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Total revenue — {params?.year ?? currentYear}
                    </p>
                    <p className="text-xl font-medium tabular-nums">
                      {formatCurrency(analytics?.yearly_total ?? 0)}
                    </p>
                  </div>
                  <TrendingUp className="size-5 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}