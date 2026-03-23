// components/tenant/TenantPaymentDialog.jsx
"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Building2, Smartphone, CheckCircle, XCircle,
  ArrowLeft, AlertCircle, MapPin, Loader2, Clock, HandCoins,
  Calendar, Info, BadgeCheck,
} from "lucide-react";
import { Button }        from "@/components/ui/button";
import { Label }         from "@/components/ui/label";
import { Textarea }      from "@/components/ui/textarea";
import { Badge }         from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator }     from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress }      from "@/components/ui/progress";
import { useTenantPaymentStore } from "@/stores/tenant/useTenantPaymentStore";

// ── helpers ───────────────────────────────────────────────────────────────────

const PROCESSING_STATES = {
  IDLE:             "idle",
  VALIDATING:       "validating",
  PROCESSING:       "processing",
  WAITING_CALLBACK: "waiting_callback",
  SUCCESS:          "success",
  FAILED:           "failed",
};

function fmt(amount) {
  if (!amount && amount !== 0) return "TZS 0";
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency", currency: "TZS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function isEarlyPayment(unit) {
  if (unit?.is_early_payment !== undefined) return unit.is_early_payment;
  if (!unit?.next_due_date) return false;
  return new Date() < new Date(unit.next_due_date);
}

function daysUntilDue(nextDueDate) {
  if (!nextDueDate) return null;
  return Math.ceil((new Date(nextDueDate) - new Date()) / 86400000);
}

// ── AmountDueCard ─────────────────────────────────────────────────────────────
// READ-ONLY summary card shown at the top of every payment screen.
// rent_amount on the occupancy = the FULL cycle amount (monthly × freq).
// monthly = rent_amount / freq for display only.
function AmountDueCard({ unit }) {
  if (!unit) return null;

  const freq    = parseInt(unit.payment_frequency) || 1;
  const cycleDue = parseFloat(unit.rent_amount) || 0;          // full cycle
  const monthly  = freq > 0 ? cycleDue / freq : cycleDue;      // display only
  const early    = isEarlyPayment(unit);
  const days     = daysUntilDue(unit.next_due_date);
  const period   = freq === 1 ? "1 month" : `${freq} months`;

  // cycle_balance block — from backend occupancy response
  const cb              = unit.cycle_balance;
  const amountPaid      = parseFloat(cb?.amount_paid      || 0);
  const amountRemaining = parseFloat(cb?.amount_remaining ?? cycleDue);
  const isSettled       = cb?.is_settled ?? false;
  const hasPartialPaid  = amountPaid > 0 && !isSettled;
  const paidPercent     = cycleDue > 0 ? Math.min(100, (amountPaid / cycleDue) * 100) : 0;

  return (
    <Card className="border bg-card">
      <CardContent className="p-5 space-y-4">

        {/* Unit + status badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-primary" />
              {unit.unit_name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {unit.property_name}
              {unit.floor_number && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  Floor {unit.floor_number}
                </Badge>
              )}
            </div>
          </div>

          {isSettled ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <BadgeCheck className="w-3 h-3" /> Fully paid
            </Badge>
          ) : early ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="w-3 h-3" /> Early payment
            </Badge>
          ) : days !== null && days <= 0 ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertCircle className="w-3 h-3" /> Overdue
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" /> Due soon
            </Badge>
          )}
        </div>

        <Separator />

        {/* Billing breakdown — always shown so tenant knows what the cycle costs */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Full cycle rent ({period})</span>
            <span className="font-medium text-foreground">{fmt(cycleDue)}</span>
          </div>
          {freq > 1 && (
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Monthly equivalent</span>
              <span>{fmt(monthly)} / month</span>
            </div>
          )}
          {hasPartialPaid && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>Already paid this cycle</span>
                <span className="font-medium text-foreground">{fmt(amountPaid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Still outstanding</span>
                <span className="text-destructive">{fmt(amountRemaining)}</span>
              </div>
            </>
          )}
          {!hasPartialPaid && !isSettled && (
            <>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Amount due</span>
                <span>{fmt(cycleDue)}</span>
              </div>
            </>
          )}
        </div>

        {/* Partial progress bar */}
        {hasPartialPaid && (
          <div className="space-y-1">
            <Progress value={paidPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(paidPercent)}% of this cycle paid
            </p>
          </div>
        )}

        {/* Settled notice */}
        {isSettled && (
          <Alert>
            <BadgeCheck className="h-4 w-4" />
            <AlertDescription>This cycle is fully paid. You're all caught up!</AlertDescription>
          </Alert>
        )}

        {/* Due date */}
        {unit.next_due_date && !isSettled && (
          <div className="rounded-lg px-3 py-2 flex items-center justify-between text-sm bg-muted/50 border">
            <span className="text-muted-foreground">Due date</span>
            <span className="font-semibold">{fmtDate(unit.next_due_date)}</span>
          </div>
        )}

        {/* Early notice */}
        {early && days !== null && !isSettled && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You're paying{" "}
              <span className="font-semibold">
                {days} day{days !== 1 ? "s" : ""} early
              </span>
              . This will be applied to the next billing period.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ── Unit selector ─────────────────────────────────────────────────────────────
function UnitSelector({ units, selectedId, onSelect, error }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        You have more than one unit. Which one are you paying for?
      </p>
      <div className="grid gap-2">
        {units.map((u) => {
          const freq  = parseInt(u.payment_frequency) || 1;
          const total = parseFloat(u.rent_amount) || 0;
          const active = selectedId === u.unit_id?.toString();
          return (
            <Card
              key={u.unit_id}
              onClick={() => onSelect(u.unit_id.toString())}
              className={`cursor-pointer transition-all border-2 ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{u.unit_name}</p>
                  <p className="text-xs text-muted-foreground">{u.property_name}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-sm">{fmt(total)}</p>
                  <p className="text-xs text-muted-foreground">
                    per {freq === 1 ? "month" : `${freq} months`}
                  </p>
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

// ── Provider picker ───────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: "Airtel",   name: "Airtel Money", logo: "/images/airtel-logo.png"    },
  { id: "Tigo",     name: "Tigo Pesa",    logo: "/images/tigo-logo.png"      },
  { id: "Mpesa",    name: "M-Pesa",       logo: "/images/mpesa-logo.png"     },
  { id: "Halopesa", name: "Halopesa",     logo: "/images/halopesa-logo.png"  },
  { id: "Azampesa", name: "AzamPesa",     logo: "/images/azam-pesa-logo.png" },
];

function ProviderPicker({ value, onChange, disabled, error }) {
  return (
    <div className="space-y-2">
      <Label>Mobile Money Provider *</Label>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((p) => (
          <Button
            key={p.id} type="button" variant="outline"
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={`gap-2 border-2 transition-all ${
              value === p.id ? "border-primary bg-primary/5" : "border-border"
            }`}
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

// ── Main dialog ───────────────────────────────────────────────────────────────
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
    notes: "", provider: "Airtel", accountNumber: "", selectedUnitId: "",
    // partial amount — empty means "pay full remaining"
    partialAmount: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (showPaymentDialog && selectedUnit) {
      setFormData(prev => ({
        ...prev,
        selectedUnitId: selectedUnit.unit_id?.toString() || "",
        partialAmount:  "",   // reset on each open
      }));
      setProcessingState(PROCESSING_STATES.IDLE);
      setFormErrors({});
      clearError?.();
    }
  }, [showPaymentDialog, selectedUnit]);

  useEffect(() => {
    if (requiresUnitSelection && availableUnits?.length > 0) {
      setPaymentFlow("unit_selection");
    }
  }, [requiresUnitSelection, availableUnits]);

  const activeUnit = requiresUnitSelection
    ? availableUnits?.find(u => u.unit_id?.toString() === formData.selectedUnitId)
    : selectedUnit;

  // ── Amount derivation ─────────────────────────────────────────────────────
  // cycle_balance.amount_remaining = what is still owed this billing cycle.
  // If cycle_balance is absent, fall back to the full rent_amount.
  const cb              = activeUnit?.cycle_balance;
  const isSettled       = cb?.is_settled ?? false;
  const maxPayable      = parseFloat(cb?.amount_remaining ?? activeUnit?.rent_amount ?? 0);

  // What the tenant will actually send — partial input if filled, else full remaining
  const enteredAmount   = parseFloat(formData.partialAmount) || 0;
  const payAmount       = enteredAmount > 0 ? enteredAmount : maxPayable;

  // For the MNO/system path the amount is always the full remaining (can't do partial via MNO)
  const systemPayAmount = maxPayable;

  const handleClose = () => {
    setShowPaymentDialog(false);
    resetPaymentFlow();
    setFormData({ notes: "", provider: "Airtel", accountNumber: "", selectedUnitId: "", partialAmount: "" });
    setFormErrors({});
    setProcessingState(PROCESSING_STATES.IDLE);
  };

  const setField = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};

    if (paymentMethod === "record") {
      if (!formData.notes?.trim())
        errs.notes = "Describe how you made the payment";

      // If they entered a partial amount it must be valid and ≤ what's remaining
      if (formData.partialAmount) {
        const val = parseFloat(formData.partialAmount);
        if (isNaN(val) || val <= 0)
          errs.partialAmount = "Enter a valid amount";
        else if (val > maxPayable)
          errs.partialAmount = `Cannot exceed the outstanding balance of ${fmt(maxPayable)}`;
      }
    }

    if (paymentMethod === "pay") {
      if (!formData.provider) errs.provider = "Select a provider";
      if (!formData.accountNumber?.trim()) {
        errs.accountNumber = "Enter your mobile number";
      } else if (!/^\+?[0-9]{10,15}$/.test(formData.accountNumber.replace(/\s/g, ""))) {
        errs.accountNumber = "Enter a valid Tanzanian number";
      }
    }

    if (requiresUnitSelection && !formData.selectedUnitId)
      errs.selectedUnitId = "Select a unit";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    const unitId = activeUnit?.unit_id;
    if (!unitId) return;

    setProcessingState(PROCESSING_STATES.VALIDATING);
    try {
      let result;
      if (paymentMethod === "record") {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        // Send the exact amount the tenant typed (partial), or the full remaining
        result = await recordManualPayment(payAmount, unitId, formData.notes.trim());
      } else {
        setProcessingState(PROCESSING_STATES.PROCESSING);
        // MNO always charges the full outstanding amount
        result = await processSystemPayment(
          unitId,
          formData.accountNumber.replace(/\s/g, ""),
          formData.provider,
          "mno",
        );
        if (result && !result.requiresUnitSelection)
          setProcessingState(PROCESSING_STATES.WAITING_CALLBACK);
      }

      if (result?.requiresUnitSelection) {
        setPaymentFlow("unit_selection");
        setProcessingState(PROCESSING_STATES.IDLE);
      } else if (result && !error) {
        setProcessingState(PROCESSING_STATES.SUCCESS);
        setPaymentFlow("success");
      }
    } catch {
      setProcessingState(PROCESSING_STATES.FAILED);
      setPaymentFlow("error");
    }
  };

  const isProcessing = [
    PROCESSING_STATES.VALIDATING,
    PROCESSING_STATES.PROCESSING,
    PROCESSING_STATES.WAITING_CALLBACK,
  ].includes(processingState);

  const processingMsg = {
    [PROCESSING_STATES.VALIDATING]:       "Checking details…",
    [PROCESSING_STATES.PROCESSING]:       paymentMethod === "record" ? "Recording…" : "Initiating payment…",
    [PROCESSING_STATES.WAITING_CALLBACK]: "Complete on your phone",
  }[processingState];

  const titles = {
    select:         "Pay Rent",
    unit_selection: "Which unit?",
    form:           paymentMethod === "record" ? "Record a Payment" : "Pay Now",
    success:        "All done!",
    error:          "Something went wrong",
  };

  if (!showPaymentDialog) return null;

  return (
    <Dialog open={showPaymentDialog} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-primary" />
            {titles[paymentFlow] || "Pay Rent"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 mt-4">

          {/* UNIT SELECTION */}
          {paymentFlow === "unit_selection" && (
            <>
              <UnitSelector
                units={availableUnits || []}
                selectedId={formData.selectedUnitId}
                onSelect={(v) => setField("selectedUnitId", v)}
                error={formErrors.selectedUnitId}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1"
                  onClick={() => setPaymentFlow("select")}>Back</Button>
                <Button className="flex-1"
                  disabled={!formData.selectedUnitId}
                  onClick={() => { if (formData.selectedUnitId) setPaymentFlow("select"); }}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* METHOD SELECTION */}
          {paymentFlow === "select" && (
            <>
              <AmountDueCard unit={activeUnit} />

              {!isSettled && (
                <>
                  <Separator />
                  <p className="text-sm text-center text-muted-foreground font-medium">
                    How would you like to pay?
                  </p>
                  <div className="grid gap-3">
                    <Card
                      className="cursor-pointer border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={() => { setPaymentMethod("pay"); setPaymentFlow("form"); clearError?.(); }}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Smartphone className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Pay with Mobile Money</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Airtel, Tigo, AzamPesa — processed right away
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Instant</Badge>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer border-2 border-border hover:border-muted-foreground/40 hover:bg-muted/30 transition-all"
                      onClick={() => { setPaymentMethod("record"); setPaymentFlow("form"); clearError?.(); }}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <HandCoins className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">I already paid</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cash, bank transfer — landlord will confirm
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">Needs confirmation</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </>
          )}

          {/* PAYMENT FORM */}
          {paymentFlow === "form" && (
            <>
              <Button
                variant="ghost" size="sm"
                className="gap-1 text-muted-foreground -ml-2 -mt-2 w-fit"
                disabled={isProcessing}
                onClick={() => { setPaymentFlow("select"); clearError?.(); }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {/* Always show cycle breakdown at top of form */}
              <AmountDueCard unit={activeUnit} />

              {isProcessing && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription className="font-medium">{processingMsg}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── RECORD PATH ── */}
                {paymentMethod === "record" && (
                  <>
                    {/* Partial payment input — tenant can pay any amount ≤ outstanding */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        How much are you paying?
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </Label>

                      {/* Quick-select: full or partial toggle */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button" variant="outline"
                          className={!formData.partialAmount ? "border-primary bg-primary/5" : ""}
                          onClick={() => setField("partialAmount", "")}
                        >
                          Full — {fmt(maxPayable)}
                        </Button>
                        <Button
                          type="button" variant="outline"
                          className={formData.partialAmount ? "border-primary bg-primary/5" : ""}
                          onClick={() => {
                            // Focus the input when "Partial" is clicked
                            if (!formData.partialAmount) setField("partialAmount", "");
                          }}
                        >
                          Pay partial amount
                        </Button>
                      </div>

                      {/* Amount input — text input to avoid browser step validation popup */}
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none mt-0.5 pr-2 border-r">
                          TZS
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder={`e.g. ${fmt(Math.round(maxPayable / 2))}`}
                          value={formData.partialAmount}
                          onChange={(e) => {
                            // Allow only digits — no browser step validation
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            setField("partialAmount", raw);
                          }}
                          disabled={isProcessing}
                          className={`flex h-11 w-full rounded-full border bg-background pl-12 pr-3 text-sm
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                            focus-visible:ring-ring disabled:opacity-50
                            ${formErrors.partialAmount ? "border-destructive" : "border-input"}`}
                        />
                      </div>

                      {formErrors.partialAmount ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.partialAmount}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {formData.partialAmount
                            ? `You are recording a partial payment of ${fmt(enteredAmount)}. The remaining ${fmt(maxPayable - enteredAmount)} will still be outstanding.`
                            : `Leave blank to record the full outstanding amount of ${fmt(maxPayable)}.`}
                        </p>
                      )}
                    </div>

                    {/* Notes — how did they pay */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">How did you pay? *</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        placeholder="e.g. Cash to Mr. Ahmed on 12 March / bank transfer NMB 1234"
                        rows={3}
                        disabled={isProcessing}
                        className={formErrors.notes ? "border-destructive" : ""}
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
                  </>
                )}

                {/* ── PAY NOW PATH (MNO) ── */}
                {paymentMethod === "pay" && (
                  <div className="space-y-4">
                    {/* MNO always charges full remaining — note this clearly */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Mobile money will charge the full outstanding amount of{" "}
                        <span className="font-semibold">{fmt(systemPayAmount)}</span>.
                        To pay a partial amount, use the "I already paid" option instead.
                      </AlertDescription>
                    </Alert>

                    <ProviderPicker
                      value={formData.provider}
                      onChange={(v) => setField("provider", v)}
                      disabled={isProcessing}
                      error={formErrors.provider}
                    />
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Your Mobile Number *</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-base mb-0.5">🇹🇿</span>
                          <span className="text-xs text-muted-foreground border-r pr-2 mt-0.5">+255</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="712 000 000"
                          value={formData.accountNumber}
                          onChange={(e) => setField("accountNumber", e.target.value)}
                          disabled={isProcessing}
                          className={`flex h-11 w-full rounded-full border bg-background pl-20 pr-3 py-2 text-sm
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                            focus-visible:ring-ring disabled:opacity-50
                            ${formErrors.accountNumber ? "border-destructive" : "border-input"}`}
                        />
                      </div>
                      {formErrors.accountNumber
                        ? <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.accountNumber}
                          </p>
                        : <p className="text-xs text-muted-foreground">
                            A payment request will be sent to this number.
                          </p>
                      }
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" className="w-fit px-4"
                    disabled={isProcessing}
                    onClick={() => { setPaymentFlow("select"); clearError?.(); }}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="flex-1">
                    {isProcessing
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{processingMsg}</>
                      : paymentMethod === "record"
                        ? `Submit ${fmt(payAmount)} for Confirmation`
                        : `Pay ${fmt(systemPayAmount)}`
                    }
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* SUCCESS */}
          {paymentFlow === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {paymentMethod === "record" ? "Payment submitted!" : "Payment started!"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  {paymentMethod === "record"
                    ? "Your landlord will confirm once they verify your payment."
                    : `Open your ${formData.provider} app to complete the payment.`}
                </p>
              </div>
              {currentTransaction && (
                <Card>
                  <CardContent className="p-4 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount recorded</span>
                      <span className="font-semibold">
                        {fmt(currentTransaction.amount || payAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit</span>
                      <span className="font-medium">
                        {currentTransaction.unit_name || activeUnit?.unit_name}
                      </span>
                    </div>
                    {/* Show what's left if partial */}
                    {currentTransaction.amount_remaining_this_cycle !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Still outstanding</span>
                        <span className={currentTransaction.cycle_fully_paid ? "text-primary" : "text-destructive"}>
                          {currentTransaction.cycle_fully_paid
                            ? "Fully paid ✓"
                            : fmt(currentTransaction.amount_remaining_this_cycle)}
                        </span>
                      </div>
                    )}
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
              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          )}

          {/* ERROR */}
          {paymentFlow === "error" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Payment Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1"
                  onClick={() => { setPaymentFlow("form"); clearError?.(); }}>
                  Try Again
                </Button>
                <Button className="flex-1" onClick={handleClose}>Close</Button>
              </div>
            </div>
          )}

          {/* WAITING CALLBACK */}
          {processingState === PROCESSING_STATES.WAITING_CALLBACK
            && paymentFlow !== "success"
            && paymentFlow !== "error" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Check your phone</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  A payment request has been sent. Accept it on your phone to finish.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Close — I'll finish on my phone
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}