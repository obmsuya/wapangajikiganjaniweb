'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Check, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPlanTypeBadgeVariant(planType) {
  const map = { free: 'secondary', basic: 'outline', premium: 'default', enterprise: 'default' };
  return map[planType] || 'outline';
}

function getDurationLabel(duration) {
  const map = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
  return map[duration] || duration;
}

export default function SubscriptionPlansList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen]   = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  const { plans, loading, error, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();

  const handleCreatePlan = async (planData) => {
    try {
      await createPlan(planData);
      setCreateDialogOpen(false);
      toast.success('Plan created successfully');
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const handleUpdatePlan = async (planData) => {
    try {
      await updatePlan({ ...planData, id: currentPlan.id });
      setEditDialogOpen(false);
      toast.success('Plan updated successfully');
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const handleDeletePlan = async () => {
    try {
      await deletePlan(currentPlan.id);
      setDeleteDialogOpen(false);
      toast.success(`"${currentPlan.name}" deleted`);
    } catch {
      toast.error('Failed to delete plan. It may have active subscriptions.');
    }
  };

  const openEditDialog = useCallback((plan) => {
    setCurrentPlan(plan);
    setEditDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((plan) => {
    setCurrentPlan(plan);
    setDeleteDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Subscription plans</h2>
          <p className="text-sm text-muted-foreground">Manage plans and their permissions</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add plan
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Failed to load subscription plans. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-28" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <p className="text-sm">No plans found. Create your first plan to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create subscription plan</DialogTitle>
          </DialogHeader>
          <SubscriptionPlanForm onSubmit={handleCreatePlan} />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit subscription plan</DialogTitle>
          </DialogHeader>
          {currentPlan && (
            <SubscriptionPlanForm
              initialData={currentPlan}
              onSubmit={handleUpdatePlan}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{currentPlan?.name}&rdquo;? This cannot be undone.
              {currentPlan?.active_subscriptions > 0 && (
                <span className="flex items-center gap-2 mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {currentPlan.active_subscriptions} active{' '}
                  {currentPlan.active_subscriptions === 1 ? 'subscription' : 'subscriptions'} on this plan.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
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

function PlanCard({ plan, onEdit, onDelete }) {
  const enabledPermissions = Object.entries(plan.features || {})
    .filter(([, value]) => value === true)
    .map(([key]) => PERMISSION_LABELS[key] || key.replace(/_/g, ' '));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{plan.name}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={getPlanTypeBadgeVariant(plan.plan_type)} className="text-xs capitalize">
                {plan.plan_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getDurationLabel(plan.duration)}
              </Badge>
            </div>
          </div>
          <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
            {plan.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pb-4">
        <div>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(plan.price)}</p>
          <p className="text-xs text-muted-foreground">
            per {plan.duration === 'annual' ? 'year' : plan.duration === 'quarterly' ? '3 months' : 'month'}
          </p>
        </div>

        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
        )}

        <Separator />

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Up to {plan.property_limit} {plan.property_limit === 1 ? 'property' : 'properties'}
          </p>

          {enabledPermissions.length > 0 ? (
            <ul className="space-y-1">
              {enabledPermissions.map((label) => (
                <li key={label} className="flex items-center gap-1.5 text-xs capitalize">
                  <Check className="h-3 w-3 text-primary shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">No extra permissions</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{plan.active_subscriptions ?? 0}</span> active
        </p>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(plan)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(plan)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}