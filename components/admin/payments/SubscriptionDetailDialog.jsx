'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Building,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  CalendarRange,
  ArrowRightCircle,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { useSubscriptionDetails, useSubscriptionPlans, useLandlordPaymentHistory } from '@/hooks/useAdminPayment';

/**
 * Subscription details dialog component
 */
export default function SubscriptionDetailsDialog({ 
  subscriptionId, 
  open, 
  onOpenChange,
  onSubscriptionUpdated
}) {
  const [isClient, setIsClient] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Get subscription details
  const { 
    subscription, 
    loading, 
    error, 
    refreshSubscription,
    updateSubscription
  } = useSubscriptionDetails(subscriptionId);
  
  // Get available plans for renewal
  const { plans } = useSubscriptionPlans();
  
  // Get payment history
  const { 
    history,
    loading: historyLoading,
    refreshHistory
  } = useLandlordPaymentHistory(subscription?.landlord?.id);
  
  // Handle hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP');
  };
  
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
  
  // Get status badge
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
  
  // Calculate percentage of subscription time used
  const getTimePercentage = () => {
    if (!subscription || !subscription.start_date || !subscription.end_date) return 0;
    
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);
    const currentDate = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    
    // Ensure we don't return negative values or values over 100
    if (elapsedDuration < 0) return 0;
    if (elapsedDuration > totalDuration) return 100;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };
  
  // Handle renewal
  const handleRenewal = async () => {
    if (!selectedPlanId) return;
    
    try {
      setLoadingAction(true);
      
      await updateSubscription({
        plan_id: selectedPlanId,
        reset_period: true
      });
      
      setRenewDialogOpen(false);
      refreshSubscription();
      
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (err) {
      console.error('Failed to renew subscription:', err);
    } finally {
      setLoadingAction(false);
    }
  };
  
  // Handle cancellation
  const handleCancellation = async () => {
    try {
      setLoadingAction(true);
      
      await updateSubscription({
        status: 'cancelled'
      });
      
      setCancelDialogOpen(false);
      refreshSubscription();
      
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 bg-error-50 text-error-700 rounded-md">
            <AlertTriangle className="h-5 w-5 inline-block mr-2" />
            Failed to load subscription details. Please try again.
            
            <div className="mt-4">
              <Button onClick={refreshSubscription}>Retry</Button>
            </div>
          </div>
        ) : subscription ? (
          <div className="space-y-6">
            {/* Subscription Header */}
            <Card className="p-5">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(subscription.status, subscription.end_date)}
                    <Badge variant="outline" className="capitalize">
                      {subscription.plan.plan_type}
                    </Badge>
                  </div>
                  
                  <h2 className="text-lg font-semibold">{subscription.plan.name}</h2>
                  
                  <div className="flex items-center text-gray-500 mt-1">
                    <CreditCard className="h-4 w-4 mr-1" />
                    {formatCurrency(subscription.plan.price)}
                    <span className="mx-1">•</span>
                    <CalendarRange className="h-4 w-4 mr-1" />
                    {subscription.plan.duration === 'monthly' ? 'Monthly' : 
                    subscription.plan.duration === 'quarterly' ? 'Quarterly' : 
                    subscription.plan.duration === 'annual' ? 'Annual' : subscription.plan.duration}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center"
                    onClick={() => setRenewDialogOpen(true)}
                    disabled={subscription.status !== 'active'}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Renew/Change Plan
                  </Button>
                  
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Subscription Progress */}
              {subscription.status === 'active' && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(subscription.start_date)}
                    </span>
                    <span>{getTimePercentage()}% used</span>
                    <span className="text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(subscription.end_date)}
                    </span>
                  </div>
                  <Progress value={getTimePercentage()} className="h-2" />
                </div>
              )}
            </Card>
            
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="landlord">Landlord</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="pt-4 space-y-6">
                {/* Subscription Details */}
                <Card className="p-5">
                  <h3 className="text-md font-medium mb-4">Subscription Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500">Subscription ID</p>
                      <p className="font-medium font-mono">{subscription.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{subscription.status}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Auto Renew</p>
                      <p className="font-medium">{subscription.auto_renew ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(subscription.created_at)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(subscription.start_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(subscription.end_date)}</p>
                    </div>
                  </div>
                </Card>
                
                {/* Plan Details */}
                <Card className="p-5">
                  <h3 className="text-md font-medium mb-4">Plan Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm text-gray-500">Plan Name</p>
                      <p className="font-medium">{subscription.plan.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Plan Type</p>
                      <p className="font-medium capitalize">{subscription.plan.plan_type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium capitalize">{subscription.plan.duration}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{formatCurrency(subscription.plan.price)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Property Limit</p>
                      <p className="font-medium">{subscription.plan.property_limit}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Plan Active</p>
                      <p className="font-medium">{subscription.plan.is_active ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  {/* Plan Features */}
                  {subscription.plan.features && Object.keys(subscription.plan.features).length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Features</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(subscription.plan.features).map(([key, value], index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                            <span>{typeof value === 'boolean' ? key : `${key}: ${value}`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Plan Description */}
                  {subscription.plan.description && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-gray-700 dark:text-gray-300">{subscription.plan.description}</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="landlord" className="pt-4">
                {/* Landlord Information */}
                <Card className="p-5">
                  <h3 className="text-md font-medium mb-4">Landlord Details</h3>
                  
                  {subscription.landlord && (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-lg">{subscription.landlord.full_name}</h4>
                          <div className="flex items-center text-gray-500 mt-1">
                            <Phone className="h-4 w-4 mr-1" />
                            {subscription.landlord.phone_number}
                          </div>
                          <div className="flex items-center text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joined: {formatDate(subscription.landlord.date_joined)}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Properties</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl font-bold">
                              {subscription.landlord.property_count || 0}
                            </span>
                            <span className="text-sm text-gray-500">
                              / {subscription.plan.property_limit}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Language</p>
                          <p className="text-xl font-bold mt-1 capitalize">
                            {subscription.landlord.language === 'en' ? 'English' : 
                             subscription.landlord.language === 'sw' ? 'Swahili' : 
                             subscription.landlord.language || '—'}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Status</p>
                          <div className="flex items-center mt-1">
                            {subscription.landlord.is_active ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline">
                          <User className="h-4 w-4 mr-2" />
                          View Landlord Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="payments" className="pt-4">
                {/* Payment History */}
                <Card className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Payment History</h3>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshHistory}
                      disabled={historyLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {historyLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : history && history.transactions && history.transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.transactions
                          .filter(tx => tx.payment_type === 'subscription')
                          .map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {transaction.created_at ? format(new Date(transaction.created_at), 'PPP') : '—'}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                {transaction.status === 'completed' ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    Completed
                                  </Badge>
                                ) : transaction.status === 'failed' ? (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                    Failed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                    {transaction.status}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.azampay?.provider || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No payment history found for this subscription
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No subscription data found or subscription has been deleted
          </div>
        )}
      </DialogContent>
      
      {/* Renew/Change Plan Dialog */}
      <AlertDialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew or Change Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new plan for this subscription. This will cancel the current plan and create a new subscription.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Select Plan</label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name} - {formatCurrency(plan.price)} ({plan.duration})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewal}
              disabled={!selectedPlanId || loadingAction}
              className="bg-primary hover:bg-primary/90"
            >
              {loadingAction ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightCircle className="h-4 w-4 mr-2" />
                  Continue
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? This action cannot be undone and may affect the landlord's property visibility.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>No, Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancellation}
              disabled={loadingAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loadingAction ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Yes, Cancel Subscription
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}