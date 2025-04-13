// components/admin/LandlordDetails.jsx
"use client";

import { Building, Home, Users, CreditCard, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudflareTable } from '@/components/cloudflare/Table';

/**
 * Landlord Details Component
 * Shows specific information for landlord user type
 */
export function LandlordDetails({ landlord, properties = [], tenants = [] }) {
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Create summary metrics 
  const metrics = [
    {
      title: "Properties",
      value: properties.length || 0,
      icon: <Building className="h-5 w-5 text-blue-500" />,
      change: "+12%",
      trend: "up"
    },
    {
      title: "Units",
      value: properties.reduce((acc, property) => acc + (property.units_count || 0), 0),
      icon: <Home className="h-5 w-5 text-green-500" />,
      change: "+5%",
      trend: "up"
    },
    {
      title: "Tenants",
      value: tenants.length || 0,
      icon: <Users className="h-5 w-5 text-purple-500" />,
      change: "0%",
      trend: "neutral"
    },
    {
      title: "Total Income",
      value: formatCurrency(properties.reduce((acc, property) => acc + (property.monthly_income || 0), 0)),
      icon: <CreditCard className="h-5 w-5 text-indigo-500" />,
      change: "+8%",
      trend: "up"
    }
  ];

  // Property table columns
  const propertyColumns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Address',
      accessor: 'address',
      sortable: true,
    },
    {
      header: 'Units',
      accessor: 'units_count',
      sortable: true,
    },
    {
      header: 'Occupied',
      accessor: 'occupied_units',
      sortable: true,
      cell: (row) => `${row.occupied_units || 0}/${row.units_count || 0}`
    },
    {
      header: 'Monthly Income',
      accessor: 'monthly_income',
      sortable: true,
      cell: (row) => formatCurrency(row.monthly_income || 0)
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => {
        const statusColors = {
          active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        };
        
        return (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1) || 'Unknown'}
          </div>
        );
      }
    },
    {
      header: 'Added',
      accessor: 'created_at',
      sortable: true,
      type: 'date',
      cell: (row) => formatDate(row.created_at)
    }
  ];

  // Tenant table columns
  const tenantColumns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Property',
      accessor: 'property_name',
      sortable: true,
    },
    {
      header: 'Unit',
      accessor: 'unit_number',
      sortable: true,
    },
    {
      header: 'Rent',
      accessor: 'rent_amount',
      sortable: true,
      cell: (row) => formatCurrency(row.rent_amount || 0)
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => {
        const statusColors = {
          current: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          late: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          notice: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        };
        
        return (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1) || 'Unknown'}
          </div>
        );
      }
    },
    {
      header: 'Move-in Date',
      accessor: 'move_in_date',
      sortable: true,
      type: 'date',
      cell: (row) => formatDate(row.move_in_date)
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {metric.icon}
                </div>
              </div>
              {metric.change && (
                <div className="mt-2">
                  <span className={`text-xs font-medium ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                    metric.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {metric.trend === 'up' ? '↑ ' : metric.trend === 'down' ? '↓ ' : ''}
                    {metric.change}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Properties owned by this landlord</CardDescription>
          </div>
          <Button size="sm" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            View All Properties
          </Button>
        </CardHeader>
        <CardContent>
          <CloudflareTable
            data={properties}
            columns={propertyColumns}
            pagination={true}
            searchable={true}
            emptyMessage="No properties found for this landlord."
          />
        </CardContent>
      </Card>

      {/* Tenants Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>Tenants renting from this landlord</CardDescription>
          </div>
          <Button size="sm" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            View All Tenants
          </Button>
        </CardHeader>
        <CardContent>
          <CloudflareTable
            data={tenants}
            columns={tenantColumns}
            pagination={true}
            searchable={true}
            emptyMessage="No tenants found for this landlord."
          />
        </CardContent>
      </Card>
    </div>
  );
}