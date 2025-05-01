'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Search, Filter, Eye, AlertTriangle, RefreshCw, CalendarClock, 
  Clock, CheckCircle2, XCircle, Download, Share, MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { useLandlordSubscriptions, useSubscriptionPlans } from '@/hooks/useAdminPayment';
import SubscriptionDetailContent from './SubscriptionDetailContent';

/**
 * Landlord subscriptions list component with filtering capabilities
 */
export default function LandlordSubscriptionsList() {
  // State for detail dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // Get landlord subscriptions and plans
  const { 
    subscriptions, 
    loading, 
    error, 
    filters, 
    updateFilters,
    refreshSubscriptions,
    updateSubscription
  } = useLandlordSubscriptions();
  
  const { plans } = useSubscriptionPlans();
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Format currency to TZS
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
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
  
  // Get status badge color
  const getStatusBadge = (status, endDate) => {
    if (status !== 'active') {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-500">
          <XCircle className="h-3 w-3 mr-1" />
          {status === 'cancelled' ? 'Cancelled' : 'Expired'}
        </Badge>
      );
    }
    
    // Check if subscription is expiring soon (within 7 days)
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return (
        <Badge variant="outline" className="border-red-400 text-red-500">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    } else if (daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expiring soon
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
  };
  
  // Handle opening the details dialog
  const handleViewDetails = useCallback((landlord) => {
    setSelectedLandlord(landlord);
    setDetailsOpen(true);
  }, []);

  // Export data
  const handleExportData = useCallback(() => {
    // In a real implementation, this would generate a CSV or Excel file
    alert('This would export subscription data as CSV/Excel');
  }, []);
  
  // Table columns configuration
  const columns = [
    {
      header: 'Landlord',
      accessor: 'full_name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.full_name}</div>
          <div className="text-sm text-gray-500">{row.phone_number}</div>
        </div>
      )
    },
    {
      header: 'Plan',
      accessor: 'plan_name',
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div>
          {row.subscription ? (
            <div>
              <span className="font-medium">{row.subscription.plan_name}</span>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(row.subscription.price)}
                {' / '}
                {row.subscription.plan_type}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">No active plan</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      cell: (row) => (
        row.subscription ? (
          getStatusBadge(row.subscription.status, row.subscription.end_date)
        ) : (
          <Badge variant="outline" className="border-gray-400 text-gray-500">
            No subscription
          </Badge>
        )
      )
    },
    {
      header: 'Properties',
      accessor: 'property_count',
      sortable: true,
      cell: (row) => (
        <div className="text-center">
          <span className="font-medium">{row.property_count}</span>
          {row.subscription && (
            <span className="text-xs text-gray-500 ml-1">
              / {row.subscription.property_limit}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Joined',
      accessor: 'date_joined',
      sortable: true,
      cell: (row) => formatDate(row.date_joined)
    },
    {
      header: 'Expiry',
      accessor: 'end_date',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          {row.subscription?.end_date ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    {formatDate(row.subscription.end_date)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subscription expires on {new Date(row.subscription.end_date).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'View Details',
          icon: <Eye className="h-4 w-4" />,
          onClick: handleViewDetails
        }
      ]
    }
  ];

  // Transform subscriptions data for the table
  const tableData = subscriptions?.map(landlord => ({
    id: landlord.id,
    full_name: landlord.full_name,
    phone_number: landlord.phone_number,
    property_count: landlord.property_count,
    date_joined: landlord.date_joined,
    subscription: landlord.subscription,
    plan_name: landlord.subscription?.plan_name || '',
    status: landlord.subscription?.status || '',
    end_date: landlord.subscription?.end_date || ''
  })) || [];

  // Calculate summary stats
  const summaryStats = {
    total: tableData.length,
    active: tableData.filter(row => row.subscription?.status === 'active' && new Date(row.subscription?.end_date) > new Date()).length,
    expiring: tableData.filter(row => {
      if (!row.subscription?.end_date || row.subscription?.status !== 'active') return false;
      const endDate = new Date(row.subscription.end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    }).length,
    expired: tableData.filter(row => {
      if (!row.subscription?.end_date) return false;
      return new Date(row.subscription.end_date) <= new Date() || row.subscription?.status === 'expired';
    }).length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Landlord Subscriptions</h2>
        
        <div className="flex items-center gap-2">
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
                <h3 className="font-medium">Filter Subscriptions</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Name or phone number"
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
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan_type">Plan Type</Label>
                  <Select
                    value={filters.plan_type || ''}
                    onValueChange={(value) => updateFilters({ plan_type: value })}
                  >
                    <SelectTrigger id="plan_type">
                      <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={refreshSubscriptions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Summary Stats */}
      {isClient && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="text-sm text-gray-500">Total Landlords</div>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
          </Card>
          
          <Card className="p-3">
            <div className="text-sm text-gray-500">Active Subscriptions</div>
            <div className="text-2xl font-bold text-green-600">{summaryStats.active}</div>
          </Card>
          
          <Card className="p-3">
            <div className="text-sm text-gray-500">Expiring Soon</div>
            <div className="text-2xl font-bold text-amber-600">{summaryStats.expiring}</div>
          </Card>
          
          <Card className="p-3">
            <div className="text-sm text-gray-500">Expired/Cancelled</div>
            <div className="text-2xl font-bold text-gray-500">{summaryStats.expired}</div>
          </Card>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md">
          Failed to load subscriptions. Please try again.
        </div>
      )}
      
      {/* Subscriptions table */}
      <CloudflareTable
        data={tableData}
        columns={columns}
        loading={loading}
        pagination={true}
        initialRowsPerPage={10}
        searchable={false} // We're handling search in our own filters
        emptyMessage="No landlords found. Try adjusting your filters."
      />
      
      {/* Subscription details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedLandlord && (
            <SubscriptionDetailContent 
              landlord={selectedLandlord}
              plans={plans}
              onUpdateSubscription={updateSubscription}
              onSubscriptionUpdated={() => {
                setDetailsOpen(false);
                refreshSubscriptions();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}