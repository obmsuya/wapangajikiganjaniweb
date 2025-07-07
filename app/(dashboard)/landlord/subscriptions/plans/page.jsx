// app/(dashboard)/landlord/subscription/plans/page.jsx
"use client";

import { useState } from "react";
import { 
  Crown, 
  Check, 
  CreditCard, 
  Building, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubscriptionPlans, useCurrentSubscription, useSubscriptionCheckout } from "@/hooks/landlord/useSubscription";
import SubscriptionService from "@/services/landlord/subscription";
import { toast } from "sonner";

const PlanCard = ({ plan, currentPlan, onSelectPlan, isPopular = false }) => {
  const isCurrentPlan = currentPlan?.planType === plan.planType;
  const savings = SubscriptionService.calculateSavings(plan.price, plan.duration);
  
  return (
    <Card className={`relative transition-all duration-300 hover:shadow-xl ${
      isPopular 
        ? 'border-2 border-purple-500 shadow-lg scale-105' 
        : 'border hover:border-gray-300 dark:hover:border-gray-600'
    } ${isCurrentPlan ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${
            plan.planType === 'premium' 
              ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900' 
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <Crown className={`w-8 h-8 ${
              plan.planType === 'premium' 
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`} />
          </div>
        </div>
        
        <CardTitle className="text-2xl font-bold mb-2">
          {plan.name}
        </CardTitle>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              TZS {plan.price.toLocaleString()}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              /{plan.duration}
            </span>
          </div>
          
          {savings > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Save TZS {savings.toLocaleString()}
              </Badge>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          {plan.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {plan.propertyLimit === 0 ? 'Unlimited' : plan.propertyLimit} Properties
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your property portfolio
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {plan.features && Object.entries(plan.features).map(([feature, enabled]) => {
              if (!enabled) return null;
              
              const featureLabels = {
                unlimited_properties: 'Unlimited Properties',
                advanced_analytics: 'Advanced Analytics',
                priority_support: '24/7 Priority Support',
                tenant_screening: 'Tenant Screening Tools',
                automated_reminders: 'Automated Rent Reminders',
                financial_reports: 'Financial Reports',
                mobile_app: 'Mobile App Access',
                api_access: 'API Access'
              };
              
              return (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {featureLabels[feature] || feature.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <Button
          className={`w-full ${
            isCurrentPlan 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : isPopular 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                : ''
          }`}
          onClick={() => !isCurrentPlan && onSelectPlan(plan)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Current Plan
            </>
          ) : (
            <>
              {plan.planType === 'free' ? 'Downgrade' : 'Upgrade'} to {plan.name}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const PaymentDialog = ({ isOpen, onClose, selectedPlan, onProcessPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState("mno");
  const [paymentData, setPaymentData] = useState({
    accountNumber: "",
    provider: "vodacom",
    bankName: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      await onProcessPayment(paymentMethod, paymentData);
      onClose();
      toast.success("Payment initiated successfully!");
    } catch (error) {
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscribe to {selectedPlan?.name}
          </DialogTitle>
          <DialogDescription>
            Complete your subscription to unlock premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedPlan?.name}</span>
              <span className="text-lg font-bold">
                TZS {selectedPlan?.price.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Billed {selectedPlan?.duration}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mno">Mobile Money</TabsTrigger>
                <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mno" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select 
                    value={paymentData.provider} 
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vodacom">Vodacom M-Pesa</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="tigo">Tigo Pesa</SelectItem>
                      <SelectItem value="halopesa">HaloPesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+255 XXX XXX XXX"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="bank" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Bank Name</Label>
                  <Select 
                    value={paymentData.bankName} 
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, bankName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crdb">CRDB Bank</SelectItem>
                      <SelectItem value="nbc">NBC Bank</SelectItem>
                      <SelectItem value="nmb">NMB Bank</SelectItem>
                      <SelectItem value="exim">EXIM Bank</SelectItem>
                      <SelectItem value="dtb">DTB Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account">Account Number</Label>
                  <Input
                    id="account"
                    placeholder="Enter account number"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !paymentData.accountNumber}
            className="bg-gradient-to-r from-purple-600 to-purple-700"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay TZS {selectedPlan?.price.toLocaleString()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SubscriptionPlansPage() {
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { subscription: currentSubscription } = useCurrentSubscription();
  const { 
    processMNOPayment, 
    processBankPayment, 
    loading: checkoutLoading 
  } = useSubscriptionCheckout();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async (paymentMethod, paymentData) => {
    if (!selectedPlan) return;

    if (paymentMethod === "mno") {
      await processMNOPayment(
        selectedPlan.id,
        paymentData.accountNumber,
        paymentData.provider
      );
    } else {
      await processBankPayment(
        selectedPlan.id,
        paymentData.accountNumber,
        paymentData.bankName
      );
    }
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="text-center py-12">
        <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Error loading plans
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {plansError}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full">
            <Crown className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Unlock the full potential of your property management with our flexible subscription plans
          </p>
        </div>
      </div>

      {/* Current Plan Status */}
      {currentSubscription && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Current Plan: {currentSubscription.planName}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {currentSubscription.daysRemaining !== null && (
                      `${currentSubscription.daysRemaining} days remaining`
                    )}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentSubscription}
            onSelectPlan={handleSelectPlan}
            isPopular={plan.isRecommended || index === 1}
          />
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Features</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { feature: 'Properties', key: 'propertyLimit' },
                  { feature: 'Advanced Analytics', key: 'advanced_analytics' },
                  { feature: 'Priority Support', key: 'priority_support' },
                  { feature: 'Tenant Screening', key: 'tenant_screening' },
                  { feature: 'Automated Reminders', key: 'automated_reminders' },
                  { feature: 'Financial Reports', key: 'financial_reports' },
                  { feature: 'Mobile App', key: 'mobile_app' },
                  { feature: 'API Access', key: 'api_access' }
                ].map(({ feature, key }) => (
                  <tr key={feature} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium">{feature}</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="py-3 px-4 text-center">
                        {key === 'propertyLimit' ? (
                          <span className="text-sm">
                            {plan.propertyLimit === 0 ? 'Unlimited' : plan.propertyLimit}
                          </span>
                        ) : plan.features?.[key] ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you start with our free plan and can upgrade when you need more features.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We accept mobile money (M-Pesa, Airtel Money, Tigo Pesa) and bank transfers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Can I cancel my subscription?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can cancel anytime. You'll still have access until your current period ends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        selectedPlan={selectedPlan}
        onProcessPayment={handleProcessPayment}
      />
    </div>
  );
}