'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle,
  Building, Phone, User, Ban, CreditCard,
} from 'lucide-react';
import { useLandlordPaymentHistory } from '@/hooks/admin/useAdminPayment';

const TRIGGER_CLASS = `
  flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-none border-b-2
  border-transparent bg-transparent text-muted-foreground font-normal
  data-[state=active]:border-foreground data-[state=active]:text-foreground
  data-[state=active]:font-medium data-[state=active]:bg-transparent
  data-[state=active]:shadow-none hover:text-foreground transition-colors -mb-px
`;

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function daysUntil(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status, endDate }) {
  if (!status || !endDate) return <Badge variant="secondary">No subscription</Badge>;
  if (status !== 'active') {
    return (
      <Badge variant="secondary">
        <XCircle data-icon="inline-start" />
        {status === 'cancelled' ? 'Cancelled' : 'Expired'}
      </Badge>
    );
  }
  const days = daysUntil(endDate);
  if (days <= 0)  return <Badge variant="destructive"><XCircle data-icon="inline-start" />Expired</Badge>;
  if (days <= 7)  return <Badge variant="outline" className="border-warning text-warning"><AlertTriangle data-icon="inline-start" />Expiring in {days}d</Badge>;
  return <Badge variant="default"><CheckCircle2 data-icon="inline-start" />Active</Badge>;
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export default function SubscriptionDetailContent({
  landlord, plans, onUpdateSubscription, onSubscriptionUpdated,
}) {
  const [newPlanId, setNewPlanId]           = useState('');
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [cancelOpen, setCancelOpen]         = useState(false);
  const [loading, setLoading]               = useState(false);

  const { history, loading: hLoad } = useLandlordPaymentHistory(landlord.id);

  const sub     = landlord.subscription;
  const subTxns = history?.transactions ?? [];

  // Progress through subscription period
  const pct = (() => {
    if (!sub?.start_date || !sub?.end_date) return 0;
    const elapsed = Date.now() - new Date(sub.start_date).getTime();
    const total   = new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime();
    if (elapsed < 0) return 0;
    if (elapsed > total) return 100;
    return Math.round((elapsed / total) * 100);
  })();

  const handleUpdate = async () => {
    if (!newPlanId) return;
    try {
      setLoading(true);
      await onUpdateSubscription({ landlord_id: landlord.id, plan_id: newPlanId });
      setConfirmOpen(false);
      onSubscriptionUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await onUpdateSubscription({
        landlord_id:     landlord.id,
        subscription_id: sub?.id,
        status:          'cancelled',
      });
      setCancelOpen(false);
      onSubscriptionUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Landlord summary */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="size-11">
              <AvatarFallback>{landlord.full_name?.charAt(0) ?? 'L'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm">{landlord.full_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3" />
                {landlord.phone_number}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                Joined {formatDate(landlord.date_joined)}
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Properties">
              <span>
                {landlord.property_count}
                {sub && <span className="text-muted-foreground"> / {sub.property_limit}</span>}
              </span>
            </Field>
            <Field label="Subscription">
              <StatusBadge status={sub?.status} endDate={sub?.end_date} />
            </Field>
            {sub?.end_date && (
              <Field label="Expires">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 text-muted-foreground" />
                  {formatDate(sub.end_date)}
                </span>
              </Field>
            )}
            {sub && (
              <Field label="Progress">
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="subscription">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-1">
          <TabsTrigger value="subscription" className={TRIGGER_CLASS}>Subscription</TabsTrigger>
          <TabsTrigger value="history"      className={TRIGGER_CLASS}>Payment history</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="mt-4">
          <div className="flex flex-col gap-4">

            {/* Current plan */}
            {sub ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current plan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Plan">{sub.plan_name}</Field>
                    <Field label="Type">
                      <Badge variant="outline" className="capitalize text-xs">{sub.plan_type}</Badge>
                    </Field>
                    <Field label="Price">{formatCurrency(sub.price)}</Field>
                    <Field label="Start">{formatDate(sub.start_date)}</Field>
                    <Field label="End">{formatDate(sub.end_date)}</Field>
                    <Field label="Property limit">{sub.property_limit}</Field>
                  </div>

                  {sub.status === 'active' && (
                    <>
                      <Separator />
                      <Button
                        variant="outline" size="sm"
                        className="w-fit text-destructive hover:text-destructive"
                        onClick={() => setCancelOpen(true)}
                      >
                        <Ban data-icon="inline-start" />
                        Cancel subscription
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-5 text-center">
                  <p className="text-sm text-muted-foreground">No active subscription</p>
                </CardContent>
              </Card>
            )}

            {/* Change plan */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {sub ? 'Change plan' : 'Assign plan'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Select plan
                    </label>
                    <Select value={newPlanId} onValueChange={setNewPlanId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {plans?.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} — {formatCurrency(p.price)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm" disabled={!newPlanId}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <CreditCard data-icon="inline-start" />
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
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
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Plan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subTxns.map((tx, i) => (
                        <TableRow key={i} className="h-11">
                          <TableCell className="text-sm tabular-nums">
                            {formatDate(tx.created_at)}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {tx.payment_type === 'subscription' ? 'Subscription' : 'Rent'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.status === 'completed' ? 'default' :
                                tx.status === 'failed'    ? 'destructive' : 'secondary'
                              }
                              className="text-xs capitalize"
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.subscription?.plan_name ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No payment history found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm plan change */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {sub
                ? `This cancels the current "${sub.plan_name}" plan and assigns a new one.`
                : `This creates a new subscription for ${landlord.full_name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate} disabled={loading}>
              {loading ? 'Updating…' : 'Update subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm cancellation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels {landlord.full_name}'s subscription. Their properties may
              become unavailable depending on your visibility settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel} disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Ban data-icon="inline-start" />
              {loading ? 'Cancelling…' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}