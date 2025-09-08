// components/tenant/TenantPaymentDialog.jsx
"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Landmark,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Receipt,
  User,
  MapPin,
  Loader2,
  Clock,
  HandCoins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantPaymentStore } from "@/stores/tenant/useTenantPaymentStore";

const MOBILE_PROVIDERS = [
  { value: 'Mpesa', label: 'Vodacom M-Pesa', icon: '📱' },
  { value: 'Airtel', label: 'Airtel Money', icon: '📱' },
  { value: 'Tigo', label: 'Tigo Pesa', icon: '📱' },
  { value: 'Halopesa', label: 'Halo Pesa', icon: '📱' },
  { value: 'Azampesa', label: 'Azam Pesa', icon: '📱' }
];

const PROCESSING_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  PROCESSING: 'processing',
  WAITING_CALLBACK: 'waiting_callback',
  SUCCESS: 'success',
  FAILED: 'failed'
};

export default function TenantPaymentDialog() {
  const {
    showPaymentDialog,
    setShowPaymentDialog,
    selectedUnit,
    paymentMethod,
    setPaymentMethod,
    paymentFlow,
    setPaymentFlow,
    loading,
    error,
    currentTransaction,
    requiresUnitSelection,
    availableUnits,
    recordManualPayment,
    processSystemPayment,
    resetPaymentFlow,
    clearError,
    formatCurrency
  } = useTenantPaymentStore();

  const [processingState, setProcessingState] = useState(PROCESSING_STATES.IDLE);
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    paymentType: 'mno',
    provider: 'Mpesa',
    accountNumber: '',
    selectedUnitId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Reset form when dialog opens
  useEffect(() => {
    if (showPaymentDialog && selectedUnit) {
      setFormData(prev => ({
        ...prev,
        amount: selectedUnit.rent_amount?.toString() || '',
        selectedUnitId: selectedUnit.unit_id?.toString() || ''
      }));
      setProcessingState(PROCESSING_STATES.IDLE);
      setFormErrors({});
      clearError();
    }
  }, [showPaymentDialog, selectedUnit, clearError]);

  // Handle unit selection requirement
  useEffect(() => {
    if (requiresUnitSelection && availableUnits?.length > 0) {
      setPaymentFlow('unit_selection');
    }
  }, [requiresUnitSelection, availableUnits, setPaymentFlow]);

  const handleCloseDialog = () => {
    setShowPaymentDialog(false);
    resetPaymentFlow();
    setFormData({
      amount: '',
      notes: '',
      paymentType: 'mno', 
      provider: 'Mpesa',
      accountNumber: '',
      selectedUnitId: ''
    });
    setFormErrors({});
    setProcessingState(PROCESSING_STATES.IDLE);
  };

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentFlow('form');
    clearError();
  };

  const handleBack = () => {
    if (paymentFlow === 'form') {
      setPaymentFlow('select');
    } else if (paymentFlow === 'unit_selection') {
      setPaymentFlow('select');
    } else {
      handleCloseDialog();
    }
    clearError();
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    if (formData.amount && parseFloat(formData.amount) > 10000000) {
      errors.amount = 'Amount is too large';
    }

    if (paymentMethod === 'record' && !formData.notes?.trim()) {
      errors.notes = 'Please describe how you made the payment';
    }

    if (paymentMethod === 'pay') {
      if (!formData.accountNumber?.trim()) {
        errors.accountNumber = formData.paymentType === 'mno' 
          ? 'Please enter your mobile number'
          : 'Please enter your account number';
      } else if (formData.paymentType === 'mno') {
        const cleanNumber = formData.accountNumber.replace(/\s/g, '');
        if (!/^\+?[0-9]{10,15}$/.test(cleanNumber)) {
          errors.accountNumber = 'Please enter a valid mobile number';
        }
      }

      if (!formData.provider) {
        errors.provider = 'Please select a payment provider';
      }
    }

    if (requiresUnitSelection && !formData.selectedUnitId) {
      errors.selectedUnitId = 'Please select a unit';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setProcessingState(PROCESSING_STATES.VALIDATING);
    
    try {
      let result;
      
      if (paymentMethod === 'record') {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        result = await recordManualPayment(
          parseFloat(formData.amount),
          formData.selectedUnitId || selectedUnit?.unit_id,
          formData.notes.trim()
        );
      } else if (paymentMethod === 'pay') {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        result = await processSystemPayment(
          formData.selectedUnitId || selectedUnit?.unit_id,
          formData.accountNumber.replace(/\s/g, ''),
          formData.provider,
          formData.paymentType
        );
        
        if (result && !result.requiresUnitSelection) {
          setProcessingState(PROCESSING_STATES.WAITING_CALLBACK);
        }
      }

      if (result?.requiresUnitSelection) {
        setPaymentFlow('unit_selection');
        setProcessingState(PROCESSING_STATES.IDLE);
      } else if (result && !error) {
        setProcessingState(PROCESSING_STATES.SUCCESS);
        setPaymentFlow('success');
      }
    } catch (err) {
      setProcessingState(PROCESSING_STATES.FAILED);
      setPaymentFlow('error');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getProviderName = (provider) => {
    const providerData = MOBILE_PROVIDERS.find(p => p.value === provider);
    return providerData?.label || provider;
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case PROCESSING_STATES.VALIDATING:
        return "Validating payment details...";
      case PROCESSING_STATES.PROCESSING:
        return paymentMethod === 'record' ? "Recording payment..." : "Initiating payment...";
      case PROCESSING_STATES.WAITING_CALLBACK:
        return "Payment initiated. Complete on your phone.";
      default:
        return null;
    }
  };

  const isProcessing = [
    PROCESSING_STATES.VALIDATING,
    PROCESSING_STATES.PROCESSING,
    PROCESSING_STATES.WAITING_CALLBACK
  ].includes(processingState);

  if (!showPaymentDialog) return null;

  return (
    <Dialog open={showPaymentDialog} onOpenChange={handleCloseDialog}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-blue-600" />
            {paymentFlow === 'select' ? 'Make Payment' : 
             paymentFlow === 'unit_selection' ? 'Select Unit' :
             paymentFlow === 'form' ? (paymentMethod === 'record' ? 'Record Payment' : 'Pay Rent') :
             paymentFlow === 'success' ? 'Payment Successful' : 'Payment Failed'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Unit Information Card */}
          {selectedUnit && paymentFlow !== 'unit_selection' && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">{selectedUnit.unit_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedUnit.property_name}</span>
                      {selectedUnit.floor_number && (
                        <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-300">
                          Floor {selectedUnit.floor_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(selectedUnit.rent_amount)}
                    </p>
                    <p className="text-sm text-blue-600">Monthly Rent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unit Selection */}
          {paymentFlow === 'unit_selection' && availableUnits && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Unit</h3>
                <p className="text-gray-600">You have multiple units. Please select which unit this payment is for:</p>
              </div>
              
              <div className="grid gap-3">
                {availableUnits.map((unit) => (
                  <Card 
                    key={unit.unit_id}
                    className={`cursor-pointer border-2 transition-colors ${
                      formData.selectedUnitId === unit.unit_id.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('selectedUnitId', unit.unit_id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{unit.unit_name}</h4>
                          <p className="text-sm text-gray-600">{unit.property_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(unit.rent_amount)}</p>
                          <p className="text-sm text-gray-500">Monthly</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formErrors.selectedUnitId && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.selectedUnitId}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    if (formData.selectedUnitId) {
                      setPaymentFlow('select');
                    }
                  }}
                  disabled={!formData.selectedUnitId}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {paymentFlow === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Choose Payment Method</h3>
                <p className="text-gray-600">How would you like to pay your rent?</p>
              </div>

              <div className="grid gap-4">
                <Card 
                  className="cursor-pointer border-2 hover:border-blue-300 transition-colors"
                  onClick={() => handleMethodSelect('pay')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Pay Now</h3>
                    <p className="text-gray-600 mb-4">
                      Pay directly using mobile money or bank transfer. Your payment will be processed automatically.
                    </p>
                    <Badge className="bg-green-100 text-green-800">Instant Processing</Badge>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer border-2 hover:border-green-300 transition-colors"
                  onClick={() => handleMethodSelect('record')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                      <HandCoins className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Record Payment</h3>
                    <p className="text-gray-600 mb-4">
                      Record a payment you've already made (bank transfer, cash, etc.). Requires landlord confirmation.
                    </p>
                    <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                      Requires Confirmation
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {paymentFlow === 'form' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  disabled={isProcessing}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {paymentMethod === 'record' ? 'Record Your Payment' : 'Pay Your Rent'}
                </h3>
              </div>

              {isProcessing && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-blue-900 font-medium">{getProcessingMessage()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount (TZS) *
                      </Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        value={formData.amount} 
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        required 
                        disabled={isProcessing}
                        className={`text-lg font-semibold mt-1 ${formErrors.amount ? 'border-red-300' : ''}`}
                        placeholder="Enter amount"
                      />
                      {formErrors.amount && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.amount}</p>
                      )}
                    </div>

                    {paymentMethod === 'record' && (
                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Payment Details *
                        </Label>
                        <Textarea 
                          id="notes" 
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Describe how you made the payment (e.g., Bank transfer to account XYZ, Cash payment to landlord, Mobile money to +255...)"
                          rows={3}
                          disabled={isProcessing}
                          className={`mt-1 ${formErrors.notes ? 'border-red-300' : ''}`}
                          required
                        />
                        {formErrors.notes && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          This information helps your landlord verify your payment
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'pay' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            Payment Method *
                          </Label>
                          <RadioGroup 
                            value={formData.paymentType} 
                            onValueChange={(value) => handleInputChange('paymentType', value)}
                            disabled={isProcessing}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                              <RadioGroupItem value="mno" id="mno" />
                              <Label htmlFor="mno" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4 text-blue-600" />
                                  <span>Mobile Money</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Pay with M-Pesa, Airtel Money, Tigo Pesa, etc.
                                </p>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                              <RadioGroupItem value="bank" id="bank" />
                              <Label htmlFor="bank" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Landmark className="h-4 w-4 text-green-600" />
                                  <span>Bank Transfer</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Pay using your bank account
                                </p>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label htmlFor="provider" className="text-sm font-medium">
                            {formData.paymentType === 'mno' ? 'Mobile Money Provider' : 'Bank'} *
                          </Label>
                          <Select 
                            value={formData.provider} 
                            onValueChange={(value) => handleInputChange('provider', value)}
                            disabled={isProcessing}
                          >
                            <SelectTrigger className={`mt-1 ${formErrors.provider ? 'border-red-300' : ''}`}>
                              <SelectValue placeholder={`Select ${formData.paymentType === 'mno' ? 'provider' : 'bank'}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {(formData.paymentType === 'mno' ? MOBILE_PROVIDERS : [
                                { value: 'CRDB', label: 'CRDB Bank' },
                                { value: 'NMB', label: 'NMB Bank' },
                                { value: 'NBC', label: 'NBC Bank' }
                              ]).map((provider) => (
                                <SelectItem key={provider.value} value={provider.value}>
                                  {provider.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.provider && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.provider}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="accountNumber" className="text-sm font-medium">
                            {formData.paymentType === 'mno' ? 'Mobile Number' : 'Account Number'} *
                          </Label>
                          <Input 
                            id="accountNumber" 
                            value={formData.accountNumber}
                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                            placeholder={formData.paymentType === 'mno' ? '+255 123 456 789' : 'Enter account number'}
                            required 
                            disabled={isProcessing}
                            className={`mt-1 ${formErrors.accountNumber ? 'border-red-300' : ''}`}
                          />
                          {formErrors.accountNumber && (
                            <p className="text-sm text-red-600 mt-1">{formErrors.accountNumber}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {getProcessingMessage()}
                      </>
                    ) : (
                      paymentMethod === 'record' ? 'Record Payment' : 'Process Payment'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Success State */}
          {paymentFlow === 'success' && (
            <div className="text-center py-8">
              <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                {paymentMethod === 'record' ? 'Payment Recorded!' : 'Payment Initiated!'}
              </h3>
              <p className="text-green-700 mb-6 max-w-md mx-auto">
                {paymentMethod === 'record' 
                  ? 'Your payment has been recorded and sent to your landlord for confirmation.'
                  : `Complete the payment on your ${getProviderName(formData.provider)} ${formData.paymentType === 'mno' ? 'mobile money' : 'banking'} app.`}
              </p>
              
              {currentTransaction && (
                <Card className="mb-6 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatCurrency(currentTransaction.amount || formData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit:</span>
                        <span className="font-medium">{currentTransaction.unit_name || selectedUnit?.unit_name}</span>
                      </div>
                      {currentTransaction.payment_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reference:</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                            {currentTransaction.payment_id}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button onClick={handleCloseDialog} className="w-full max-w-sm">
                Done
              </Button>
            </div>
          )}

          {/* Error State */}
          {paymentFlow === 'error' && (
            <div className="text-center py-8">
              <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-900 mb-2">Payment Failed</h3>
              <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
              <div className="flex gap-3 max-w-sm mx-auto">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleCloseDialog} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Waiting for callback state */}
          {processingState === PROCESSING_STATES.WAITING_CALLBACK && (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <Clock className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Payment Processing</h3>
              <p className="text-blue-700 mb-6 max-w-md mx-auto">
                Your payment has been initiated. Complete the transaction on your phone to finalize the payment.
              </p>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  className="w-full max-w-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}