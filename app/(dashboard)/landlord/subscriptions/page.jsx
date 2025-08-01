"use client";

import { useState, useEffect } from 'react';
import { Crown, Home, CheckCircle2, ArrowLeft, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CloudflareBreadcrumbs, 
  CloudflarePageHeader 
} from '@/components/cloudflare/Breadcrumbs';
import SubscriptionPlans from '@/components/landlord/subscription/SubscriptionPlans';
import SubscriptionCheckout from '@/components/landlord/subscription/SubscriptionCheckout';
import SubscriptionHistory from '@/components/landlord/subscription/SubscriptionHistory';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';

export default function SubscriptionPage() {
  const [currentStep, setCurrentStep] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const { 
    currentSubscription,
    subscriptionStatus,
    loading,
    fetchCurrentSubscription,
    fetchSubscriptionStatus,
    refreshAllData
  } = useSubscriptionStore();

  useEffect(() => {
    fetchCurrentSubscription();
    fetchSubscriptionStatus();
  }, [fetchCurrentSubscription, fetchSubscriptionStatus]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCurrentStep('checkout');
  };

  const handleBackToPlans = () => {
    setCurrentStep('plans');
    setSelectedPlan(null);
    setPaymentResult(null);
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setCurrentStep('success');
    setTimeout(() => {
      refreshAllData();
    }, 2000);
  };

  const handleViewHistory = () => {
    setCurrentStep('history');
  };

  const handleBackFromHistory = () => {
    setCurrentStep('plans');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/landlord', icon: <Home className="h-4 w-4" /> },
    { label: 'Subscriptions', icon: <Crown className="h-4 w-4" /> }
  ];

  const renderCurrentSubscription = () => {
    if (!currentSubscription) return null;

    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Current Subscription</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">
                    {currentSubscription.plan.name}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {currentSubscription.plan.propertyLimit === -1 
                      ? 'Unlimited properties' 
                      : `${currentSubscription.plan.propertyLimit} properties`
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">
                {currentSubscription.isFreePlan ? 'Free Plan' : 'Active until'}
              </div>
              {!currentSubscription.isFreePlan && (
                <div className="font-medium">
                  {currentSubscription.endDate ? 
                    new Date(currentSubscription.endDate).toLocaleDateString() : 
                    '—'
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'plans':
        return (
          <SubscriptionPlans onSelectPlan={handleSelectPlan} />
        );
      case 'checkout':
        return (
          <SubscriptionCheckout
            selectedPlan={selectedPlan}
            onBack={handleBackToPlans}
            onSuccess={handlePaymentSuccess}
          />
        );
      case 'success':
        return (
          <Card className="p-6 border-blue-300 bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <PartyPopper className="h-8 w-8 text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-1">Payment Successful!</h3>
                <p className="text-sm text-gray-700">
                  Thank you for subscribing. Your subscription has been activated.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button onClick={handleBackToPlans}>Go to Plans</Button>
              <Button variant="secondary" onClick={handleViewHistory}>View History</Button>
            </div>
          </Card>
        );
      case 'history':
        return (
          <SubscriptionHistory />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CloudflareBreadcrumbs items={breadcrumbItems} />

      <CloudflarePageHeader
        title="Subscription Plans"
        description="Manage your property management subscription and unlock premium features"
      />

      {renderCurrentSubscription()}

      <Card className="bg-white border-gray-200">
        <div className="p-6">
          {/* Back Button */}
          {currentStep !== 'plans' && (
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={handleBackToPlans}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}
        </div>
      </Card>
    </div>
  );
}
