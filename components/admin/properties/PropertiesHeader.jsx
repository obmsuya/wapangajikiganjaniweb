'use client';

import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Building, Home, UserCheck, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Stats card data type
 */
const StatCard = {
  title: string,
  value: number,
  icon: React.ReactNode
};

export default function PropertiesHeader({ title }) {
  const { summary, loading } = useDashboardSummary();

  // All stat cards defined in one place — easy to add/remove
  const statsCards = [
    {
      title: 'Total Properties',
      value: summary?.properties?.total_properties || 0,
      icon: <Building className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Total Units',
      value: summary?.units?.total_units || 0,
      icon: <Home className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Total Tenants',
      value: summary?.tenants?.total_tenants || 0,
      icon: <UserCheck className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Total Landlords',
      value: summary?.landlords?.total_landlords || 0,
      icon: <User className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  // Occupancy stats derived from summary
  const occupancyRate = summary?.tenants?.occupancy_rate;
  const occupiedCount = summary?.units?.units_by_status?.find(s => s.status === 'occupied')?.count || 0;
  const vacantCount = summary?.units?.units_by_status?.find(s => s.status === 'available')?.count || 0;

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Live overview of property metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy card — only shown when data exists */}
      {occupancyRate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Occupancy Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {/* Rate */}
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{occupancyRate}%</p>
                )}
              </div>

              <Separator orientation="vertical" className="h-10" />

              {/* Occupied vs Vacant */}
              <div className="flex items-center gap-4 text-sm">
                {loading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        Occupied
                      </Badge>
                      <span className="font-medium">{occupiedCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                        Vacant
                      </Badge>
                      <span className="font-medium">{vacantCount}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}