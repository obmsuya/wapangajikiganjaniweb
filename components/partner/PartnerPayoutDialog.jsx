"use client";

import { useState, useEffect } from 'react';
import { Wallet, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

    // Validate amount
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

    // Validate phone number
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
    
    if (!validateForm()) {
      return;
    }

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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
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
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Request Payout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Info */}
          {payoutEligibility && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Available Balance</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(payoutEligibility.availableAmount)}
              </p>
              <p className="text-xs text-blue-700">
                Minimum payout: {formatCurrency(payoutEligibility.minimumPayout)}
              </p>
            </div>
          )}

          {/* Eligibility Check */}
          {payoutEligibility && !payoutEligibility.canPayout && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {payoutEligibility.reason}
                {payoutEligibility.shortfall > 0 && (
                  <span className="block mt-1">
                    You need {formatCurrency(payoutEligibility.shortfall)} more to request a payout.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Payout Form */}
          {payoutEligibility?.canPayout && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Payout Amount (TZS)
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className={errors.amount ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setMaxAmount}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                  >
                    Max
                  </Button>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Mobile Money Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+255712345678"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className={`pl-10 ${errors.phoneNumber ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                )}
                <p className="text-xs text-gray-500">
                  Enter the mobile money number where you want to receive the payout
                </p>
              </div>

              {/* Processing Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Processing Information:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Payouts are processed within 1-3 business days</li>
                  <li>• You will receive SMS confirmation when processed</li>
                  <li>• Processing fees may apply (if any)</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
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