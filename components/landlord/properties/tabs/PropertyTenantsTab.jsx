// components/landlord/properties/tabs/PropertyTenantsTab.jsx
"use client";

import { useMemo } from "react";
import { 
  Users, 
  Phone, 
  Eye, 
  UserMinus, 
  Download,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareTable } from "@/components/cloudflare/Table";

export default function PropertyTenantsTab({ 
  property, 
  floorData, 
  onViewTenant,
  onVacateTenant,
  onSendReminder
}) {
  const occupiedUnits = useMemo(() => {
    if (!property || !floorData) return [];
    
    const units = [];
    Object.values(floorData).forEach(floor => {
      if (floor.units && Array.isArray(floor.units)) {
        floor.units
          .filter(unit => unit.current_tenant)
          .forEach(unit => {
            units.push({
              ...unit,
              floor_name: `Floor ${floor.floor_number}`,
              tenant: unit.current_tenant
            });
          });
      }
    });
    
    return units;
  }, [property, floorData]);

  const handleExportTenantList = () => {
    // Create CSV data
    const csvData = occupiedUnits.map(unit => ({
      tenant_name: unit.tenant.full_name,
      phone_number: unit.tenant.phone_number,
      unit_name: unit.unit_name,
      floor: unit.floor_name,
      rent_amount: unit.rent_amount,
      move_in_date: unit.tenant.move_in_date || 'N/A'
    }));

    // Generate CSV
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property.name}_tenants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Table columns for tenants
  const tenantsColumns = [
    {
      header: 'Tenant',
      accessor: 'tenant.full_name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <div>
            <div className="font-medium">{row.tenant.full_name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {row.tenant.phone_number}
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
        <div className="font-medium">
          TSh {parseFloat(row.rent_amount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Lease Info',
      accessor: 'lease_info',
      cell: (row) => (
        <div className="text-sm">
          <div>Start: {row.tenant.move_in_date || 'N/A'}</div>
          <div className="text-gray-500">Monthly Payment</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewTenant?.(row.tenant, row)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendReminder?.(row.tenant)}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Remind
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVacateTenant?.(row.tenant, row)}
          >
            <UserMinus className="w-4 h-4 mr-1" />
            Vacate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Current Tenants</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportTenantList}
            disabled={occupiedUnits.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
          <Button
            onClick={() => {/* Add new tenant */}}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      <CloudflareTable
        data={occupiedUnits}
        columns={tenantsColumns}
        pagination={true}
        searchable={true}
        initialSort={{ field: 'tenant.full_name', direction: 'asc' }}
        emptyMessage="No tenants found"
      />
    </div>
  );
}