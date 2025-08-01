"use client";

import { useState } from "react";
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
  MapPin
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
import { useTenantPaymentStore } from "@/stores/tenant/useTenantPaymentStore";

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
    recordManualPayment,
    processSystemPayment,
    resetPaymentFlow,
    formatCurrency
  } = useTenantPaymentStore();

  const [formData, setFormData] = useState({
    amount: selectedUnit?.rent_amount || '',
    notes: '',
    paymentType: 'mno',
    provider: 'vodacom',
    accountNumber: ''
  });

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentFlow('form');
  };

  const handleBack = () => {
    if (paymentFlow === 'form') {
      setPaymentFlow('select');
    } else {
      resetPaymentFlow();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (paymentMethod === 'record') {
        await recordManualPayment(
          parseFloat(formData.amount), 
          selectedUnit?.unit_id, 
          formData.notes
        );
      } else if (paymentMethod === 'pay') {
        await processSystemPayment(
          selectedUnit?.unit_id, 
          formData.accountNumber, 
          formData.provider, 
          formData.paymentType
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getProviderName = (provider) => {
    const providers = {
      vodacom: 'Vodacom M-Pesa',
      tigo: 'Tigo Pesa',
      airtel: 'Airtel Money',
      halopesa: 'Halo Pesa'
    };
    return providers[provider] || provider;
  };

  if (!showPaymentDialog) return null;

  return (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-blue-600" />
            {paymentFlow === 'select' ? 'Make Payment' : 
             paymentFlow === 'form' ? (paymentMethod === 'record' ? 'Record Payment' : 'Pay Rent') :
             paymentFlow === 'success' ? 'Payment Successful' : 'Payment Failed'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Unit Information Card */}
          {selectedUnit && (
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

          {/* Payment Method Selection */}
          {paymentFlow === 'select' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Choose Payment Method</h3>
                <p className="text-gray-600 text-sm mb-6">Select how you would like to make your rent payment</p>
              </div>
              
              <div className="grid gap-4">
                <Card className="cursor-pointer hover:shadow-md border-2 hover:border-blue-300 transition-all"
                      onClick={() => handleMethodSelect('pay')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">Pay Now</h4>
                        <p className="text-gray-600 text-sm">Mobile Money or Bank Transfer</p>
                        <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
                          Instant Processing
                        </Badge>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md border-2 hover:border-green-300 transition-all"
                      onClick={() => handleMethodSelect('record')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Receipt className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">Record Payment</h4>
                        <p className="text-gray-600 text-sm">Already paid through other means</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-300">
                          Manual Verification
                        </Badge>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {paymentFlow === 'form' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-gray-600">
                  {paymentMethod === 'record' ? 'Recording Payment' : 'Processing Payment'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount (TSh) *
                      </Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        value={formData.amount} 
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        required 
                        className="text-lg font-semibold mt-1"
                        placeholder="Enter amount"
                      />
                    </div>

                    {paymentMethod === 'record' && (
                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Payment Notes *
                        </Label>
                        <Textarea 
                          id="notes" 
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Describe how you made the payment (e.g., Bank transfer to account XYZ, Cash payment to landlord, etc.)"
                          rows={3}
                          className="mt-1"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This information helps verify your payment
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
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                              <RadioGroupItem value="mno" id="mno" />
                              <Label htmlFor="mno" className="flex items-center gap-2 cursor-pointer flex-1">
                                <Smartphone className="h-4 w-4 text-green-600" />
                                <span>Mobile Money</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                              <RadioGroupItem value="bank" id="bank" />
                              <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                                <Landmark className="h-4 w-4 text-blue-600" />
                                <span>Bank Transfer</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {formData.paymentType === 'mno' && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Mobile Money Provider *
                            </Label>
                            <RadioGroup 
                              value={formData.provider} 
                              onValueChange={(value) => handleInputChange('provider', value)}
                              className="grid grid-cols-2 gap-3"
                            >
                              {['vodacom', 'tigo', 'airtel', 'halopesa'].map((provider) => (
                                <div key={provider} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                                  <RadioGroupItem value={provider} id={provider} />
                                  <Label htmlFor={provider} className="cursor-pointer text-sm">
                                    {getProviderName(provider)}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}

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
                            className="mt-1"
                          />
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
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1"
                  >
                    {loading ? 'Processing...' : 
                     paymentMethod === 'record' ? 'Record Payment' : 'Process Payment'}
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
              
              <Button onClick={resetPaymentFlow} className="w-full max-w-sm">
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
                <Button onClick={resetPaymentFlow} className="flex-1">
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