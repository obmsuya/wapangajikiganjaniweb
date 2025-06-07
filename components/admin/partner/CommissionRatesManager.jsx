'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Edit
} from 'lucide-react';
import { useCommissionRates } from '@/hooks/admin/useAdminPartner';
import { toast } from 'sonner';

/**
 * Commission Rates Manager Component
 * 
 * Manages commission rates for subscription plans in Cloudflare style
 */
export default function CommissionRatesManager() {
  const [editDialog, setEditDialog] = useState({ open: false, rates: [] });
  const [bulkRates, setBulkRates] = useState({});

  const { rates, loading, updating, updateRates, refreshRates } = useCommissionRates();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle bulk edit
  const handleBulkEdit = () => {
    const allPlans = [
      ...(rates?.plans_with_rates || []),
      ...(rates?.plans_without_rates || [])
    ];
    
    const initialRates = {};
    allPlans.forEach(plan => {
      initialRates[plan.plan_id] = plan.commission_percentage || 0;
    });
    
    setBulkRates(initialRates);
    setEditDialog({ open: true, rates: allPlans });
  };

  // Handle rate change
  const handleRateChange = (planId, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0 || numValue > 100) {
      toast.error('Commission rate must be between 0% and 100%');
      return;
    }
    setBulkRates(prev => ({ ...prev, [planId]: numValue }));
  };

  // Save commission rates
  const handleSaveRates = async () => {
    try {
      const ratesArray = Object.entries(bulkRates).map(([planId, rate]) => ({
        plan_id: parseInt(planId),
        commission_percentage: parseFloat(rate)
      }));

      await updateRates(ratesArray);
      setEditDialog({ open: false, rates: [] });
      setBulkRates({});
    } catch (error) {
      // Error handled by hook
    }
  };

  // Table columns for configured rates
  const configuredColumns = [
    {
      header: 'Plan',
      accessor: 'plan_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.plan_name}</div>
          <div className="text-sm text-gray-500 capitalize">{row.plan_type}</div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'plan_price',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {formatCurrency(row.plan_price)}
        </div>
      )
    },
    {
      header: 'Commission Rate',
      accessor: 'commission_percentage',
      sortable: true,
      cell: (row) => (
        <Badge className="bg-green-100 text-green-800">
          {row.commission_percentage}%
        </Badge>
      )
    },
    {
      header: 'Last Updated',
      accessor: 'updated_at',
      sortable: true,
      cell: (row) => (
        row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'
      )
    },
    {
      header: 'Updated By',
      accessor: 'created_by',
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.created_by || '—'}
        </span>
      )
    }
  ];

  // Table columns for unconfigured rates
  const unconfiguredColumns = [
    {
      header: 'Plan',
      accessor: 'plan_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.plan_name}</div>
          <div className="text-sm text-gray-500 capitalize">{row.plan_type}</div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'plan_price',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {formatCurrency(row.plan_price)}
        </div>
      )
    },
    {
      header: 'Commission Rate',
      accessor: 'commission_percentage',
      cell: () => (
        <Badge variant="outline" className="border-amber-400 text-amber-600">
          Not Configured
        </Badge>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Commission Rates Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure commission percentages for subscription plans
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshRates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={handleBulkEdit}
            disabled={updating}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Rates
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm text-gray-500">Configured Plans</div>
              <div className="text-xl font-bold">
                {rates?.configured_plans || 0}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <div className="text-sm text-gray-500">Unconfigured Plans</div>
              <div className="text-xl font-bold">
                {rates?.unconfigured_plans || 0}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Total Plans</div>
              <div className="text-xl font-bold">
                {rates?.total_plans || 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Configured Plans */}
      {rates?.plans_with_rates?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-green-700">Configured Commission Rates</h4>
          <CloudflareTable
            data={rates.plans_with_rates}
            columns={configuredColumns}
            pagination={false}
            searchable={false}
            emptyMessage="No configured commission rates"
          />
        </div>
      )}

      {/* Unconfigured Plans */}
      {rates?.plans_without_rates?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-amber-700">Plans Without Commission Rates</h4>
          <CloudflareTable
            data={rates.plans_without_rates}
            columns={unconfiguredColumns}
            pagination={false}
            searchable={false}
            emptyMessage="All plans have commission rates configured"
          />
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => {
        if (!open) {
          setEditDialog({ open: false, rates: [] });
          setBulkRates({});
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Commission Rates</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editDialog.rates.map((plan) => (
              <div key={plan.plan_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{plan.plan_name}</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(plan.plan_price)} / {plan.plan_type}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`rate-${plan.plan_id}`} className="sr-only">
                    Commission rate for {plan.plan_name}
                  </Label>
                  <Input
                    id={`rate-${plan.plan_id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    value={bulkRates[plan.plan_id] || ''}
                    onChange={(e) => handleRateChange(plan.plan_id, e.target.value)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialog({ open: false, rates: [] });
                setBulkRates({});
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRates}
              disabled={updating}
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}