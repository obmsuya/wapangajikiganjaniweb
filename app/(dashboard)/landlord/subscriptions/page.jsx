// app/(dashboard)/landlord/subscription/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { 
  Crown, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Smartphone,
  Building2,
  ArrowRight,
  RefreshCw,
  Zap,
  Shield,
  Calendar,
  Star,
  Banknote,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CloudflareTable } from '@/components/cloudflare/Table';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: '',
    provider: '',
    accountNumber: '',
    bankName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    loading,
    error,
    plans,
    currentSubscription,
    subscriptionStatus,
    subscriptionHistory,
    fetchPlans,
    fetchCurrentSubscription,
    fetchSubscriptionStatus,
    fetchSubscriptionHistory,
    processMNOPayment,
    processBankPayment,
    cancelSubscription,
    formatCurrency,
    getPlanTypeColor,
    getSubscriptionStatusColor,
    refreshAllData
  } = useSubscriptionStore();

  // Mobile providers available in Tanzania
  const mobileProviders = [
    { value: 'Airtel', label: 'Airtel Money', icon: '📱' },
    { value: 'Tigo', label: 'Tigo Pesa', icon: '📱' },
    { value: 'Halopesa', label: 'Halo Pesa', icon: '📱' },
    { value: 'Azampesa', label: 'Azam Pesa', icon: '📱' },
    { value: 'Mpesa', label: 'M-Pesa', icon: '📱' }
  ];

  const banks = [
    { value: 'CRDB', label: 'CRDB Bank', icon: '🏦' },
    { value: 'NMB', label: 'NMB Bank', icon: '🏦' },
    { value: 'NBC', label: 'NBC Bank', icon: '🏦' },
    { value: 'Equity', label: 'Equity Bank', icon: '🏦' },
    { value: 'Exim', label: 'Exim Bank', icon: '🏦' }
  ];

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchPlans(),
        fetchCurrentSubscription(),
        fetchSubscriptionStatus(),
        fetchSubscriptionHistory()
      ]);
    };
    
    initializeData();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentData.method) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsProcessing(true);
    
    try {
      let response;
      
      if (paymentData.method === 'mobile') {
        response = await processMNOPayment(
          selectedPlan.id,
          paymentData.accountNumber,
          paymentData.provider
        );
      } else if (paymentData.method === 'bank') {
        response = await processBankPayment(
          selectedPlan.id,
          paymentData.accountNumber,
          paymentData.bankName
        );
      }

      if (response?.success) {
        setShowCheckout(false);
        setShowSuccess(true);
        await refreshAllData();
        
        setTimeout(() => {
          setShowSuccess(false);
          setActiveTab('current');
        }, 5000);
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSubscriptionProgress = () => {
    if (!currentSubscription || !subscriptionStatus) return 0;
    
    const startDate = new Date(currentSubscription.startDate);
    const endDate = new Date(currentSubscription.endDate);
    const now = new Date();
    
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    
    const endDate = new Date(currentSubscription.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Table columns for subscription history
  const historyColumns = [
    {
      header: 'Plan',
      accessor: 'planName',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <div>
            <div className="font-medium">{row.planName}</div>
            <Badge 
              variant="secondary" 
              className={getPlanTypeColor(row.planType)}
            >
              {row.planType}
            </Badge>
          </div>
        </div>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration',
      cell: (row) => (
        <div>
          <div>{new Date(row.startDate).toLocaleDateString()}</div>
          <div className="text-sm text-gray-500">
            to {new Date(row.endDate).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge className={getSubscriptionStatusColor(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.price)}</span>
      )
    }
  ];

  if (loading && !plans.length) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshAllData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Subscription Status Card */}
      {currentSubscription && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Details */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Plan Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <Badge className={getPlanTypeColor(currentSubscription.plan.planType)}>
                      {currentSubscription.plan.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge className={getSubscriptionStatusColor(currentSubscription.status)}>
                      {currentSubscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatCurrency(currentSubscription.plan.price)}</span>
                  </div>
                </div>
              </div>

              {/* Duration & Progress */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Duration</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Started:</span>
                    <span>{new Date(currentSubscription.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expires:</span>
                    <span>{new Date(currentSubscription.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Days left:</span>
                    <span className="font-medium text-orange-600">{getDaysRemaining()}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(getSubscriptionProgress())}%</span>
                  </div>
                  <Progress value={getSubscriptionProgress()} className="h-2" />
                </div>
              </div>

              {/* Property Limits */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Property Limits</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Limit:</span>
                    <span className="font-medium">
                      {currentSubscription.plan.propertyLimit === -1 
                        ? 'Unlimited' 
                        : currentSubscription.plan.propertyLimit
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Used:</span>
                    <span>{subscriptionStatus?.propertyCounts?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available:</span>
                    <span className="text-green-600 font-medium">
                      {currentSubscription.plan.propertyLimit === -1 
                        ? '∞' 
                        : Math.max(0, currentSubscription.plan.propertyLimit - (subscriptionStatus?.propertyCounts?.total || 0))
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Due Warning */}
      {subscriptionStatus && getDaysRemaining() < 7 && getDaysRemaining() > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800">Payment Due Soon</h4>
                <p className="text-orange-700">
                  Your subscription expires in {getDaysRemaining()} days. Renew now to avoid service interruption.
                </p>
              </div>
              <Button 
                onClick={() => setActiveTab('plans')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Renew Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Current
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Choose Your Plan</h2>
            <p className="text-muted-foreground">Select the perfect plan for your property management needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative transition-all hover:shadow-lg ${plan.planType === 'premium' ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : ''}`}>
                {plan.planType === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <Badge className={getPlanTypeColor(plan.planType)}>
                    {plan.planType}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatCurrency(plan.price)}</div>
                    <div className="text-muted-foreground">per {plan.durationDisplay}</div>
                  </div>

                  {/* Plan Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Property Limit:</span>
                      <span className="font-medium">
                        {plan.propertyLimit === -1 ? 'Unlimited' : plan.propertyLimit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Duration:</span>
                      <span className="font-medium">{plan.durationDisplay}</span>
                    </div>
                  </div>

                  {/* Features */}
                  {plan.features && Object.keys(plan.features).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Features:</h4>
                      <div className="space-y-2">
                        {Object.entries(plan.features).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm capitalize">
                              {key.replace('_', ' ')}: {value ? 'Yes' : 'No'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={currentSubscription?.plan?.id === plan.id}
                    variant={plan.planType === 'premium' ? 'default' : 'outline'}
                  >
                    {currentSubscription?.plan?.id === plan.id ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Choose Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Current Subscription Tab */}
        <TabsContent value="current" className="space-y-6">
          {currentSubscription ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Plan Name</Label>
                      <div className="font-medium">{currentSubscription.plan.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Plan Type</Label>
                      <div className="mt-1">
                        <Badge className={getPlanTypeColor(currentSubscription.plan.planType)}>
                          {currentSubscription.plan.planType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge className={getSubscriptionStatusColor(currentSubscription.status)}>
                          {currentSubscription.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Auto Renew</Label>
                      <div className="font-medium">{currentSubscription.autoRenew ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Billing Period</Label>
                    <div className="text-sm space-y-1">
                      <div>Started: {new Date(currentSubscription.startDate).toLocaleDateString()}</div>
                      <div>Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('plans')}
                      className="flex-1"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={cancelSubscription}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usage Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {subscriptionStatus?.propertyCounts?.total || 0}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Total Properties</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-xl font-semibold text-green-600">
                        {subscriptionStatus?.propertyCounts?.total || 0}
                      </div>
                      <div className="text-xs text-green-600">Active</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold text-gray-600">
                        {currentSubscription.plan.propertyLimit === -1 
                          ? '∞' 
                          : Math.max(0, currentSubscription.plan.propertyLimit - (subscriptionStatus?.propertyCounts?.total || 0))
                        }
                      </div>
                      <div className="text-xs text-gray-600">Available</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Property Limit Usage</Label>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Used</span>
                        <span>
                          {subscriptionStatus?.propertyCounts?.total || 0} / {
                            currentSubscription.plan.propertyLimit === -1 
                              ? '∞' 
                              : currentSubscription.plan.propertyLimit
                          }
                        </span>
                      </div>
                      <Progress 
                        value={
                          currentSubscription.plan.propertyLimit === -1 
                            ? 0 
                            : ((subscriptionStatus?.propertyCounts?.total || 0) / currentSubscription.plan.propertyLimit) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have an active subscription. Choose a plan to get started.
                  </p>
                  <Button onClick={() => setActiveTab('plans')}>
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Subscription History</h2>
            <p className="text-muted-foreground">View all your past and current subscriptions</p>
          </div>

          {subscriptionHistory?.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <CloudflareTable
                  data={subscriptionHistory}
                  columns={historyColumns}
                  pagination={true}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No History</h3>
                  <p className="text-muted-foreground">
                    Your subscription history will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Subscribe to {selectedPlan?.name} for {formatCurrency(selectedPlan?.price || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select 
                value={paymentData.method} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, method: value, provider: '', bankName: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile Money
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Money Options */}
            {paymentData.method === 'mobile' && (
              <>
                <div>
                  <Label className="text-sm font-medium">Mobile Provider</Label>
                  <Select 
                    value={paymentData.provider} 
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your mobile provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {mobileProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            {provider.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g., +255712345678"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Bank Transfer Options */}
            {paymentData.method === 'bank' && (
              <>
                <div>
                  <Label className="text-sm font-medium">Bank</Label>
                  <Select 
                    value={paymentData.bankName} 
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, bankName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.value} value={bank.value}>
                          <div className="flex items-center gap-2">
                            <span>{bank.icon}</span>
                            {bank.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Account Number</Label>
                  <Input
                    type="text"
                    placeholder="Enter your account number"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Payment Summary */}
            {selectedPlan && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>{selectedPlan.durationDisplay}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Property Limit:</span>
                  <span>{selectedPlan.propertyLimit === -1 ? 'Unlimited' : selectedPlan.propertyLimit}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedPlan.price)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={
                isProcessing || 
                !paymentData.method || 
                !paymentData.accountNumber ||
                (paymentData.method === 'mobile' && !paymentData.provider) ||
                (paymentData.method === 'bank' && !paymentData.bankName)
              }
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(selectedPlan?.price || 0)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription>
              Your subscription has been activated successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Subscription Active</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>Plan: {selectedPlan?.name}</div>
                <div>Duration: {selectedPlan?.durationDisplay}</div>
                <div>Amount: {formatCurrency(selectedPlan?.price || 0)}</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">What's Next?</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All your properties are now visible</li>
                <li>• You can add up to {selectedPlan?.propertyLimit === -1 ? 'unlimited' : selectedPlan?.propertyLimit} properties</li>
                <li>• Access to premium features</li>
                <li>• Priority customer support</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              <Building2 className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}