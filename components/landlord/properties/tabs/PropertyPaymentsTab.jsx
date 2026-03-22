// components/landlord/properties/tabs/PropertyPaymentsTab.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Banknote, Clock, AlertCircle, Check, X, RefreshCw, Search,
  PlusCircle, Info, Bell, BellOff, ChevronUp, ChevronDown,
  ChevronsUpDown, Eye, CheckCircle2, XCircle, AlertTriangle,
  User, Building2, CalendarDays, Receipt, Coins, CalendarClock,
  BadgeCheck, TrendingDown,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea }  from "@/components/ui/textarea";
import { Label }     from "@/components/ui/label";
import { Switch }    from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CloudflareCard, CloudflareCardHeader, CloudflareCardContent,
} from "@/components/cloudflare/Card";
import { usePaymentTabStore } from "@/stores/landlord/UsePaymentTabStore";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// derivePaymentType
// Reads a history-table row and decides which type badge to show.
// "early"          — notes mention "early"
// "landlord_entry" — payment_method is landlord_entry (and not early)
// null             — tenant-submitted, no special badge
// ─────────────────────────────────────────────────────────────────────────────
function derivePaymentType(payment) {
  const notes = (payment.notes || "").toLowerCase();
  if (notes.includes("early")) return "early";
  if (payment.payment_method === "landlord_entry") return "landlord_entry";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentTypeBadge
// Shows in the dialog preview line AND in the table Type column.
// Types: early | partial | full | landlord_entry
// ─────────────────────────────────────────────────────────────────────────────
function PaymentTypeBadge({ type }) {
  const cfg = {
    early:          { Icon: CalendarClock, label: "Early",    cls: "bg-blue-50   text-blue-700   border-blue-200"   },
    partial:        { Icon: Coins,         label: "Partial",  cls: "bg-orange-50 text-orange-700 border-orange-200" },
    full:           { Icon: BadgeCheck,    label: "Full",     cls: "bg-green-50  text-green-700  border-green-200"  },
    landlord_entry: { Icon: Receipt,       label: "Recorded", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  }[type];
  if (!cfg) return null;
  const { Icon, label, cls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentStatusBadge
// Used in the Needs-Attention card and inside the dialog unit-confirm line.
// Types: paid | overdue | partial | due
// ─────────────────────────────────────────────────────────────────────────────
function PaymentStatusBadge({ status }) {
  const cfg = {
    paid:    { Icon: BadgeCheck,    label: "Paid",    cls: "bg-green-50  text-green-700  border-green-200"  },
    overdue: { Icon: AlertTriangle, label: "Overdue", cls: "bg-red-50    text-red-700    border-red-200"    },
    partial: { Icon: Coins,         label: "Partial", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    due:     { Icon: Clock,         label: "Due",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  }[status];
  if (!cfg) return <span className="text-xs text-muted-foreground">{status ?? "—"}</span>;
  const { Icon, label, cls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CycleProgressBar
// Only shown inside the dialog when amount_paid > 0 and cycle not yet settled.
// ─────────────────────────────────────────────────────────────────────────────
function CycleProgressBar({ paid, total }) {
  if (!total || total <= 0) return null;
  const pct   = Math.min(100, Math.round((paid / total) * 100));
  const color = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct}% paid this cycle</span>
        <span>{pct < 100 ? `${100 - pct}% remaining` : "Fully settled"}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentHistoryTable
// Standard shadcn Table with client-side sort and pagination.
// Each column definition: { header, accessor, sortable?, className?, cell? }
// ─────────────────────────────────────────────────────────────────────────────
function PaymentHistoryTable({ columns, data, emptyMessage = "No payments found." }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir,   setSortDir]   = useState("asc");
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 10;

  // Re-sort whenever data, field, or direction changes
  const sorted = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ field }) {
    if (sortField !== field)
      return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc"
      ? <ChevronUp   className="ml-1 h-3.5 w-3.5" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  }

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.accessor} className={col.className}>
                  {col.sortable ? (
                    <button
                      className="flex items-center font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.accessor)}
                    >
                      {col.header}
                      <SortIcon field={col.accessor} />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={row.id ?? i} className="hover:bg-muted/40">
                  {columns.map((col) => (
                    <TableCell key={col.accessor} className={col.className}>
                      {col.cell ? col.cell(row) : (row[col.accessor] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — only when needed */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–
            {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TenantStatusCard
// Shown in the "Needs Attention" grid above the table.
// Displays status, rent, outstanding amount, last payment, and a one-click
// "Record Payment" button that pre-selects this unit in the dialog.
// ─────────────────────────────────────────────────────────────────────────────
function TenantStatusCard({ tenant, formatCurrency, onRecord }) {
  const { payment_status: status, payment_details, amount_outstanding } = tenant;
  const lastPayment = payment_details?.last_payment;

  // Border + background color by urgency
  const borderBg = {
    overdue: "border-red-200    bg-red-50/40",
    partial: "border-orange-200 bg-orange-50/40",
    due:     "border-yellow-200 bg-yellow-50/40",
  }[status] ?? "border-border bg-muted/20";

  return (
    <div className={`rounded-lg border ${borderBg} p-3 space-y-2.5 flex flex-col`}>

      {/* Tenant + unit header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{tenant.tenant_name}</p>
          <p className="text-xs text-muted-foreground">
            {tenant.floor_name} — {tenant.unit_name}
          </p>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      {/* Rent amount */}
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Rent</span>
        <span className="font-medium">{formatCurrency(tenant.rent_amount)}</span>
      </div>

      {/* Outstanding — only shown when there is a computable gap */}
      {amount_outstanding > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-orange-500" />
            Outstanding
          </span>
          <span className="font-semibold text-orange-700">
            {formatCurrency(amount_outstanding)}
          </span>
        </div>
      )}

      {/* Overdue with zero payments — show how long since move-in */}
      {status === "overdue" && !lastPayment && payment_details?.days_since_move_in && (
        <p className="text-xs text-red-600">
          No payments yet — {payment_details.days_since_move_in} days since move-in
        </p>
      )}

      {/* Last payment date + amount */}
      {lastPayment && (
        <div className="text-xs text-muted-foreground border-t pt-1.5">
          Last paid: {formatCurrency(lastPayment.amount)} on{" "}
          {new Date(lastPayment.created_at ?? lastPayment.period_start).toLocaleDateString()}
        </div>
      )}

      {/* Next due date */}
      {tenant.next_payment_date && (
        <p className="text-xs text-muted-foreground">
          Next due: {new Date(tenant.next_payment_date).toLocaleDateString()}
        </p>
      )}

      {/* Action button — fills remaining card height */}
      <div className="pt-0.5 mt-auto">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onRecord(tenant.unit_id)}
        >
          <Receipt className="h-3 w-3 mr-1.5" />
          Record Payment
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecordPaymentDialog
//
// Rules:
//  1. Never disabled because a cycle is settled — it switches to early mode.
//  2. Partial amounts always accepted; preview shows what remains after.
//  3. All landlord-recorded payments are status="completed" — no confirmation.
//  4. Dialog content scrolls inside a fixed max-height so the footer buttons
//     (Cancel / Record Payment) are always visible regardless of screen height.
//  5. preselectedUnitId auto-fills the unit picker when opened from a card.
// ─────────────────────────────────────────────────────────────────────────────
function RecordPaymentDialog({
  open,
  onOpenChange,
  occupiedUnits,
  propertyId,
  preselectedUnitId,
}) {
  const {
    fetchCycleBalance, clearCycleBalance,
    cycleBalance, cycleBalanceLoading, cycleBalanceError,
    recordLandlordPayment, recordLoading, recordError,
    formatCurrency,
  } = usePaymentTabStore();

  const [unitId,       setUnitId]       = useState("");
  const [amount,       setAmount]       = useState("");
  const [notes,        setNotes]        = useState("");
  const [notifyTenant, setNotifyTenant] = useState(false);

  // Apply pre-selection when dialog opens
  useEffect(() => {
    if (open && preselectedUnitId) setUnitId(String(preselectedUnitId));
  }, [open, preselectedUnitId]);

  // Full reset on close
  useEffect(() => {
    if (!open) {
      setUnitId(""); setAmount(""); setNotes(""); setNotifyTenant(false);
      clearCycleBalance();
    }
  }, [open, clearCycleBalance]);

  // Fetch live cycle balance when unit selection changes
  useEffect(() => {
    if (unitId) { fetchCycleBalance(unitId); setAmount(""); }
    else        { clearCycleBalance(); }
  }, [unitId, fetchCycleBalance, clearCycleBalance]);

  // ── Numbers derived from the cycle balance API response ──────────────────
  const amountNum    = parseFloat(amount)  || 0;
  const amountDue    = parseFloat(cycleBalance?.amount_due       || 0);
  const amountPaid   = parseFloat(cycleBalance?.amount_paid      || 0);
  const remaining    = parseFloat(cycleBalance?.amount_remaining || 0);
  const isSettled    = cycleBalance?.is_settled === true;
  const isEarlyCycle = cycleBalance?.is_early   === true;

  // If cycle is fully settled, landlord is paying AHEAD for the next cycle
  const isEarlyPayment = isSettled || isEarlyCycle;

  // The cap changes depending on mode:
  //   early mode  → full rent for next cycle (selectedUnit.rent_amount)
  //   normal mode → whatever is still outstanding this cycle
  const selectedUnit = occupiedUnits.find((u) => String(u.unit_id) === String(unitId));
  const maxAllowed   = isEarlyPayment
    ? parseFloat(selectedUnit?.rent_amount || 0)
    : remaining;

  const newTotal    = amountPaid + amountNum;
  const willSettle  = !isEarlyPayment && amountNum > 0 && newTotal >= amountDue;
  const isPartial   = !isEarlyPayment && amountNum > 0 && newTotal <  amountDue;
  const paymentType = isEarlyPayment ? "early" : willSettle ? "full" : isPartial ? "partial" : null;
  const amountValid = amountNum > 0 && amountNum <= maxAllowed;

  // Quick-fill shortcuts shown to the right of the label
  const quickFillOptions = useMemo(() => {
    if (!cycleBalance) return [];
    const cap = isEarlyPayment ? maxAllowed : remaining;
    if (cap <= 0) return [];
    // When partially paid already → just offer "Pay remaining"
    if (!isEarlyPayment && amountPaid > 0 && amountPaid < amountDue) {
      return [{ label: "Pay remaining", value: remaining }];
    }
    return [
      { label: "25%",  value: Math.floor((cap * 0.25) / 500) * 500 },
      { label: "50%",  value: Math.floor((cap * 0.50) / 500) * 500 },
      { label: "Full", value: cap },
    ].filter((o) => o.value > 0);
  }, [cycleBalance, isEarlyPayment, maxAllowed, remaining, amountPaid, amountDue]);

  async function handleSubmit() {
    if (!unitId || !amountValid) return;
    const result = await recordLandlordPayment({
      unitId, amount: amountNum, notes, notifyTenant, propertyId,
    });
    if (result.success) {
      const cs = result.data?.cycle_summary;
      toast.success("Payment recorded", {
        description: cs?.is_settled
          ? "This billing cycle is now fully settled."
          : isEarlyPayment
          ? "Recorded as an early payment for the next cycle."
          : `${formatCurrency(cs?.amount_remaining)} still outstanding this cycle.`,
      });
      onOpenChange(false);
    } else {
      toast.error("Could not record payment", { description: result.error });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        max-w-md keeps it compact.
        flex flex-col + max-h-[90vh] means the dialog never exceeds 90% of the
        viewport height. The scrollable area is the middle section only — header
        and footer are always visible.
      */}
      <DialogContent className="max-w-md flex flex-col max-h-[90vh]">

        {/* ── Fixed header ── */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Record a Payment
          </DialogTitle>
          <DialogDescription>
            Record cash or off-app payments instantly — no tenant confirmation
            needed. Partial, full, and early payments are all supported.
          </DialogDescription>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">

          {/* Step 1 — pick a unit */}
          <div className="space-y-1.5">
            <Label>Which unit is this for?</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a unit…" />
              </SelectTrigger>
              <SelectContent>
                {occupiedUnits.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No occupied units found
                  </div>
                ) : (
                  occupiedUnits.map((u) => (
                    <SelectItem key={u.unit_id} value={String(u.unit_id)}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {u.floor_name} — {u.unit_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.tenant_name} · {formatCurrency(u.rent_amount)}
                          {u.amount_outstanding > 0 && (
                            <span className="ml-1 text-orange-600">
                              · {formatCurrency(u.amount_outstanding)} outstanding
                            </span>
                          )}
                          {u.payment_status === "overdue" && (
                            <span className="ml-1 text-red-600">· Overdue</span>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Confirm selected tenant */}
            {selectedUnit && (
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  Tenant:{" "}
                  <span className="font-medium text-foreground">
                    {selectedUnit.tenant_name}
                  </span>
                </span>
                <span className="mx-0.5">·</span>
                <PaymentStatusBadge status={selectedUnit.payment_status} />
              </div>
            )}
          </div>

          {/* Loading spinner while fetching cycle balance */}
          {cycleBalanceLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Loading cycle balance…
            </div>
          )}

          {/* API error for cycle balance */}
          {cycleBalanceError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{cycleBalanceError}</AlertDescription>
            </Alert>
          )}

          {/* Step 2 — cycle status card (only after balance loads) */}
          {cycleBalance && !cycleBalanceLoading && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-3">

              {/* Cycle date range + early badge */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(cycleBalance.period_start).toLocaleDateString()} –{" "}
                  {new Date(cycleBalance.period_end).toLocaleDateString()}
                </span>
                {isEarlyPayment && <PaymentTypeBadge type="early" />}
              </div>

              {/* Amounts */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent due this cycle</span>
                  <span className="font-medium">{formatCurrency(amountDue)}</span>
                </div>

                {/* Already paid — only shown when > 0 */}
                {amountPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already paid</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(amountPaid)}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Outstanding / settled */}
                <div className="flex justify-between font-medium">
                  <span>{isSettled ? "Status" : "Outstanding"}</span>
                  <span className={isSettled ? "text-green-600" : "text-destructive"}>
                    {isSettled ? "Fully paid ✓" : formatCurrency(remaining)}
                  </span>
                </div>
              </div>

              {/* Progress bar — only when partially paid */}
              {amountPaid > 0 && !isSettled && (
                <CycleProgressBar paid={amountPaid} total={amountDue} />
              )}

              {/* Contextual messages */}
              {isSettled && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded p-2">
                  This cycle is fully paid. Recording now will be saved as an
                  early payment for the next billing cycle.
                </p>
              )}
              {isEarlyCycle && !isSettled && (
                <p className="text-xs text-muted-foreground">
                  This cycle hasn't started yet — will be recorded as an early payment.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — amount input (only after balance loads) */}
          {cycleBalance && !cycleBalanceLoading && (
            <div className="space-y-2">

              {/* Label row with quick-fill buttons on the right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label>Amount received (TZS)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-52 text-center">
                        {isEarlyPayment
                          ? "Recording an advance for the next billing cycle."
                          : "Partial amounts are allowed. The remaining balance stays outstanding until fully paid."}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {quickFillOptions.length > 0 && (
                  <div className="flex items-center gap-1">
                    {quickFillOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAmount(String(opt.value))}
                        className="text-xs px-2 py-0.5 rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                type="number"
                min={1}
                max={maxAllowed}
                step={500}
                placeholder={`Up to ${formatCurrency(maxAllowed)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* Over-limit error */}
              {amountNum > maxAllowed && maxAllowed > 0 && (
                <p className="text-xs text-destructive">
                  Exceeds maximum allowed: {formatCurrency(maxAllowed)}.
                </p>
              )}

              {/* Live preview line — shows type badge + what happens after submit */}
              {amountNum > 0 && amountValid && paymentType && (
                <div className="flex items-center gap-1.5 text-xs">
                  <PaymentTypeBadge type={paymentType} />
                  <span className="text-muted-foreground">
                    {isEarlyPayment
                      ? "Advance payment for next cycle."
                      : willSettle
                      ? "This will fully settle the current cycle."
                      : `${formatCurrency(amountDue - newTotal)} will remain outstanding after this.`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — optional notes */}
          {cycleBalance && !cycleBalanceLoading && (
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Cash received at the door, 20 March"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {/* Step 5 — notify tenant toggle */}
          {cycleBalance && !cycleBalanceLoading && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {notifyTenant
                    ? <Bell    className="h-4 w-4" />
                    : <BellOff className="h-4 w-4 text-muted-foreground" />}
                  Notify tenant
                </div>
                <p className="text-xs text-muted-foreground">
                  {notifyTenant
                    ? "Tenant will receive an SMS confirming this payment."
                    : "Tenant will not be notified — for your records only."}
                </p>
              </div>
              <Switch
                checked={notifyTenant}
                onCheckedChange={setNotifyTenant}
                aria-label="Notify tenant"
              />
            </div>
          )}

          {/* Record error */}
          {recordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{recordError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* ── Fixed footer — always visible ── */}
        <DialogFooter className="flex-shrink-0 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!unitId || !amountValid || recordLoading}
          >
            {recordLoading
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Recording…</>
              : <><Check      className="h-4 w-4 mr-2" />Record Payment</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmPaymentDialog
// Landlord accepts or rejects a TENANT-submitted pending payment.
// Rejection requires a mandatory reason that is sent back to the tenant.
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmPaymentDialog({ open, onOpenChange, payment, action, onSubmit, loading }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const { formatCurrency } = usePaymentTabStore();

  useEffect(() => { if (!open) setRejectionReason(""); }, [open]);

  if (!payment) return null;

  const isAccept = action === "accept";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isAccept ? "bg-green-100" : "bg-red-100"}`}>
              {isAccept
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : <XCircle      className="h-5 w-5 text-red-600"   />}
            </div>
            {isAccept ? "Confirm you received this payment" : "Reject this payment"}
          </DialogTitle>
          <DialogDescription>
            {isAccept
              ? "Confirming means you received this money from the tenant."
              : "Rejecting will tell the tenant their payment was not received."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Payment summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            {[
              ["Tenant", payment.tenant_name],
              ["Unit",   `${payment.unit_name}${payment.floor_number != null ? ` · Floor ${payment.floor_number}` : ""}`],
              ["Amount", <span key="amt" className="font-semibold text-base">{formatCurrency(payment.amount)}</span>],
              ["Period", `${new Date(payment.payment_period_start).toLocaleDateString()} – ${new Date(payment.payment_period_end).toLocaleDateString()}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Tenant note
                  </p>
                  <p className="text-xs">{payment.notes}</p>
                </div>
              </>
            )}
          </div>

          {/* Rejection fields */}
          {!isAccept && (
            <>
              <div className="space-y-1.5">
                <Label>
                  Reason for rejection{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Tell the tenant why this payment was not accepted…"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This will be sent to the tenant.
                </p>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The tenant will need to pay again through the proper channel.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(payment.id, action, rejectionReason)}
            disabled={loading || (!isAccept && !rejectionReason.trim())}
            className={isAccept
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600   hover:bg-red-700   text-white"}
          >
            {loading
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Processing…</>
              : isAccept
              ? <><Check className="h-4 w-4 mr-2" />Yes, I received it</>
              : <><X     className="h-4 w-4 mr-2" />Reject Payment</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentDetailDialog
// Full read-only detail view for any row in the history table.
// Shows source (landlord vs tenant), type badge, notes, rejection reason.
// ─────────────────────────────────────────────────────────────────────────────
function PaymentDetailDialog({ open, onOpenChange, payment }) {
  const { formatCurrency, getStatusColor } = usePaymentTabStore();
  if (!payment) return null;

  const isLandlordEntry = payment.payment_method === "landlord_entry";
  const type = derivePaymentType(payment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          <div className="rounded-lg border p-4 space-y-3">

            {/* Status + source + type */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className={getStatusColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>

            {isLandlordEntry && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Recorded by landlord
                </span>
              </div>
            )}

            {type && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <PaymentTypeBadge type={type} />
              </div>
            )}

            <Separator />

            {/* Core fields */}
            {[
              [<><User      className="h-3.5 w-3.5 inline mr-1" />Tenant</>  , payment.tenant_name],
              [<><Building2 className="h-3.5 w-3.5 inline mr-1" />Unit</>    , `${payment.unit_name}${payment.floor_number != null ? ` · Floor ${payment.floor_number}` : ""}`],
              [<><Banknote  className="h-3.5 w-3.5 inline mr-1" />Amount</>  , <span key="a" className="font-semibold text-base">{formatCurrency(payment.amount)}</span>],
              [<><CalendarDays className="h-3.5 w-3.5 inline mr-1" />Period</>, `${new Date(payment.payment_period_start).toLocaleDateString()} – ${new Date(payment.payment_period_end).toLocaleDateString()}`],
              ["Recorded on", new Date(payment.created_at).toLocaleDateString()],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}

            {payment.auto_confirmed && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-confirmed</span>
                <span className="text-green-600 font-medium">Yes</span>
              </div>
            )}

            {payment.rejection_reason && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Rejection reason</p>
                  <p className="text-destructive">{payment.rejection_reason}</p>
                </div>
              </>
            )}

            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p>{payment.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PropertyPaymentsTab  (main export)
//
// Props:
//   property  — processedProperty from PropertyDetailsPage
//   floorData — floors keyed by floor number (fallback unit source)
//   tenants   — raw tenants array from the property tenants API
//               Shape: tenants[].{ unit_id, unit_name, floor_name,
//               floor_number, tenant.full_name, rent_amount, payment_status,
//               payment_details, next_payment_date, occupancy_status }
//               This is the JSON you shared in the conversation.
// ─────────────────────────────────────────────────────────────────────────────
export default function PropertyPaymentsTab({ property, floorData, tenants }) {

  // ── Dialog visibility + selection state ─────────────────────────────────
  const [showRecordDialog,  setShowRecordDialog]  = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailDialog,  setShowDetailDialog]  = useState(false);
  const [selectedPayment,   setSelectedPayment]   = useState(null);
  const [confirmAction,     setConfirmAction]     = useState("");
  const [preselectedUnitId, setPreselectedUnitId] = useState(null);

  const {
    loading, error,
    filters, updateFilters,
    confirmPayment,
    getFilteredPayments,
    getPendingPayments,
    formatCurrency,
    getStatusColor,
    initializeTab,
    refreshData,
  } = usePaymentTabStore();

  // Initialize payment history when property loads
  useEffect(() => {
    if (property?.id) initializeTab(property.id);
  }, [property?.id, initializeTab]);

  // ── Build occupiedUnits ──────────────────────────────────────────────────
  //
  // PRIMARY source: `tenants` prop (from the property tenants API).
  //   Gives us payment_status, last_payment, next_payment_date right away
  //   without any extra API call.
  //
  // FALLBACK source: `floorData` (from property_floor on the property details
  //   endpoint). Used when tenants prop is not passed.
  //
  // amount_outstanding is computed here as a preview value.
  // The live cycle-balance API call inside the dialog is the authoritative figure.
  // ────────────────────────────────────────────────────────────────────────────
  const occupiedUnits = useMemo(() => {

    // ── Path A: tenants array ───────────────────────────────────────────
    if (Array.isArray(tenants) && tenants.length > 0) {
      return tenants
        .filter((t) => t.occupancy_status === "active")
        .map((t) => {
          const lastPayment = t.payment_details?.last_payment;
          const lastPaid    = parseFloat(lastPayment?.amount || 0);
          const rent        = parseFloat(t.rent_amount || 0);

          // Only show a computable outstanding for "partial" status
          const outstanding =
            t.payment_status === "partial" && lastPaid > 0 && lastPaid < rent
              ? rent - lastPaid
              : 0;

          return {
            unit_id:            t.unit_id,
            unit_name:          t.unit_name,
            floor_number:       t.floor_number,
            floor_name:         t.floor_name ?? `Floor ${t.floor_number}`,
            tenant_name:        t.tenant?.full_name ?? t.tenant_name ?? "—",
            rent_amount:        rent,
            payment_status:     t.payment_status,
            payment_details:    t.payment_details,
            next_payment_date:  t.next_payment_date,
            amount_outstanding: outstanding,
          };
        });
    }

    // ── Path B: floorData fallback ──────────────────────────────────────
    if (!floorData) return [];

    const result  = [];
    const entries = Array.isArray(floorData)
      ? floorData.map((f, i) => [String(f.floor_number ?? i + 1), f])
      : Object.entries(floorData);

    entries.forEach(([floorNum, floor]) => {
      (floor.units ?? floor.unit_list ?? []).forEach((unit) => {
        const tenantName =
          unit.current_tenant?.full_name ??
          unit.current_tenant?.name      ??
          unit.tenant_name               ??
          null;
        if (!tenantName) return;
        result.push({
          unit_id:            unit.id,
          unit_name:          unit.unit_name ?? unit.name,
          floor_number:       parseInt(floorNum, 10),
          floor_name:         floor.floor_name ?? `Floor ${floorNum}`,
          tenant_name:        tenantName,
          rent_amount:        parseFloat(unit.rent_amount ?? unit.monthly_rent ?? 0),
          payment_status:     unit.payment_status ?? "unknown",
          payment_details:    null,
          next_payment_date:  null,
          amount_outstanding: 0,
        });
      });
    });
    return result;

  }, [tenants, floorData]);

  // Units that need action — overdue / due / partial
  const attentionUnits = useMemo(
    () => occupiedUnits.filter((u) =>
      ["overdue", "due", "partial"].includes(u.payment_status)
    ),
    [occupiedUnits]
  );

  // Called from TenantStatusCard — opens dialog pre-filled for that unit
  function handleRecordForUnit(unitId) {
    setPreselectedUnitId(String(unitId));
    setShowRecordDialog(true);
  }

  function handleConfirmAction(payment, action) {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  }

  async function handleConfirmSubmit(paymentId, action, rejectionReason) {
    const success = await confirmPayment(paymentId, action, rejectionReason);
    if (success) {
      toast.success(
        action === "accept" ? "Payment confirmed" : "Payment rejected",
        {
          description: action === "accept"
            ? "The tenant has been notified."
            : "The tenant has been informed.",
        }
      );
      setShowConfirmDialog(false);
      setSelectedPayment(null);
    }
  }

  const filteredPayments = getFilteredPayments();
  const pendingPayments  = getPendingPayments();

  // ── Table column definitions ─────────────────────────────────────────────
  const columns = [
    {
      header: "Tenant",
      accessor: "tenant_name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.tenant_name ?? "—"}</p>
          {row.tenant_phone && (
            <p className="text-xs text-muted-foreground">{row.tenant_phone}</p>
          )}
        </div>
      ),
    },
    {
      header: "Unit",
      accessor: "unit_name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.unit_name ?? "—"}</p>
          {row.floor_number != null && (
            <p className="text-xs text-muted-foreground">Floor {row.floor_number}</p>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      // "Type" column — shows Early / Partial / Full / Recorded based on
      // payment_method and notes. Tenant-submitted rows show a dash.
      header: "Type",
      accessor: "payment_method",
      cell: (row) => {
        const t = derivePaymentType(row);
        return t
          ? <PaymentTypeBadge type={t} />
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      header: "Period",
      accessor: "payment_period_start",
      sortable: true,
      cell: (row) => (
        <span className="text-xs whitespace-nowrap">
          {new Date(row.payment_period_start).toLocaleDateString()} –{" "}
          {new Date(row.payment_period_end).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessor: "created_at",
      sortable: true,
      cell: (row) => (
        <span className="text-xs">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-1">

          {/* View full detail */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => { setSelectedPayment(row); setShowDetailDialog(true); }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Accept / Reject — only for tenant-submitted pending payments */}
          {row.status === "pending" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleConfirmAction(row, "accept")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>I received this payment</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleConfirmAction(row, "reject")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>I did not receive this</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 gap-2 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading payment data…
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Failed to load payments
        </h3>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <Button onClick={() => refreshData(property?.id)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Pending alert — tenant-submitted payments awaiting landlord action */}
      {pendingPayments.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <span className="font-medium">
              {pendingPayments.length} payment
              {pendingPayments.length > 1 ? "s" : ""} waiting for your confirmation.
            </span>{" "}
            Tenants reported these as paid — accept or reject using the ✓ and ✗
            buttons in the table below.
          </AlertDescription>
        </Alert>
      )}

      {/* No occupied units — explains why Record Payment is disabled */}
      {occupiedUnits.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No occupied units found. Assign tenants to units before recording payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Needs Attention — overdue / due / partial units */}
      {attentionUnits.length > 0 && (
        <CloudflareCard>
          <CloudflareCardHeader>
            <h3 className="text-base font-semibold">
              Needs Attention{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({attentionUnits.length} unit{attentionUnits.length > 1 ? "s" : ""})
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Units with outstanding or overdue payments — click Record Payment on
              any card to act immediately
            </p>
          </CloudflareCardHeader>
          <CloudflareCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {attentionUnits.map((t) => (
                <TenantStatusCard
                  key={t.unit_id}
                  tenant={t}
                  formatCurrency={formatCurrency}
                  onRecord={handleRecordForUnit}
                />
              ))}
            </div>
          </CloudflareCardContent>
        </CloudflareCard>
      )}

      {/* Toolbar — search, status filter, Record Payment button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenant or unit…"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(v) => updateFilters({ status: v })}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span needed so tooltip works when button is disabled */}
                <span>
                  <Button
                    onClick={() => {
                      setPreselectedUnitId(null);
                      setShowRecordDialog(true);
                    }}
                    className="flex-1 sm:flex-none"
                    disabled={occupiedUnits.length === 0}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {occupiedUnits.length === 0
                  ? "No occupied units — assign tenants first"
                  : "Record a cash or off-app payment for a tenant"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => refreshData(property?.id)}
            variant="outline"
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment history table */}
      <CloudflareCard>
        <CloudflareCardHeader>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            All payments recorded for this property
          </p>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <PaymentHistoryTable
            columns={columns}
            data={filteredPayments}
            emptyMessage="No payments found for this property yet."
          />
        </CloudflareCardContent>
      </CloudflareCard>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      <RecordPaymentDialog
        open={showRecordDialog}
        onOpenChange={(v) => {
          setShowRecordDialog(v);
          if (!v) setPreselectedUnitId(null);
        }}
        occupiedUnits={occupiedUnits}
        propertyId={property?.id}
        preselectedUnitId={preselectedUnitId}
      />

      <ConfirmPaymentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        payment={selectedPayment}
        action={confirmAction}
        onSubmit={handleConfirmSubmit}
        loading={loading}
      />

      <PaymentDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        payment={selectedPayment}
      />
    </div>
  );
}