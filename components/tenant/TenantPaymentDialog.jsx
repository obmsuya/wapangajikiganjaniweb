// components/tenant/TenantPaymentDialog.jsx
"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Building2, Smartphone, CheckCircle, XCircle,
  ArrowLeft, AlertCircle, MapPin, Loader2, Clock, HandCoins,
  Calendar, Info
} from "lucide-react";
import { Button }       from "@/components/ui/button";
import { Label }        from "@/components/ui/label";
import { Textarea }     from "@/components/ui/textarea";
import { Badge }        from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator }    from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useTenantPaymentStore } from "@/stores/tenant/useTenantPaymentStore";

// ─── helpers ─────────────────────────────────────────────────────────────────

const PROCESSING_STATES = {
  IDLE:             'idle',
  VALIDATING:       'validating',
  PROCESSING:       'processing',
  WAITING_CALLBACK: 'waiting_callback',
  SUCCESS:          'success',
  FAILED:           'failed',
};

function fmt(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Returns true when today is BEFORE the due date (tenant is paying early)
function isEarly(unit) {
  // Prefer the flag the API sends; fall back to date comparison
  if (unit?.is_early_payment !== undefined) return unit.is_early_payment;
  if (!unit?.next_due_date) return false;
  return new Date() < new Date(unit.next_due_date);
}

function daysUntilDue(nextDueDate) {
  if (!nextDueDate) return null;
  return Math.ceil((new Date(nextDueDate) - new Date()) / 86400000);
}

// ─── AmountDueCard — first thing the tenant sees ────────────────────────────

function AmountDueCard({ unit }) {
  if (!unit) return null;

  const freq     = parseInt(unit.payment_frequency) || 1;
  const total    = parseFloat(unit.rent_amount)     || 0;
  const monthly  = freq > 0 ? total / freq : total;
  const early    = isEarly(unit);
  const days     = daysUntilDue(unit.next_due_date);
  const period   = freq === 1 ? '1 month' : `${freq} months`;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="p-5 space-y-4">

        {/* Unit info + status badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
              <Building2 className="w-4 h-4" />
              {unit.unit_name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <MapPin className="w-3 h-3" />
              {unit.property_name}
              {unit.floor_number && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-600">
                  Floor {unit.floor_number}
                </Badge>
              )}
            </div>
          </div>

          {early ? (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-xs gap-1">
              <Clock className="w-3 h-3" /> Early payment
            </Badge>
          ) : days !== null && days <= 0 ? (
            <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs gap-1">
              <AlertCircle className="w-3 h-3" /> Overdue
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs gap-1">
              <Calendar className="w-3 h-3" /> Due soon
            </Badge>
          )}
        </div>

        <Separator className="bg-blue-100" />

        {/* Amount — big and unambiguous */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-blue-500 uppercase tracking-widest">Amount to pay</p>
          <p className="text-4xl font-bold text-blue-900 tracking-tight">{fmt(total)}</p>
          <p className="text-sm text-blue-600">
            covers <span className="font-semibold">{period}</span>
            {freq > 1 && <span className="text-blue-400"> ({fmt(monthly)}/mo)</span>}
          </p>
        </div>

        {/* Due date row */}
        {unit.next_due_date && (
          <div className={`rounded-lg px-3 py-2 flex items-center justify-between text-sm
            ${early ? 'bg-amber-50 border border-amber-200' : 'bg-blue-100/60 border border-blue-200'}`}>
            <span className={early ? 'text-amber-700' : 'text-blue-700'}>
              {early ? '⏰ Due date' : '📅 Due date'}
            </span>
            <span className={`font-semibold ${early ? 'text-amber-900' : 'text-blue-900'}`}>
              {fmtDate(unit.next_due_date)}
            </span>
          </div>
        )}

        {/* Early notice */}
        {early && days !== null && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-xs">
              You're paying <span className="font-semibold">{days} day{days !== 1 ? 's' : ''} early</span>.
              This payment will be applied to the <span className="font-semibold">next period</span>.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
}

// ─── Unit selector (multi-unit tenants) ─────────────────────────────────────

function UnitSelector({ units, selectedId, onSelect, error }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        You have multiple units. Which one are you paying for?
      </p>
      <div className="grid gap-2">
        {units.map((u) => {
          const freq  = parseInt(u.payment_frequency) || 1;
          const total = parseFloat(u.rent_amount) || 0;
          const early = isEarly(u);
          const active = selectedId === u.unit_id?.toString();
          return (
            <Card
              key={u.unit_id}
              onClick={() => onSelect(u.unit_id.toString())}
              className={`cursor-pointer transition-all border-2
                ${active ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-muted-foreground/40'}`}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{u.unit_name}</p>
                  <p className="text-xs text-muted-foreground">{u.property_name}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-sm">{fmt(total)}</p>
                  <p className="text-xs text-muted-foreground">
                    per {freq === 1 ? 'month' : `${freq} months`}
                  </p>
                  {early && (
                    <Badge className="text-[10px] h-4 bg-amber-100 text-amber-700 border-amber-200">Early</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Provider picker ─────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'Airtel',   name: 'Airtel Money', logo: '/images/airtel-logo.png'    },
  { id: 'Tigo',     name: 'Tigo Pesa',    logo: '/images/tigo-logo.png'      },
  { id: 'Mpesa',    name: 'M-Pesa',       logo: '/images/mpesa-logo.png'     },
  { id: 'Halopesa', name: 'Halopesa',     logo: '/images/halopesa-logo.png'  },
  { id: 'Azampesa', name: 'AzamPesa',     logo: '/images/azam-pesa-logo.png' },
];

function ProviderPicker({ value, onChange, disabled, error }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Mobile Money Provider *</Label>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((p) => (
          <Button
            key={p.id} type="button" variant="outline" size="sm"
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={`gap-2 border-2 transition-all
              ${value === p.id ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-border'}`}
          >
            <img src={p.logo} alt={p.name} className="w-5 h-5 object-contain" />
            {p.name}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export default function TenantPaymentDialog() {
  const {
    showPaymentDialog, setShowPaymentDialog,
    selectedUnit,
    paymentMethod, setPaymentMethod,
    paymentFlow, setPaymentFlow,
    loading, error,
    currentTransaction,
    requiresUnitSelection, availableUnits,
    recordManualPayment,
    processSystemPayment,
    resetPaymentFlow,
    clearError,
  } = useTenantPaymentStore();

  const [processingState, setProcessingState] = useState(PROCESSING_STATES.IDLE);
  const [formData, setFormData] = useState({
    notes: '', provider: 'Airtel', accountNumber: '', selectedUnitId: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Seed the selectedUnitId from the store whenever the dialog opens
  useEffect(() => {
    if (showPaymentDialog && selectedUnit) {
      setFormData(prev => ({ ...prev, selectedUnitId: selectedUnit.unit_id?.toString() || '' }));
      setProcessingState(PROCESSING_STATES.IDLE);
      setFormErrors({});
      clearError?.();
    }
  }, [showPaymentDialog, selectedUnit]);

  useEffect(() => {
    if (requiresUnitSelection && availableUnits?.length > 0) {
      setPaymentFlow('unit_selection');
    }
  }, [requiresUnitSelection, availableUnits]);

  // The unit the form is acting on — either the pre-selected one or the one chosen from the list
  const activeUnit = requiresUnitSelection
    ? availableUnits?.find(u => u.unit_id?.toString() === formData.selectedUnitId)
    : selectedUnit;

  const handleClose = () => {
    setShowPaymentDialog(false);
    resetPaymentFlow();
    setFormData({ notes: '', provider: 'Airtel', accountNumber: '', selectedUnitId: '' });
    setFormErrors({});
    setProcessingState(PROCESSING_STATES.IDLE);
  };

  const set = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (paymentMethod === 'record' && !formData.notes?.trim())
      errs.notes = 'Describe how you made the payment';
    if (paymentMethod === 'pay') {
      if (!formData.provider) errs.provider = 'Select a provider';
      if (!formData.accountNumber?.trim()) {
        errs.accountNumber = 'Enter your mobile number';
      } else {
        const n = formData.accountNumber.replace(/\s/g, '');
        if (!/^\+?[0-9]{10,15}$/.test(n))
          errs.accountNumber = 'Enter a valid Tanzanian number';
      }
    }
    if (requiresUnitSelection && !formData.selectedUnitId)
      errs.selectedUnitId = 'Select a unit';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    // Use the unit_id from activeUnit — this is the fix for "no active occupancy"
    // Previously the code was using formData.selectedUnitId directly which could
    // be undefined when single-unit tenants skip the unit-selection step.
    const unitId = activeUnit?.unit_id;
    if (!unitId) return;

    const amount = parseFloat(activeUnit.rent_amount);

    setProcessingState(PROCESSING_STATES.VALIDATING);

    try {
      let result;
      if (paymentMethod === 'record') {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        result = await recordManualPayment(amount, unitId, formData.notes.trim());
      } else {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        result = await processSystemPayment(
          unitId,
          formData.accountNumber.replace(/\s/g, ''),
          formData.provider,
          'mno',
        );
        if (result && !result.requiresUnitSelection)
          setProcessingState(PROCESSING_STATES.WAITING_CALLBACK);
      }

      if (result?.requiresUnitSelection) {
        setPaymentFlow('unit_selection');
        setProcessingState(PROCESSING_STATES.IDLE);
      } else if (result && !error) {
        setProcessingState(PROCESSING_STATES.SUCCESS);
        setPaymentFlow('success');
      }
    } catch {
      setProcessingState(PROCESSING_STATES.FAILED);
      setPaymentFlow('error');
    }
  };

  const isProcessing = [
    PROCESSING_STATES.VALIDATING,
    PROCESSING_STATES.PROCESSING,
    PROCESSING_STATES.WAITING_CALLBACK,
  ].includes(processingState);

  const processingMsg = {
    [PROCESSING_STATES.VALIDATING]:       'Validating…',
    [PROCESSING_STATES.PROCESSING]:       paymentMethod === 'record' ? 'Recording payment…' : 'Initiating payment…',
    [PROCESSING_STATES.WAITING_CALLBACK]: 'Waiting — complete on your phone',
  }[processingState];

  const titles = {
    select:         'Pay Rent',
    unit_selection: 'Select Unit',
    form:           paymentMethod === 'record' ? 'Record Payment' : 'Pay Now',
    success:        'Done!',
    error:          'Payment Failed',
  };

  if (!showPaymentDialog) return null;

  return (
    <Dialog open={showPaymentDialog} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">

        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
            {titles[paymentFlow] || 'Pay Rent'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 mt-4">

          {/* ── UNIT SELECTION ─────────────────────────────────────────────── */}
          {paymentFlow === 'unit_selection' && (
            <>
              <UnitSelector
                units={availableUnits || []}
                selectedId={formData.selectedUnitId}
                onSelect={(v) => set('selectedUnitId', v)}
                error={formErrors.selectedUnitId}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setPaymentFlow('select')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!formData.selectedUnitId}
                  onClick={() => { if (formData.selectedUnitId) setPaymentFlow('select'); }}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* ── METHOD SELECTION ───────────────────────────────────────────── */}
          {paymentFlow === 'select' && (
            <>
              <AmountDueCard unit={activeUnit} />
              <Separator />
              <p className="text-sm text-center text-muted-foreground font-medium">
                How would you like to pay?
              </p>
              <div className="grid gap-3">

                {/* Pay with mobile money */}
                <Card
                  className="cursor-pointer border-2 border-border hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  onClick={() => { setPaymentMethod('pay'); setPaymentFlow('form'); clearError?.(); }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Pay with Mobile Money</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Airtel, Tigo, AzamPesa — processed instantly
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Instant</Badge>
                  </CardContent>
                </Card>

                {/* I already paid */}
                <Card
                  className="cursor-pointer border-2 border-border hover:border-green-300 hover:bg-green-50/50 transition-all"
                  onClick={() => { setPaymentMethod('record'); setPaymentFlow('form'); clearError?.(); }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-100">
                      <HandCoins className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">I already paid</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bank transfer, cash, M-Pesa direct — needs landlord confirmation
                      </p>
                    </div>
                    <Badge variant="outline" className="border-yellow-300 text-yellow-700 text-xs">
                      Pending
                    </Badge>
                  </CardContent>
                </Card>

              </div>
            </>
          )}

          {/* ── PAYMENT FORM ───────────────────────────────────────────────── */}
          {paymentFlow === 'form' && (
            <>
              <Button
                variant="ghost" size="sm"
                className="gap-1 text-muted-foreground -ml-2 -mt-2"
                disabled={isProcessing}
                onClick={() => { setPaymentFlow('select'); clearError?.(); }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {/* Amount always visible at top of form */}
              <AmountDueCard unit={activeUnit} />

              {/* Processing indicator */}
              {isProcessing && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <AlertDescription className="text-blue-800 font-medium">
                    {processingMsg}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Record: notes field */}
                {paymentMethod === 'record' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">How did you pay? *</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="e.g. Bank transfer to NMB 1234, cash to Mr. Mwangi on 12 Mar"
                      rows={3}
                      disabled={isProcessing}
                      className={formErrors.notes ? 'border-destructive' : ''}
                    />
                    {formErrors.notes
                      ? <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.notes}
                        </p>
                      : <p className="text-xs text-muted-foreground">
                          This helps your landlord verify and confirm the payment.
                        </p>
                    }
                  </div>
                )}

                {/* Pay now: provider + number */}
                {paymentMethod === 'pay' && (
                  <div className="space-y-4">
                    <ProviderPicker
                      value={formData.provider}
                      onChange={(v) => set('provider', v)}
                      disabled={isProcessing}
                      error={formErrors.provider}
                    />
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Your Mobile Number *</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-base">🇹🇿</span>
                          <span className="text-xs text-muted-foreground border-r pr-2">+255</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="0712 000 000"
                          value={formData.accountNumber}
                          onChange={(e) => set('accountNumber', e.target.value)}
                          disabled={isProcessing}
                          className={`flex h-10 w-full rounded-md border bg-background pl-[4.5rem] pr-3 py-2 text-sm
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                            focus-visible:ring-ring disabled:opacity-50
                            ${formErrors.accountNumber ? 'border-destructive' : 'border-input'}`}
                        />
                      </div>
                      {formErrors.accountNumber
                        ? <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.accountNumber}
                          </p>
                        : <p className="text-xs text-muted-foreground">
                            A payment prompt will be sent to this number.
                          </p>
                      }
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button" variant="outline" className="flex-1"
                    disabled={isProcessing}
                    onClick={() => { setPaymentFlow('select'); clearError?.(); }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{processingMsg}</>
                      : paymentMethod === 'record'
                        ? 'Submit for Confirmation'
                        : `Pay ${fmt(activeUnit?.rent_amount)}`
                    }
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── SUCCESS ────────────────────────────────────────────────────── */}
          {paymentFlow === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900">
                  {paymentMethod === 'record' ? 'Payment Submitted!' : 'Payment Initiated!'}
                </h3>
                <p className="text-sm text-green-700 mt-1 max-w-xs mx-auto">
                  {paymentMethod === 'record'
                    ? 'Your landlord will confirm once they verify your payment.'
                    : `Complete the prompt on your ${formData.provider} app to finalize.`}
                </p>
              </div>

              {currentTransaction && (
                <Card>
                  <CardContent className="p-4 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">
                        {fmt(currentTransaction.amount || activeUnit?.rent_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit</span>
                      <span className="font-medium">
                        {currentTransaction.unit_name || activeUnit?.unit_name}
                      </span>
                    </div>
                    {currentTransaction.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {currentTransaction.payment_id}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
                Done
              </Button>
            </div>
          )}

          {/* ── ERROR ──────────────────────────────────────────────────────── */}
          {paymentFlow === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">Payment Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1"
                  onClick={() => { setPaymentFlow('form'); clearError?.(); }}>
                  Try Again
                </Button>
                <Button className="flex-1" onClick={handleClose}>Close</Button>
              </div>
            </div>
          )}

          {/* ── WAITING CALLBACK (standalone) ──────────────────────────────── */}
          {processingState === PROCESSING_STATES.WAITING_CALLBACK
            && paymentFlow !== 'success'
            && paymentFlow !== 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Check Your Phone</h3>
                <p className="text-sm text-blue-700 mt-1 max-w-xs mx-auto">
                  A payment prompt has been sent. Accept it to complete the payment.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Close — I'll complete it on my phone
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}