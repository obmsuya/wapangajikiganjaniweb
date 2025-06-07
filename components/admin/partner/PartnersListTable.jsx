'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { 
  Filter, 
  Eye, 
  UserX, 
  UserCheck, 
  MoreHorizontal,
  AlertTriangle 
} from 'lucide-react';
import { usePartnersList, usePartnerActions } from '@/hooks/admin/useAdminPartner';
import { toast } from 'sonner';

/**
 * Partners List Table Component
 * 
 * Displays partners in a Cloudflare-style table with management actions
 */
export default function PartnersListTable() {
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, partner: null });
  const [suspensionReason, setSuspensionReason] = useState('');

  const { 
    partners, 
    pagination, 
    loading, 
    filters, 
    updateFilters, 
    refreshPartners 
  } = usePartnersList();

  const { suspendPartner, activatePartner, suspending, activating } = usePartnerActions();

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle partner actions
  const handleAction = async (type, partner) => {
    if (type === 'suspend') {
      setActionDialog({ open: true, type: 'suspend', partner });
      return;
    }

    try {
      if (type === 'activate') {
        await activatePartner(partner.id);
        refreshPartners();
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle suspension
  const handleSuspension = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }

    try {
      await suspendPartner(actionDialog.partner.id, suspensionReason);
      setActionDialog({ open: false, type: null, partner: null });
      setSuspensionReason('');
      refreshPartners();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Table columns
  const columns = [
    {
      header: 'Partner',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.phone_number}</div>
          {row.email && (
            <div className="text-xs text-gray-400">{row.email}</div>
          )}
        </div>
      )
    },
    {
      header: 'Referral Code',
      accessor: 'referral_code',
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="font-mono">
          {row.referral_code}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: true, label: 'Active' },
        { value: false, label: 'Suspended' }
      ],
      cell: (row) => (
        row.is_active ? (
          <Badge className="bg-green-100 text-green-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="destructive">
            <UserX className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      )
    },
    {
      header: 'Referrals',
      accessor: 'total_referrals',
      sortable: true,
      cell: (row) => (
        <div className="text-center">
          <span className="font-medium">{row.total_referrals}</span>
        </div>
      )
    },
    {
      header: 'Total Earned',
      accessor: 'total_earned',
      sortable: true,
      cell: (row) => (
        <div className="text-right font-medium">
          {formatCurrency(row.total_earned)}
        </div>
      )
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => formatDate(row.created_at)
    },
    {
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'View Details',
          icon: <Eye className="h-4 w-4" />,
          onClick: (row) => {
            // TODO: Implement partner details view
            toast.info('Partner details view coming soon');
          }
        },
        {
          label: 'Suspend Partner',
          icon: <UserX className="h-4 w-4" />,
          onClick: (row) => handleAction('suspend', row),
          condition: (row) => row.is_active
        },
        {
          label: 'Activate Partner',
          icon: <UserCheck className="h-4 w-4" />,
          onClick: (row) => handleAction('activate', row),
          condition: (row) => !row.is_active
        }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Partners Management</h3>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Partners</h4>
              
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Name, phone, or referral code"
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => updateFilters({ status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {Object.keys(filters).length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => updateFilters({})}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <CloudflareTable
        data={partners}
        columns={columns.map(col => ({
          ...col,
          actions: col.actions?.filter(action => 
            !action.condition || action.condition
          )
        }))}
        loading={loading}
        pagination={true}
        initialRowsPerPage={20}
        searchable={false}
        emptyMessage="No partners found. Try adjusting your filters."
      />

      {/* Suspension Dialog */}
      <Dialog 
        open={actionDialog.open && actionDialog.type === 'suspend'} 
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, type: null, partner: null });
            setSuspensionReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Suspend Partner
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to suspend <strong>{actionDialog.partner?.name}</strong>. 
              This will prevent them from receiving new referrals.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason</Label>
              <Select
                value={suspensionReason}
                onValueChange={setSuspensionReason}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="violation">Terms Violation</SelectItem>
                  <SelectItem value="fraud">Fraudulent Activity</SelectItem>
                  <SelectItem value="inactive">Inactivity</SelectItem>
                  <SelectItem value="admin">Administrative Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setActionDialog({ open: false, type: null, partner: null });
                setSuspensionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSuspension}
              disabled={suspending || !suspensionReason}
            >
              {suspending ? 'Suspending...' : 'Suspend Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}