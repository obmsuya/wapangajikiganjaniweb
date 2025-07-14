// components/landlord/properties/tabs/PropertyTenantsTab.jsx - CLEANED
"use client";

import { 
  Users, 
  Phone, 
  Eye, 
  UserMinus, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareTable } from "@/components/cloudflare/Table";
import { usePropertyTenants } from "@/hooks/landlord/useTenantManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PropertyTenantsTab({ 
  property, 
  floorData, 
  onViewTenant,
  onVacateTenant,
  onSendReminder
}) {
  // Use the API-based hook instead of floorData extraction
  const { tenants, loading, error, refreshTenants } = usePropertyTenants(property);

  const tenantsColumns = [
    {
      header: 'Tenant',
      accessor: 'tenant.full_name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <div>
            <div className="font-medium">{row.tenant?.full_name || 'Unnamed Tenant'}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {row.tenant?.phone_number || 'No phone'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unit_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.unit_name}</div>
          <div className="text-sm text-gray-500">{row.floor_name}</div>
        </div>
      ),
    },
    {
      header: 'Rent',
      accessor: 'rent_amount',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">
            TSh {parseFloat(row.rent_amount || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 capitalize">
            {row.payment_frequency || 'monthly'}
          </div>
        </div>
      ),
    },
    {
      header: 'Lease Info',
      accessor: 'lease_info',
      cell: (row) => (
        <div className="text-sm">
          <div>Start: {row.move_in_date ? new Date(row.move_in_date).toLocaleDateString() : 'N/A'}</div>
          <div className="text-gray-500 capitalize">Status: {row.status}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewTenant?.(row.tenant, row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendReminder?.(row.tenant)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVacateTenant?.(row.tenant, row)}
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Current Tenants</h3>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Current Tenants</h3>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading tenants: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshTenants} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Current Tenants</h3>
          <p className="text-sm text-gray-500">
            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} currently occupying units
          </p>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This property currently has no tenants assigned to units.
          </p>
        </div>
      ) : (
        <CloudflareTable
          data={tenants}
          columns={tenantsColumns}
          pagination={true}
          searchable={true}
          initialSort={{ field: 'tenant.full_name', direction: 'asc' }}
          emptyMessage="No tenants match your search criteria"
          searchFields={['tenant.full_name', 'tenant.phone_number', 'unit_name', 'floor_name']}
        />
      )}
    </div>
  );
}