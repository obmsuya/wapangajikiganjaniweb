'use client';

import { useState } from 'react';
import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart4, PieChart as PieChartIcon } from 'lucide-react';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function ChartEmpty({ message, hint }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center gap-1">
      <p className="text-sm text-muted-foreground">{message}</p>
      {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function ChartError() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-sm text-destructive">Failed to load data</p>
    </div>
  );
}


function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full" />;
}

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '0.5px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--card-foreground)',
  boxShadow: 'none',
};

export default function PropertyAnalyticsCharts() {
  const { summary, loading, error } = useDashboardSummary();

  const categoryData = summary?.properties?.properties_by_category?.map(item => ({
    name: item.category,
    value: item.count,
  })) || [];

  const unitStatusData = summary?.units?.units_by_status?.map(item => ({
    name: item.status,
    value: item.count,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Property Category Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
          </div>
          <CardDescription>Properties by category type</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartSkeleton /> : error ? <ChartError /> : categoryData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={110}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} properties`, 'Count']}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty
              message="No category data yet"
              hint="Add properties with different categories to see this chart"
            />
          )}
        </CardContent>
      </Card>

      {/* Units by Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart4 className="size-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Units by Status</CardTitle>
          </div>
          <CardDescription>Distribution of units by current status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartSkeleton /> : error ? <ChartError /> : unitStatusData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unitStatusData}
                  margin={{ top: 16, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} units`, 'Count']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="value"
                    name="Units"
                    fill={CHART_COLORS[2]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty
              message="No unit status data yet"
              hint="Add units with different statuses to see this chart"
            />
          )}
        </CardContent>
      </Card>

    </div>
  );
}