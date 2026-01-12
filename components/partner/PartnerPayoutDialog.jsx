"use client";

import { useState, useEffect } from 'react';
import { Wallet, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePartnerStore } from '@/stores/partner/usePartnerStore';

export default function PartnerPayoutDialog() {
  const { 
    showPayoutDialog, 
    setShowPayoutDialog,
    payoutEligibility,
    loading,
    requestPayout,
    checkPayoutEligibility,
    formatCurrency 
  } = usePartnerStore();

  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showPayoutDialog) {
      checkPayoutEligibility();
    }
  }, [showPayoutDialog, checkPayoutEligibility]);

  const validateForm = () => {
    const newErrors = {};
    const amountValue = parseFloat(amount);

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountValue < 1000) {
      newErrors.amount = 'Minimum payout is TZS 1,000';
    } else if (payoutEligibility && amountValue > payoutEligibility.availableAmount) {
      newErrors.amount = 'Amount exceeds available balance';
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await requestPayout(amount, phoneNumber);
    if (result.success) {
      setAmount('');
      setPhoneNumber('');
      setErrors({});
    }
  };

  const handleClose = () => {
    setShowPayoutDialog(false);
    setAmount('');
    setPhoneNumber('');
    setErrors({});
  };

  const setMaxAmount = () => {
    if (payoutEligibility?.availableAmount) {
      setAmount(payoutEligibility.availableAmount.toString());
    }
  };

  return (
    <Dialog open={showPayoutDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw your commission earnings to mobile money
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance Display */}
          {payoutEligibility && (
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="text-2xl font-bold">
                {formatCurrency(payoutEligibility.availableAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Minimum payout: {formatCurrency(1000)}
              </div>
            </div>
          )}

          {/* Eligibility Warning */}
          {payoutEligibility && !payoutEligibility.canPayout && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {payoutEligibility.reason}
                {payoutEligibility.shortfall > 0 && (
                  <span className="block mt-1">
                    You need {formatCurrency(payoutEligibility.shortfall)} more.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          {payoutEligibility?.canPayout && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (TZS)</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                        setErrors(prev => ({ ...prev, amount: '' }));
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={setMaxAmount}>
                    Max
                  </Button>
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Mobile Money Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+255712345678"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setErrors(prev => ({ ...prev, phoneNumber: '' }));
                    }}
                    className="pl-10"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Processing Time</p>
                <p>Payouts are processed within 1-3 business days</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Processing...' : 'Request Payout'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}