'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Check, AlertTriangle, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptionPlans } from '@/hooks/admin/useAdminPayment';
import SubscriptionPlanForm from './SubscriptionPlanForm';

const PERMISSION_LABELS = {
  auto_rent_reminders:    'Auto reminders',
  advanced_reporting:     'Advanced reporting',
  export_reports:         'Export reports',
  sms_notifications:      'SMS notifications',
  can_add_managers:       'Manager accounts',
  online_rent_collection: 'Online rent collection',
  wallet_withdrawals:     'Wallet withdrawals',
};

function formatCurrency(amount) {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function planVariant(type) {
  return { free: 'secondary', basic: 'outline', premium: 'default', enterprise: 'default' }[type] ?? 'outline';
}

function getEnabledFeatures(features = {}) {
  return Object.entries(features)
    .filter(([key, val]) => val === true && PERMISSION_LABELS[key])
    .map(([key]) => PERMISSION_LABELS[key]);
}

// Safely extract the plans array regardless of how the hook wraps it
function extractPlansArray(raw) {
  if (!raw) return [];
  // Hook returns { plans: [...], available_permissions: [...] }
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.plans)) return raw.plans;
  return [];
}

export default function SubscriptionPlansList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent]       = useState(null);

  // Hook may return the full API response shape { plans, available_permissions }
  const raw = useSubscriptionPlans();

  // Destructure carefully — hook might expose plans directly or nested
  const hookPlans      = raw?.plans;
  const createPlan     = raw?.createPlan;
  const updatePlan     = raw?.updatePlan;
  const deletePlan     = raw?.deletePlan;
  const loading        = raw?.loading;
  const error          = raw?.error;

  // Always work with a guaranteed array
  const plans = extractPlansArray(hookPlans);

  const totalSubs = plans.reduce((sum, p) => sum + (p.active_subscriptions ?? 0), 0);

  const handleCreate = async (data) => {
    try {
      await createPlan(data);
      setCreateOpen(false);
      toast.success('Plan created');
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updatePlan({ ...data, id: current.id });
      setEditOpen(false);
      toast.success('Plan updated');
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan(current.id);
      setDeleteOpen(false);
      toast.success(`"${current.name}" deleted`);
    } catch {
      toast.error('Failed to delete — plan may have active subscriptions');
    }
  };

  const openEdit   = useCallback((plan) => { setCurrent(plan); setEditOpen(true); }, []);
  const openDelete = useCallback((plan) => { setCurrent(plan); setDeleteOpen(true); }, []);

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-medium truncate">Subscription plans</h2>
            <p className="text-sm text-muted-foreground truncate">
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'} · {totalSubs} active subscribers
            </p>
          </div>
          <Button size="sm" className="shrink-0 w-auto" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Add plan
          </Button>
        </div>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Failed to load plans. Please refresh.</AlertDescription>
        </Alert>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg border p-5 flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24 mt-1" />
              <Separator />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : plans.length > 0 ? (
          plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              totalSubs={totalSubs}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
            No plans yet. Create your first plan to get started.
          </div>
        )}
      </div>

      {/* Comparison table */}
      {!loading && plans.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Plan comparison
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs">Properties</TableHead>
                    <TableHead className="text-xs">Subscribers</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(plan => (
                    <TableRow key={plan.id} className="h-10">
                      <TableCell className="text-sm font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant={planVariant(plan.plan_type)} className="capitalize text-xs">
                          {plan.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{formatCurrency(plan.price)}</TableCell>
                      <TableCell className="text-sm tabular-nums">{plan.property_limit}</TableCell>
                      <TableCell className="text-sm tabular-nums">{plan.active_subscriptions ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create plan</DialogTitle></DialogHeader>
          <SubscriptionPlanForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit plan</DialogTitle></DialogHeader>
          {current && <SubscriptionPlanForm initialData={current} onSubmit={handleUpdate} />}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{current?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
              {current?.active_subscriptions > 0 && (
                <span className="flex items-center gap-2 mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-xs">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {current.active_subscriptions} active {current.active_subscriptions === 1 ? 'subscription' : 'subscriptions'} will be affected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

function PlanCard({ plan, totalSubs, onEdit, onDelete }) {
  const features    = getEnabledFeatures(plan.features);
  const subsPercent = totalSubs > 0
    ? Math.round(((plan.active_subscriptions ?? 0) / totalSubs) * 100)
    : 0;

  return (
    <div className="rounded-lg border bg-card flex flex-col">
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="font-medium text-sm truncate">{plan.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={planVariant(plan.plan_type)} className="text-xs capitalize">
              {plan.plan_type}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {plan.duration_display ?? plan.duration}
            </Badge>
          </div>
        </div>
        <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
          {plan.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <Separator />

      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(plan.price)}</p>
          {plan.price > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              per {plan.duration === 'annual' ? 'year' : plan.duration === 'quarterly' ? '3 months' : 'month'}
            </p>
          )}
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" />
          Up to {plan.property_limit} {plan.property_limit === 1 ? 'property' : 'properties'}
        </div>
      </div>

      <Separator />

      <div className="p-4 flex-1">
        {features.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {features.map(label => (
              <li key={label} className="flex items-center gap-1.5 text-xs capitalize">
                <Check className="size-3 text-primary shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Basic access only</p>
        )}
      </div>

      <Separator />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5 shrink-0" />
              {plan.active_subscriptions ?? 0} subscribers
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{subsPercent}%</span>
          </div>
          <Progress value={subsPercent} className="h-1.5" />
        </div>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(plan)}>
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(plan)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}