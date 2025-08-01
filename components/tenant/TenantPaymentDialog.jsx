"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

const MNO_PROVIDERS = [
  { value: 'Airtel', label: 'Airtel', image: '/images/providers/airtel.png' },
  { value: 'Tigo', label: 'Tigo Pesa', image: '/images/providers/tigo.png' },
  { value: 'Halopesa', label: 'Halopesa', image: '/images/providers/halopesa.png' },
  { value: 'Mpesa', label: 'M-Pesa', image: '/images/providers/mpesa.png' },
  { value: 'Azampesa', label: 'Azampesa', image: '/images/providers/azampesa.png' }
];

const BANK_PROVIDERS = [
  { value: 'CRDB', label: 'CRDB Bank', image: '/images/providers/crdb.png' },
  { value: 'NMB', label: 'NMB Bank', image: '/images/providers/nmb.png' }
];

export default function TenantPaymentDialog() {
  const { 
    selectedUnit, paymentMethod, paymentFlow, loading, error, currentTransaction, showPaymentDialog,
    setPaymentMethod, setPaymentFlow, resetPaymentFlow, recordManualPayment, processSystemPayment, 
    formatCurrency, setShowPaymentDialog
  } = useTenantPaymentStore();

  const [formData, setFormData] = useState({
    amount: '', notes: '', accountNumber: '+255', provider: 'Tigo', paymentType: 'mno'
  });

  useEffect(() => {
    if (selectedUnit && showPaymentDialog) {
      setFormData(prev => ({ 
        ...prev, 
        amount: selectedUnit.rent_amount?.toString() || '',
        accountNumber: '+255'
      }));
    }
  }, [selectedUnit, showPaymentDialog]);

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
        await recordManualPayment(parseFloat(formData.amount), selectedUnit?.unit_id, formData.notes);
      } else if (paymentMethod === 'pay') {
        await processSystemPayment(selectedUnit?.unit_id, formData.accountNumber, formData.provider, formData.paymentType);
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {paymentFlow === 'select' ? 'Make Payment' : 
             paymentMethod === 'record' ? 'Record Payment' : 'Pay Rent'}
          </DialogTitle>
        </DialogHeader>

        {paymentFlow === 'select' && (
          <div className="space-y-4">
            {selectedUnit && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h3 className="font-semibold text-blue-900">{selectedUnit.unit_name}</h3>
                <p className="text-sm text-blue-700">{selectedUnit.property_name}</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{formatCurrency(selectedUnit.rent_amount)}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-16 flex flex-col items-center justify-center hover:bg-blue-50"
                onClick={() => handleMethodSelect('pay')}
              >
                <Smartphone className="h-6 w-6 text-blue-600 mb-1" />
                <span className="font-medium">Pay Now</span>
                <span className="text-xs text-gray-500">Mobile Money / Bank</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-16 flex flex-col items-center justify-center hover:bg-green-50"
                onClick={() => handleMethodSelect('record')}
              >
                <Building2 className="h-6 w-6 text-green-600 mb-1" />
                <span className="font-medium">Record Payment</span>
                <span className="text-xs text-gray-500">Already paid elsewhere</span>
              </Button>
            </div>
          </div>
        )}

        {paymentFlow === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">Back to options</span>
            </div>

            {selectedUnit && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedUnit.unit_name}</p>
                  <p className="text-sm text-gray-500">{selectedUnit.property_name} • Floor {selectedUnit.floor_number}</p>
                </div>
                <Separator />
              </>
            )}

            <div>
              <Label htmlFor="amount">Amount (TSh)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                required 
                className="text-lg font-medium"
              />
            </div>

            {paymentMethod === 'record' && (
              <div>
                <Label htmlFor="notes">Payment Notes</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="How did you pay? (Bank transfer, cash, etc.)"
                  rows={3}
                />
              </div>
            )}

            {paymentMethod === 'pay' && (
              <>
                <div>
                  <Label>Payment Method</Label>
                  <RadioGroup 
                    value={formData.paymentType} 
                    onValueChange={(value) => setFormData({...formData, paymentType: value, provider: value === 'mno' ? 'Tigo' : 'CRDB'})}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mno" id="mno" />
                      <Label htmlFor="mno">Mobile Money</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank">Bank</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Select Provider</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(formData.paymentType === 'mno' ? MNO_PROVIDERS : BANK_PROVIDERS).map((provider) => (
                      <Button
                        key={provider.value}
                        type="button"
                        variant="outline"
                        className={`h-16 flex flex-col items-center justify-center ${
                          formData.provider === provider.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setFormData({...formData, provider: provider.value})}
                      >
                        <div className="w-8 h-8 mb-1 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs font-medium">{provider.label.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-medium">{provider.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">
                    {formData.paymentType === 'mno' ? 'Mobile Money Number' : 'Account Number'}
                  </Label>
                  <Input 
                    id="phone" 
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    placeholder={formData.paymentType === 'mno' ? '+255 123 456 789' : 'Account number'}
                    required 
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : 
               paymentMethod === 'record' ? 'Record Payment' : 'Initiate Payment'}
            </Button>
          </form>
        )}

        {paymentFlow === 'success' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {paymentMethod === 'record' ? 'Payment Recorded!' : 'Payment Initiated!'}
            </h3>
            <p className="text-green-700 mb-4 text-sm">
              {paymentMethod === 'record' 
                ? 'Your payment has been recorded and sent to your landlord for confirmation.'
                : `Complete the payment on your ${formData.provider} ${formData.paymentType === 'mno' ? 'mobile money' : 'banking app'}.`}
            </p>
            
            {currentTransaction && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{formatCurrency(currentTransaction.amount || formData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit:</span>
                    <span className="font-medium">{currentTransaction.unit_name || selectedUnit?.unit_name}</span>
                  </div>
                  {currentTransaction.payment_id && (
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-mono text-xs">{currentTransaction.payment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button onClick={resetPaymentFlow} className="w-full">Done</Button>
          </div>
        )}

        {paymentFlow === 'error' && (
          <div className="text-center py-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Failed</h3>
            <p className="text-red-700 mb-4 text-sm">{error}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">Try Again</Button>
              <Button onClick={resetPaymentFlow} className="flex-1">Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}