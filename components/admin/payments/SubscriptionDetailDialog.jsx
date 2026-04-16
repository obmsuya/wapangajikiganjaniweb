'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Building, User, Phone, Calendar, Clock, CheckCircle2,
  XCircle, AlertTriangle, CreditCard, RefreshCw,
  CalendarRange, ArrowRightCircle, Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useSubscriptionDetails, useSubscriptionPlans, useLandlordPaymentHistory,
} from '@/hooks/admin/useAdminPayment';

const TRIGGER_CLASS = `
  flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-none border-b-2
  border-transparent bg-transparent text-muted-foreground font-normal
  data-[state=active]:border-foreground data-[state=active]:text-foreground
  data-[state=active]:font-medium data-[state=active]:bg-transparent
  data-[state=active]:shadow-none hover:text-foreground transition-colors -mb-px
`;

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '—';
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return format(new Date(dateString), 'PPP');
}

// Returns days until expiry — negative means expired
function daysUntilExpiry(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status, endDate }) {
  if (!status || !endDate) {
    return <Badge variant="secondary">No subscription</Badge>;
  }
  if (status !== 'active') {
    return (
      <Badge variant="secondary">
        <XCircle data-icon="inline-start" />
        {status === 'cancelled' ? 'Cancelled' : 'Expired'}
      </Badge>
    );
  }
  const days = daysUntilExpiry(endDate);
  if (days <= 0) {
    return <Badge variant="destructive"><XCircle data-icon="inline-start" />Expired</Badge>;
  }
  if (days <= 7) {
    return (
      <Badge variant="outline" className="border-warning text-warning">
        <AlertTriangle data-icon="inline-start" />
        Expiring in {days}d
      </Badge>
    );
  }
  return <Badge variant="default"><CheckCircle2 data-icon="inline-start" />Active</Badge>;
}

function getTimePercentage(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start   = new Date(startDate).getTime();
  const end     = new Date(endDate).getTime();
  const elapsed = Date.now() - start;
  if (elapsed < 0) return 0;
  if (elapsed > end - start) return 100;
  return Math.round((elapsed / (end - start)) * 100);
}

