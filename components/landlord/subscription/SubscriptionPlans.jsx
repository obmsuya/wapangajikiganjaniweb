// components/landlord/subscription/SubscriptionPlans.jsx
"use client";

import { useEffect, useState } from 'react';
import { Crown, Check, AlertTriangle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';

export default function SubscriptionPlans({ onSelectPlan }) {
  const { 
    plans, 
    currentSubscription, 
    loading, 
    error, 
    fetchPlans, 
    formatCurrency,
    getPlanTypeColor 
  } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan?.id === planId;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the perfect plan for your property management needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative border-2 transition-all ${
              selectedPlan === plan.id 
                ? 'border-blue-500 shadow-lg' 
                : isCurrentPlan(plan.id)
                ? 'border-green-500'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.planType === 'premium' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            {isCurrentPlan(plan.id) && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-600 text-white px-3 py-1">
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <Badge className={getPlanTypeColor(plan.planType)}>
                  {plan.name}
                </Badge>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {plan.duration}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {plan.propertyLimit === -1 ? 'Unlimited' : plan.propertyLimit} Properties
                  </span>
                </div>

                {plan.features && Object.entries(plan.features).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                ))}
              </div>

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan(plan.id)}
                className={`w-full ${
                  selectedPlan === plan.id 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                variant={isCurrentPlan(plan.id) ? 'outline' : 'default'}
              >
                {isCurrentPlan(plan.id) ? (
                  'Current Plan'
                ) : selectedPlan === plan.id ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                ) : (
                  'Select Plan'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}