'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle,
  Building, Phone, User, CalendarClock, FileText, Ban
} from 'lucide-react';
import { useLandlordPaymentHistory } from '@/hooks/admin/useAdminPayment';

/**
 * Subscription detail content component for the landlord subscription dialog
 */
export default function SubscriptionDetailContent({ 
  landlord, 
  plans, 
  onUpdateSubscription,
  onSubscriptionUpdated
}) {
  const [newPlanId, setNewPlanId] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  
  // Get payment history
  const { history, loading: historyLoading } = useLandlordPaymentHistory(landlord.id);
  
  // Format currency to TZS
  const formatCurrency = (amount) => {
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
  
  // Handle updating subscription
  const handleUpdateSubscription = async () => {
    if (!newPlanId) return;
    
    try {
      setLoadingUpdate(true);
      await onUpdateSubscription({
        landlord_id: landlord.id,
        plan_id: newPlanId
      });
      setConfirmDialogOpen(false);
      onSubscriptionUpdated();
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setLoadingUpdate(false);
    }
  };
  
  // Handle cancelling subscription
  const handleCancelSubscription = async () => {
    try {
      setLoadingUpdate(true);
      // Call the API to cancel the subscription
      await onUpdateSubscription({
        landlord_id: landlord.id,
        subscription_id: landlord.subscription?.id,
        status: 'cancelled'
      });
      setCancelDialogOpen(false);
      onSubscriptionUpdated();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setLoadingUpdate(false);
    }
  };
  
  // Get subscription status badge
  const getStatusBadge = (status, endDate) => {
    if (!status || !endDate) {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-500">
          No subscription
        </Badge>
      );
    }
    
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
          Expiring soon ({daysUntilExpiry} days)
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
  
  // Payment history columns
  const paymentColumns = [
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => formatDate(row.created_at)
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => formatCurrency(row.amount)
    },
    {
      header: 'Type',
      accessor: 'payment_type',
      sortable: true,
      cell: (row) => (
        <Badge variant="outline">
          {row.payment_type === 'subscription' ? 'Subscription' : 'Rent Payment'}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        row.status === 'completed' ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Completed
          </Badge>
        ) : row.status === 'failed' ? (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Failed
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
            {row.status}
          </Badge>
        )
      )
    },
    {
      header: 'Plan',
      cell: (row) => (
        row.payment_type === 'subscription' && row.subscription ? (
          <span>{row.subscription.plan_name}</span>
        ) : (
          <span>—</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Landlord Details */}
      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              Landlord
            </h3>
            <p className="mt-1">{landlord.full_name}</p>
          </div>
          <div>
            <h3 className="font-medium flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              Phone Number
            </h3>
            <p className="mt-1">{landlord.phone_number}</p>
          </div>
          <div>
            <h3 className="font-medium flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              Properties
            </h3>
            <p className="mt-1">
              {landlord.property_count} 
              {landlord.subscription && (
                <span className="text-gray-500">
                  {' '}/{' '}{landlord.subscription.property_limit}
                </span>
              )}
            </p>
          </div>
          <div>
            <h3 className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              Joined
            </h3>
            <p className="mt-1">{formatDate(landlord.date_joined)}</p>
          </div>
          <div className="col-span-2">
            <h3 className="font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              Subscription Status
            </h3>
            <div className="mt-1 flex items-center">
              {getStatusBadge(
                landlord.subscription?.status,
                landlord.subscription?.end_date
              )}
              
              {landlord.subscription && (
                <span className="ml-3 text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Expires: {formatDate(landlord.subscription.end_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-4 pt-4">
          {/* Current Plan */}
          {landlord.subscription ? (
            <Card className="p-5">
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Plan Name</p>
                  <p className="font-medium">{landlord.subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan Type</p>
                  <p className="font-medium capitalize">{landlord.subscription.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{formatCurrency(landlord.subscription.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(landlord.subscription.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(landlord.subscription.end_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Property Limit</p>
                  <p className="font-medium">{landlord.subscription.property_limit}</p>
                </div>
              </div>
              
              {/* Cancel button */}
              {landlord.subscription.status === 'active' && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <h3 className="text-lg font-semibold">No Active Subscription</h3>
              <p className="text-gray-500 mt-2">This landlord doesn't have an active subscription.</p>
            </Card>
          )}
          
          {/* Change Plan */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold">Change Subscription Plan</h3>
            <div className="mt-4 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow">
                <p className="text-sm text-gray-500 mb-2">Select a New Plan</p>
                <Select
                  value={newPlanId}
                  onValueChange={setNewPlanId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} ({formatCurrency(plan.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!newPlanId}
                onClick={() => setConfirmDialogOpen(true)}
              >
                Update Subscription
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment-history" className="pt-4">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            
            <CloudflareTable
              data={history?.transactions || []}
              columns={paymentColumns}
              loading={historyLoading}
              pagination={true}
              initialRowsPerPage={5}
              searchable={false}
              emptyMessage="No payment history found."
            />
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirm Plan Change Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {landlord.subscription ? (
                <span>
                  This will cancel the current "{landlord.subscription.plan_name}" plan and
                  assign a new plan to this landlord. Are you sure?
                </span>
              ) : (
                <span>
                  This will create a new subscription for {landlord.full_name}.
                  Are you sure?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingUpdate}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateSubscription}
              disabled={loadingUpdate}
              className="bg-primary"
            >
              {loadingUpdate ? 'Updating...' : 'Update Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirm Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the current subscription for {landlord.full_name}.
              Their properties may become unavailable based on your visibility settings.
              Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingUpdate}>No, Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={loadingUpdate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loadingUpdate ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}