// Shared labeled field
function Field({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function SubscriptionDetailsDialog({
  subscriptionId, open, onOpenChange, onSubscriptionUpdated,
}) {
  const [renewOpen, setRenewOpen]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [selectedPlanId, setSelected]   = useState('');
  const [loadingAction, setLoading]     = useState(false);

  const { subscription, loading, error, refreshSubscription, updateSubscription } =
    useSubscriptionDetails(subscriptionId);
  const { plans }                   = useSubscriptionPlans();
  const { history, loading: hLoad } = useLandlordPaymentHistory(subscription?.landlord?.id);

  const handleRenewal = async () => {
    if (!selectedPlanId) return;
    try {
      setLoading(true);
      await updateSubscription({ plan_id: selectedPlanId, reset_period: true });
      setRenewOpen(false);
      refreshSubscription();
      onSubscriptionUpdated?.();
    } finally {
      setLoading(false);
    }
  };

  const handleCancellation = async () => {
    try {
      setLoading(true);
      await updateSubscription({ status: 'cancelled' });
      setCancelOpen(false);
      refreshSubscription();
      onSubscriptionUpdated?.();
    } finally {
      setLoading(false);
    }
  };

  const pct = subscription
    ? getTimePercentage(subscription.start_date, subscription.end_date)
    : 0;

  const subTxns = history?.transactions?.filter(t => t.payment_type === 'subscription') ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription className="flex items-center justify-between">
              Failed to load subscription details.
              <Button size="sm" variant="outline" onClick={refreshSubscription}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : subscription ? (
          <div className="flex flex-col gap-6">

            {/* Summary card */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        status={subscription.status}
                        endDate={subscription.end_date}
                      />
                      <Badge variant="outline" className="capitalize">
                        {subscription.plan.plan_type}
                      </Badge>
                    </div>
                    <p className="text-base font-semibold">{subscription.plan.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="size-3.5" />
                      {formatCurrency(subscription.plan.price)}
                      <span>·</span>
                      <CalendarRange className="size-3.5" />
                      <span className="capitalize">{subscription.plan.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 flex-wrap">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setRenewOpen(true)}
                      disabled={subscription.status !== 'active'}
                    >
                      <RefreshCw data-icon="inline-start" />
                      Change plan
                    </Button>
                    {subscription.status === 'active' && (
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCancelOpen(true)}
                      >
                        <Ban data-icon="inline-start" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {subscription.status === 'active' && (
                  <div className="flex flex-col gap-1.5 mt-5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(subscription.start_date)}</span>
                      <span>{pct}% elapsed</span>
                      <span>{formatDate(subscription.end_date)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-1">
                {['details', 'landlord', 'payments'].map(t => (
                  <TabsTrigger key={t} value={t} className={TRIGGER_CLASS}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Details tab */}
              <TabsContent value="details" className="mt-4">
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="ID"         value={subscription.id}          mono />
                        <Field label="Status"     value={subscription.status}      />
                        <Field label="Auto renew" value={subscription.auto_renew ? 'Enabled' : 'Disabled'} />
                        <Field label="Created"    value={formatDate(subscription.created_at)} />
                        <Field label="Start"      value={formatDate(subscription.start_date)} />
                        <Field label="End"        value={formatDate(subscription.end_date)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Name"           value={subscription.plan.name} />
                        <Field label="Type"           value={subscription.plan.plan_type} />
                        <Field label="Duration"       value={subscription.plan.duration} />
                        <Field label="Price"          value={formatCurrency(subscription.plan.price)} />
                        <Field label="Property limit" value={subscription.plan.property_limit} />
                        <Field label="Active"         value={subscription.plan.is_active ? 'Yes' : 'No'} />
                      </div>

                      {subscription.plan.description && (
                        <>
                          <Separator />
                          <p className="text-sm text-muted-foreground">
                            {subscription.plan.description}
                          </p>
                        </>
                      )}

                      {subscription.plan.features && (
                        <>
                          <Separator />
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {Object.entries(subscription.plan.features)
                              .filter(([, v]) => v === true)
                              .map(([key]) => (
                                <li key={key} className="flex items-center gap-1.5 text-xs capitalize">
                                  <CheckCircle2 className="size-3 text-primary shrink-0" />
                                  {key.replace(/_/g, ' ')}
                                </li>
                              ))}
                          </ul>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Landlord tab */}
              <TabsContent value="landlord" className="mt-4">
                {subscription.landlord && (
                  <Card>
                    <CardContent className="pt-5 flex flex-col gap-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-12">
                          <AvatarFallback>
                            {subscription.landlord.full_name?.charAt(0) ?? 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{subscription.landlord.full_name}</p>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3.5" />
                            {subscription.landlord.phone_number}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="size-3.5" />
                            Joined {formatDate(subscription.landlord.date_joined)}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          {
                            label: 'Properties',
                            value: `${subscription.landlord.property_count ?? 0} / ${subscription.plan.property_limit}`,
                          },
                          {
                            label: 'Language',
                            value: subscription.landlord.language === 'sw' ? 'Swahili' : 'English',
                          },
                          {
                            label: 'Account',
                            value: subscription.landlord.is_active ? 'Active' : 'Inactive',
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-muted/40 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <p className="text-sm font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Payments tab */}
              <TabsContent value="payments" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Payment history</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hLoad ? (
                      <Skeleton className="h-48 w-full" />
                    ) : subTxns.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Amount</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Provider</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subTxns.map((tx, i) => (
                              <TableRow key={i} className="h-11">
                                <TableCell className="text-sm tabular-nums">
                                  {tx.created_at ? format(new Date(tx.created_at), 'PP') : '—'}
                                </TableCell>
                                <TableCell className="text-sm tabular-nums">
                                  {formatCurrency(tx.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    tx.status === 'completed' ? 'default' :
                                    tx.status === 'failed'    ? 'destructive' : 'secondary'
                                  } className="text-xs capitalize">
                                    {tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {tx.azampay?.provider ?? '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No payment history for this subscription
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Subscription not found or has been deleted
          </p>
        )}
      </DialogContent>

      {/* Renew dialog */}
      <AlertDialog open={renewOpen} onOpenChange={setRenewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change plan</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the current plan and creates a new subscription.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Select plan
            </label>
            <Select value={selectedPlanId} onValueChange={setSelected}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {plans?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — {formatCurrency(p.price)} ({p.duration})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewal}
              disabled={!selectedPlanId || loadingAction}
            >
              <ArrowRightCircle data-icon="inline-start" />
              {loadingAction ? 'Processing…' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone and may affect the landlord's property visibility.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancellation}
              disabled={loadingAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Ban data-icon="inline-start" />
              {loadingAction ? 'Cancelling…' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}