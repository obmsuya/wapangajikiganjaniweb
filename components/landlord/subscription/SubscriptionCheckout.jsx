// components/landlord/subscription/SubscriptionCheckout.jsx
"use client";

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscriptionStore } from '@/stores/landlord/useSubscriptionStore';
import { customToast } from '@/components/ui/custom-toast';

const ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect to payment services. Please check your internet connection.",
  INVALID_ACCOUNT: "Please enter a valid account number for the selected payment method.",
  INSUFFICIENT_FUNDS: "Insufficient funds in your account. Please top up and try again.",
  PAYMENT_TIMEOUT: "Payment request timed out. Please try again.",
  PROVIDER_ERROR: "Payment provider is temporarily unavailable. Please try again later.",
  VALIDATION_ERROR: "Please check your payment details and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support."
};

const PROCESSING_STATES = {
  IDLE: 'idle',
  INITIATING: 'initiating',
  PROCESSING: 'processing',
  WAITING_CALLBACK: 'waiting_callback',
  SUCCESS: 'success',
  FAILED: 'failed'
};

export default function SubscriptionCheckout({ selectedPlan, onBack, onSuccess }) {
  const { 
    loading, 
    processMNOPayment, 
    processBankPayment, 
    formatCurrency,
    clearError
  } = useSubscriptionStore();

  const [processingState, setProcessingState] = useState(PROCESSING_STATES.IDLE);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [formData, setFormData] = useState({
    accountNumber: '',
    provider: '',
    bankName: ''
  });
  const [errors, setErrors] = useState({});
  const [transactionId, setTransactionId] = useState(null);

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

  useEffect(() => {
    return () => {
      clearError();
      setProcessingState(PROCESSING_STATES.IDLE);
    };
  }, [clearError]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatUserFriendlyError = (errorMessage) => {
    if (!errorMessage) return ERROR_MESSAGES.UNKNOWN_ERROR;
    
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (lowerError.includes('invalid') || lowerError.includes('account')) {
      return ERROR_MESSAGES.INVALID_ACCOUNT;
    }
    if (lowerError.includes('insufficient') || lowerError.includes('funds')) {
      return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
    }
    if (lowerError.includes('timeout')) {
      return ERROR_MESSAGES.PAYMENT_TIMEOUT;
    }
    if (lowerError.includes('provider') || lowerError.includes('unavailable')) {
      return ERROR_MESSAGES.PROVIDER_ERROR;
    }
    if (lowerError.includes('validation') || lowerError.includes('required')) {
      return ERROR_MESSAGES.VALIDATION_ERROR;
    }
    
    return errorMessage.length > 100 ? ERROR_MESSAGES.UNKNOWN_ERROR : errorMessage;
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
    
    if (!validateForm()) {
      customToast.error("Please fix the errors below");
      return;
    }

    setProcessingState(PROCESSING_STATES.INITIATING);
    
    try {
      let result;
      
      if (paymentMethod === 'mobile') {
        result = await processMNOPayment(
          selectedPlan.id,
          formData.accountNumber.replace(/\s/g, ''),
          formData.provider
        );
      } else {
        result = await processBankPayment(
          selectedPlan.id,
          formData.accountNumber,
          formData.bankName
        );
      }

      if (result.success) {
        setTransactionId(result.transactionId);
        setProcessingState(PROCESSING_STATES.WAITING_CALLBACK);
        
        customToast.success("Payment Initiated", {
          description: "Complete the payment on your phone. You will be notified once processed."
        });

        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
        }, 2000);

      } else {
        const userError = formatUserFriendlyError(result.error);
        setProcessingState(PROCESSING_STATES.FAILED);
        
        customToast.error("Payment Failed", {
          description: userError
        });
      }
    } catch (error) {
      const userError = formatUserFriendlyError(error.message);
      setProcessingState(PROCESSING_STATES.FAILED);
      
      customToast.error("Payment Error", {
        description: userError
      });
    }
  };

  const resetForm = () => {
    setFormData({
      accountNumber: '',
      provider: '',
      bankName: ''
    });
    setPaymentMethod('');
    setErrors({});
    setProcessingState(PROCESSING_STATES.IDLE);
    setTransactionId(null);
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case PROCESSING_STATES.INITIATING:
        return "Initiating payment...";
      case PROCESSING_STATES.PROCESSING:
        return "Processing payment...";
      case PROCESSING_STATES.WAITING_CALLBACK:
        return "Payment initiated. Complete on your phone.";
      default:
        return null;
    }
  };

  const isProcessing = [
    PROCESSING_STATES.INITIATING,
    PROCESSING_STATES.PROCESSING,
    PROCESSING_STATES.WAITING_CALLBACK
  ].includes(processingState);

  if (processingState === PROCESSING_STATES.WAITING_CALLBACK) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Payment Processing</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment has been initiated. Complete the transaction on your phone to activate your subscription.
          </p>
          
          {transactionId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Transaction ID:</p>
              <p className="font-mono text-sm">{transactionId}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="w-full"
            >
              Start New Payment
            </Button>
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="w-full"
            >
              Back to Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isProcessing}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Complete Your Subscription</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label>Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 transition-colors ${
                        paymentMethod === 'mobile' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setPaymentMethod('mobile');
                        handleInputChange('bankName', '');
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-gray-600">Pay via M-Pesa, Airtel, etc.</p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer border-2 transition-colors ${
                        paymentMethod === 'bank' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setPaymentMethod('bank');
                        handleInputChange('provider', '');
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <p className="font-medium">Bank Transfer</p>
                        <p className="text-sm text-gray-600">Pay via bank account</p>
                      </CardContent>
                    </Card>
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-600">{errors.paymentMethod}</p>
                  )}
                </div>

                {paymentMethod === 'mobile' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider">Mobile Money Provider</Label>
                      <Select 
                        value={formData.provider} 
                        onValueChange={(value) => handleInputChange('provider', value)}
                      >
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
                        <p className="text-sm text-red-600 mt-1">{errors.provider}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accountNumber">Phone Number</Label>
                      <Input
                        id="accountNumber"
                        type="tel"
                        placeholder="+255 XXX XXX XXX"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      />
                      {errors.accountNumber && (
                        <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bankName">Bank</Label>
                      <Select 
                        value={formData.bankName} 
                        onValueChange={(value) => handleInputChange('bankName', value)}
                      >
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
                        <p className="text-sm text-red-600 mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="Enter account number"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      />
                      {errors.accountNumber && (
                        <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isProcessing || !paymentMethod}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {getProcessingMessage()}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {formatCurrency(selectedPlan.price)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{selectedPlan.durationDisplay}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Property Limit</span>
                <span>{selectedPlan.propertyLimit} properties</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(selectedPlan.price)}</span>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Secure Payment</p>
                    <p className="text-blue-700">Your payment is protected by bank-level security</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}