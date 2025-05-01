'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, CreditCard, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { useSubscriptionPlans } from '@/hooks/useAdminPayment';
import SubscriptionPlanForm from './SubscriptionPlanForm';

/**
 * Subscription plans list component showing all plans with CRUD operations
 */
export default function SubscriptionPlansList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  
  // Get subscription plans data
  const { plans, loading, error, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();

  // Format currency to TZS
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle form submissions
  const handleCreatePlan = async (planData) => {
    try {
      await createPlan(planData);
      setCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  const handleUpdatePlan = async (planData) => {
    try {
      await updatePlan({ ...planData, id: currentPlan.id });
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Failed to update plan:', err);
    }
  };

  const handleDeletePlan = async () => {
    try {
      await deletePlan(currentPlan.id);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  // Open edit dialog with plan data
  const openEditDialog = useCallback((plan) => {
    setCurrentPlan(plan);
    setEditDialogOpen(true);
  }, []);

  // Open delete confirmation dialog
  const openDeleteDialog = useCallback((plan) => {
    setCurrentPlan(plan);
    setDeleteDialogOpen(true);
  }, []);

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Card key={index} className="p-5">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-24" />
          <div className="pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </Card>
    ));
  };

  // Get badge color based on plan type
  const getPlanTypeColor = (planType) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'premium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'enterprise':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get badge for plan duration
  const getDurationBadge = (duration) => {
    const durationLabels = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual'
    };
    
    return (
      <Badge variant="outline">
        {durationLabels[duration] || duration}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Subscription Plans</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-error-50 text-error-700 rounded-md">
          Failed to load subscription plans. Please try again.
        </div>
      )}
      
      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          renderSkeletons()
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              formatCurrency={formatCurrency}
              getPlanTypeColor={getPlanTypeColor}
              getDurationBadge={getDurationBadge}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500">
            <p>No subscription plans found. Create your first plan to get started.</p>
          </div>
        )}
      </div>
      
      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
          </DialogHeader>
          <SubscriptionPlanForm onSubmit={handleCreatePlan} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
          </DialogHeader>
          {currentPlan && (
            <SubscriptionPlanForm 
              initialData={currentPlan} 
              onSubmit={handleUpdatePlan} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{currentPlan?.name}" plan?
              {currentPlan?.active_subscriptions > 0 && (
                <div className="mt-2 flex items-center p-2 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>
                    This plan has {currentPlan.active_subscriptions} active
                    {currentPlan.active_subscriptions === 1 ? ' subscription' : ' subscriptions'}.
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePlan}
              className="bg-error-500 hover:bg-error-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Individual plan card component
 */
function PlanCard({ 
  plan, 
  formatCurrency, 
  getPlanTypeColor, 
  getDurationBadge, 
  onEdit, 
  onDelete 
}) {
  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">{plan.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={getPlanTypeColor(plan.plan_type)}>
              {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
            </Badge>
            {getDurationBadge(plan.duration)}
          </div>
        </div>
        {plan.is_active ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-500">
            Inactive
          </Badge>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-bold">
          {formatCurrency(plan.price)}
          <span className="text-sm font-normal text-gray-500 ml-1">
            /{plan.duration === 'annual' ? 'year' : plan.duration === 'quarterly' ? '3 months' : 'month'}
          </span>
        </p>
      </div>
      
      <div className="mt-4 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          {plan.description || 'No description provided.'}
        </p>
      </div>
      
      <div className="mt-4 flex-grow">
        <h4 className="text-sm font-medium mb-2">Features:</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
            <span>Up to {plan.property_limit} properties</span>
          </li>
          {plan.features && Object.entries(plan.features).map(([key, value], idx) => (
            <li key={idx} className="flex items-start">
              <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
              <span>{typeof value === 'boolean' ? key : `${key}: ${value}`}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6 pt-4 border-t border-card-border flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium">{plan.active_subscriptions}</span> active
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(plan)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}