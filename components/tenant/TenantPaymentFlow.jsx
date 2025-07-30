"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTenantPaymentStore } from '@/stores/tenant/useTenantPaymentStore';

const PROVIDERS = [
  { value: 'Airtel', label: 'Airtel', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Tigo', label: 'Tigo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Halopesa', label: 'Halopesa', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Azampesa', label: 'Azampesa', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'Mpesa', label: 'M-Pesa', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CRDB', label: 'CRDB Bank', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'NMB', label: 'NMB Bank', color: 'bg-gray-100 text-gray-800 border-gray-200' }
];

export default function TenantPaymentFlow() {
  const { 
    selectedUnit, 
    paymentMethod, 
    paymentFlow, 
    loading, 
    error, 
    currentTransaction,
    occupancies,
    setPaymentMethod, 
    setPaymentFlow, 
    resetPaymentFlow,
    recordManualPayment,
    processSystemPayment,
    formatCurrency,
    fetchOccupancies,
    getOccupancyByUnitId
  } = useTenantPaymentStore();

  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    accountNumber: '',
    provider: 'Tigo'
  });

  useEffect(() => {
    if (occupancies.length === 0) {
      fetchOccupancies();
    }
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      const occupancy = getOccupancyByUnitId(selectedUnit.unit_id);
      if (occupancy) {
        setFormData(prev => ({
          ...prev,
          amount: occupancy.rent_amount.toString()
        }));
      }
    }
  }, [selectedUnit]);

  const handleBack = () => {
    if (paymentFlow === 'form') {
      setPaymentFlow('select');
    } else {
      resetPaymentFlow();
    }
  };

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentFlow('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUnit) return;
    
    try {
      if (paymentMethod === 'record') {
        await recordManualPayment(
          selectedUnit.unit_id,
          parseFloat(formData.amount),
          formData.notes
        );
      } else if (paymentMethod === 'pay') {
        await processSystemPayment(
          selectedUnit.unit_id,
          formData.accountNumber,
          formData.provider
        );
      }
    } catch (error) {
    }
  };

  const getProviderColor = (providerValue) => {
    const provider = PROVIDERS.find(p => p.value === providerValue);
    return provider ? provider.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (paymentFlow === 'select') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Choose Payment Option
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedUnit && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900">{selectedUnit.unit_name}</h3>
              <p className="text-sm text-blue-700">{selectedUnit.property_name}</p>
              <p className="text-xl font-bold text-blue-900 mt-2">
                {formatCurrency(selectedUnit.rent_amount)}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => handleMethodSelect('pay')}
            >
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Pay Now</span>
              <span className="text-xs text-muted-foreground">Mobile Money Payment</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => handleMethodSelect('record')}
            >
              <Building2 className="h-6 w-6 text-green-600" />
              <span className="font-medium">Record Payment</span>
              <span className="text-xs text-muted-foreground">Already paid elsewhere</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentFlow === 'form') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              {paymentMethod === 'record' ? 'Record Your Payment' : 'Pay Your Rent'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedUnit && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedUnit.unit_name} - {selectedUnit.property_name}</p>
                  <p className="text-sm text-muted-foreground">Floor {selectedUnit.floor_number}</p>
                </div>
                <Separator />
              </>
            )}

            <div>
              <Label htmlFor="amount">Amount (TZS)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>

            {paymentMethod === 'record' && (
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional details..."
                />
              </div>
            )}

            {paymentMethod === 'pay' && (
              <>
                <div>
                  <Label htmlFor="accountNumber">Phone Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    placeholder="+255..."
                    required
                  />
                </div>

                <div>
                  <Label>Payment Provider</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PROVIDERS.map((provider) => (
                      <Button
                        key={provider.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`justify-start ${formData.provider === provider.value ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setFormData({...formData, provider: provider.value})}
                      >
                        <Badge className={`${provider.color} mr-2`} variant="outline">
                          {provider.label}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 
               paymentMethod === 'record' ? 'Record Payment' : 'Pay Rent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (paymentFlow === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            {paymentMethod === 'record' ? 'Payment Recorded' : 'Payment Started'}
          </h3>
          <p className="text-green-700 mb-4">
            {paymentMethod === 'record' 
              ? 'Your payment has been recorded and sent to your landlord for confirmation.'
              : 'Complete the payment on your mobile device to finish the transaction.'}
          </p>
          {currentTransaction && (
            <div className="space-y-2 text-sm bg-white p-4 rounded-lg">
              <p><strong>Amount:</strong> {formatCurrency(currentTransaction.amount || formData.amount)}</p>
              <p><strong>Unit:</strong> {currentTransaction.unit_name || selectedUnit?.unit_name}</p>
              {currentTransaction.payment_id && (
                <p><strong>Reference:</strong> {currentTransaction.payment_id}</p>
              )}
              {currentTransaction.transaction_id && (
                <p><strong>Transaction ID:</strong> {currentTransaction.transaction_id}</p>
              )}
              {paymentMethod === 'pay' && (
                <Badge className={getProviderColor(formData.provider)}>
                  {PROVIDERS.find(p => p.value === formData.provider)?.label}
                </Badge>
              )}
            </div>
          )}
          <Button onClick={resetPaymentFlow} className="mt-6">
            Make Another Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentFlow === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Failed</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleBack}>
              Try Again
            </Button>
            <Button onClick={resetPaymentFlow}>
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}