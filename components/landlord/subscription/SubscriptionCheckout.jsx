// components/landlord/subscription/SubscriptionCheckout.jsx
"use client";

import { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';

export default function SubscriptionCheckout({ selectedPlan, onBack, onSuccess }) {
  const { 
    loading, 
    processMNOPayment, 
    processBankPayment, 
    formatCurrency 
  } = useSubscriptionStore();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [formData, setFormData] = useState({
    accountNumber: '',
    provider: '',
    bankName: ''
  });
  const [errors, setErrors] = useState({});

  const mobileProviders = [
    { value: 'Airtel', label: 'Airtel Money' },
    { value: 'Tigo', label: 'Tigo Pesa' },
    { value: 'Halopesa', label: 'Halo Pesa' },
    { value: 'Azampesa', label: 'Azam Pesa' },
    { value: 'Mpesa', label: 'M-Pesa' }
  ];

  const banks = [
    { value: 'CRDB', label: 'CRDB Bank' },
    { value: 'NMB', label: 'NMB Bank' },
    { value: 'NBC', label: 'NBC Bank' },
    { value: 'Equity', label: 'Equity Bank' },
    { value: 'Exim', label: 'Exim Bank' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (paymentMethod === 'mobile' && !/^\+?[0-9]{10,15}$/.test(formData.accountNumber.replace(/\s/g, ''))) {
      newErrors.accountNumber = 'Please enter a valid phone number';
    }

    if (paymentMethod === 'mobile' && !formData.provider) {
      newErrors.provider = 'Please select a mobile money provider';
    }

    if (paymentMethod === 'bank' && !formData.bankName) {
      newErrors.bankName = 'Please select a bank';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let result;
      
      if (paymentMethod === 'mobile') {
        result = await processMNOPayment(
          selectedPlan.id,
          formData.accountNumber,
          formData.provider
        );
      } else if (paymentMethod === 'bank') {
        result = await processBankPayment(
          selectedPlan.id,
          formData.accountNumber,
          formData.bankName
        );
      }

      if (result.success && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
        <h2 className="text-xl font-semibold">Complete Your Subscription</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Badge className="mb-1">{selectedPlan.name}</Badge>
                <p className="text-sm text-gray-600">{selectedPlan.duration}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Property Limit</span>
                <span>
                  {selectedPlan.propertyLimit === -1 ? 'Unlimited' : selectedPlan.propertyLimit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duration</span>
                <span>{selectedPlan.durationDisplay}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(selectedPlan.price)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card 
                    className={`cursor-pointer border-2 transition-all ${
                      paymentMethod === 'mobile' ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('mobile')}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Mobile Money</span>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer border-2 transition-all ${
                      paymentMethod === 'bank' ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Bank Transfer</span>
                    </CardContent>
                  </Card>
                </div>
                {errors.paymentMethod && (
                  <p className="text-sm text-red-600">{errors.paymentMethod}</p>
                )}
              </div>

              {/* Mobile Money Form */}
              {paymentMethod === 'mobile' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Mobile Money Provider</Label>
                    <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {mobileProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.provider && (
                      <p className="text-sm text-red-600">{errors.provider}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+255712345678"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      className={errors.accountNumber ? 'border-red-300' : ''}
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-600">{errors.accountNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Transfer Form */}
              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank">Bank</Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bankName && (
                      <p className="text-sm text-red-600">{errors.bankName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account">Account Number</Label>
                    <Input
                      id="account"
                      type="text"
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      className={errors.accountNumber ? 'border-red-300' : ''}
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-600">{errors.accountNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading || !paymentMethod}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  'Processing Payment...'
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {formatCurrency(selectedPlan.price)}
                  </>
                )}
              </Button>

              {/* Payment Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Payment Information</p>
                    <p>You will receive an SMS prompt to complete the payment. Follow the instructions to authorize the transaction.</p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}