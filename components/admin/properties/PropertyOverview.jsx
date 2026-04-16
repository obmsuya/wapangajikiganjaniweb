'use client';

import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, UserCheck, Clock } from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

export default function PropertyOverview() {
  const { summary, loading } = useDashboardSummary();

  const categoryData = summary?.properties?.properties_by_category?.map(item => ({
    name: item.category,
    value: item.count,
  })) || [];

  const locationData = summary?.properties?.properties_by_location?.map(item => ({
    name: item.location,
    value: item.count,
  })) || [];

  const unitStatusData = summary?.units?.units_by_status || [];


  const activityIcon = (type) => {
    if (type === 'property') return <Home className="h-4 w-4 text-muted-foreground" />;
    if (type === 'tenant')   return <UserCheck className="h-4 w-4 text-muted-foreground" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Properties by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Properties by Category</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} properties`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="No category data available" />}
          </CardContent>
        </Card>

        {/* Property Distribution by Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Property Distribution</CardTitle>
            <CardDescription>Top locations by count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : locationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} name="Properties" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="No location data available" />}
          </CardContent>
        </Card>

        {/* Units by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Units by Status</CardTitle>
            <CardDescription>Current unit distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : unitStatusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unitStatusData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={CHART_COLORS[1]} name="Units" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="No unit status data available" />}
          </CardContent>
        </Card>

      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : summary?.recent_activities?.length > 0 ? (
              <div className="space-y-2">
                {summary.recent_activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="p-1.5 rounded-full bg-muted shrink-0">
                      {activityIcon(activity.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No recent activity" />}
          </CardContent>
        </Card>

        {/* Top Landlords */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Landlords</CardTitle>
            <CardDescription>By property count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : summary?.landlords?.top_landlords?.length > 0 ? (
              <div className="space-y-2">
                {summary.landlords.top_landlords.map((landlord, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{landlord.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {landlord.property_count} {landlord.property_count === 1 ? 'property' : 'properties'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${
                      landlord.subscription_status === 'active'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}>
                      {landlord.subscription_status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No landlord data available" />}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}