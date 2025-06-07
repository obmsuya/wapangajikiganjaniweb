'use client';

import { useDashboardSummary } from '@/hooks/admin/useAdminProperties';
import { Building, Home, UserCheck, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Header component for the Properties Dashboard
 * Displays key property metrics in card format
 */
export default function PropertiesHeader({ title }) {
  const { summary, loading } = useDashboardSummary();

  // Prepare stats cards data
  const statsCards = [
    {
      title: 'Total Properties',
      value: summary?.properties?.total_properties || 0,
      icon: <Building className="h-8 w-8 text-blue-500" />,
      className: 'bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900'
    },
    {
      title: 'Total Units',
      value: summary?.units?.total_units || 0,
      icon: <Home className="h-8 w-8 text-emerald-500" />,
      className: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900'
    },
    {
      title: 'Total Tenants',
      value: summary?.tenants?.total_tenants || 0,
      icon: <UserCheck className="h-8 w-8 text-purple-500" />,
      className: 'bg-purple-50 dark:bg-purple-950 border-purple-100 dark:border-purple-900'
    },
    {
      title: 'Total Landlords',
      value: summary?.landlords?.total_landlords || 0,
      icon: <User className="h-8 w-8 text-amber-500" />,
      className: 'bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index} className={`border ${card.className}`}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                {loading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                )}
              </div>
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {summary?.tenants?.occupancy_rate && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-100">Overall Occupancy Rate</p>
              {loading ? (
                <Skeleton className="h-8 w-20 mt-1 bg-blue-200/50" />
              ) : (
                <h3 className="text-2xl font-bold mt-1">{summary.tenants.occupancy_rate}%</h3>
              )}
            </div>
            <div className="text-sm">
              {loading ? (
                <Skeleton className="h-16 w-28 bg-blue-200/50" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="block w-3 h-3 rounded-full bg-green-400"></span>
                    <span>Occupied: {summary?.units?.units_by_status?.find(s => s.status === 'occupied')?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="block w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span>Vacant: {summary?.units?.units_by_status?.find(s => s.status === 'available')?.count || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}