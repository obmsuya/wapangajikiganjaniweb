'use client';

import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Building, Home, UserCheck, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';


export default function PropertiesHeader({ title }) {
  const { summary, loading } = useDashboardSummary();

  const stats = [
    { label: 'Properties', value: summary?.properties?.total_properties ?? 0, icon: Building },
    { label: 'Units',      value: summary?.units?.total_units ?? 0,           icon: Home },
    { label: 'Tenants',    value: summary?.tenants?.total_tenants ?? 0,       icon: UserCheck },
    { label: 'Landlords',  value: summary?.landlords?.total_landlords ?? 0,   icon: User },
  ];

  const occupancy   = summary?.tenants?.occupancy_rate;
  const occupied    = summary?.units?.units_by_status?.find(s => s.status === 'occupied')?.count  ?? 0;
  const vacant      = summary?.units?.units_by_status?.find(s => s.status === 'available')?.count ?? 0;

  return (
    <div className="space-y-2.5">

      {/* Title */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Admin / Properties
        </p>
        <h1 className="text-xl font-medium">{title}</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-muted/40 rounded-lg px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {loading
              ? <Skeleton className="h-7 w-16" />
              : <p className="text-2xl font-medium leading-none">{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Occupancy row */}
      {occupancy && (
        <div className="bg-muted/40 rounded-lg px-4 py-3.5 flex items-center gap-6">
          <div className="shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">Occupancy rate</p>
            {loading
              ? <Skeleton className="h-6 w-20" />
              : <p className="text-xl font-medium leading-none">{occupancy}%</p>
            }
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full"
              style={{ width: `${occupancy}%` }}
            />
          </div>

          {/* Occupied / Vacant legend */}
          <div className="flex gap-4 shrink-0">
            {[
              { label: 'Occupied', count: occupied, active: true },
              { label: 'Vacant',   count: vacant,   active: false },
            ].map(({ label, count, active }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-foreground' : 'bg-border'}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}