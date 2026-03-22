"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Banknote, Clock, AlertCircle, Check, X, RefreshCw, Search,
  PlusCircle, Info, Bell, BellOff, ChevronUp, ChevronDown,
  ChevronsUpDown, Eye, CheckCircle2, XCircle, AlertTriangle,
  User, Building2, CalendarDays, Receipt, Coins, CalendarClock,
  BadgeCheck, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function derivePaymentType(payment) {
  const notes = (payment.notes || "").toLowerCase();
  if (notes.includes("early")) return "early";
  if (payment.payment_method === "landlord_entry") return "landlord_entry";
  return null;
}

function PaymentTypeBadge({ type }) {
  const cfg = {
    early: { Icon: CalendarClock, label: "Early", cls: "bg-blue-50   text-blue-700   border-blue-200" },
    partial: { Icon: Coins, label: "Partial", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    full: { Icon: BadgeCheck, label: "Full", cls: "bg-green-50  text-green-700  border-green-200" },
    landlord_entry: { Icon: Receipt, label: "Recorded", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  }[type];
  if (!cfg) return null;
  const { Icon, label, cls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const cfg = {
    paid: { Icon: BadgeCheck, label: "Paid", cls: "bg-green-50  text-green-700  border-green-200" },
    overdue: { Icon: AlertTriangle, label: "Overdue", cls: "bg-red-50    text-red-700    border-red-200" },
    partial: { Icon: Coins, label: "Partial", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    due: { Icon: Clock, label: "Due", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  }[status];
  if (!cfg) return <span className="text-xs text-muted-foreground">{status ?? "—"}</span>;
  const { Icon, label, cls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function CycleProgressBar({ paid, total }) {
  if (!total || total <= 0) return null;
  const pct = Math.min(100, Math.round((paid / total) * 100));
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

function PaymentHistoryTable({ columns, data, emptyMessage = "No payments found." }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ field }) {
    if (sortField !== field)
      return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 h-3.5 w-3.5" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  }

  return (
    <div className="space-y-3">
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
                  ) : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : paginated.map((row, i) => (
              <TableRow key={row.id ?? i} className="hover:bg-muted/40">
                {columns.map((col) => (
                  <TableCell key={col.accessor} className={col.className}>
                    {col.cell ? col.cell(row) : (row[col.accessor] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–
            {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TenantStatusCard({ tenant, formatCurrency, onRecord }) {
  const { payment_status: status, payment_details, amount_outstanding } = tenant;
  const lastPayment = payment_details?.last_payment;

  const borderBg = {
    overdue: "border-red-200    bg-red-50/40",
    partial: "border-orange-200 bg-orange-50/40",
    due: "border-yellow-200 bg-yellow-50/40",
  }[status] ?? "border-border bg-muted/20";

  return (
    <div className={`rounded-lg border ${borderBg} p-3 space-y-2.5 flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{tenant.tenant_name}</p>
          <p className="text-xs text-muted-foreground">{tenant.floor_name} — {tenant.unit_name}</p>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Rent</span>
        <span className="font-medium">{formatCurrency(tenant.rent_amount)}</span>
      </div>

      {amount_outstanding > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-orange-500" />
            Outstanding
          </span>
          <span className="font-semibold text-orange-700">{formatCurrency(amount_outstanding)}</span>
        </div>
      )}

      {status === "overdue" && !lastPayment && payment_details?.days_since_move_in && (
        <p className="text-xs text-red-600">
          No payments yet — {payment_details.days_since_move_in} days since move-in
        </p>
      )}

      {lastPayment && (
        <div className="text-xs text-muted-foreground border-t pt-1.5">
          Last paid: {formatCurrency(lastPayment.amount)} on{" "}
          {new Date(lastPayment.created_at ?? lastPayment.period_start).toLocaleDateString()}
        </div>
      )}

      {tenant.next_payment_date && (
        <p className="text-xs text-muted-foreground">
          Next due: {new Date(tenant.next_payment_date).toLocaleDateString()}
        </p>
      )}

      <div className="pt-0.5 mt-auto">
        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => onRecord(tenant.unit_id)}>
          <Receipt className="h-3 w-3 mr-1.5" />
          Record Payment
        </Button>
      </div>
    </div>
  );
}


function RecordPaymentDialog({ open, onOpenChange, occupiedUnits, propertyId, preselectedUnitId }) {
  const {
    fetchCycleBalance, clearCycleBalance,
    cycleBalance, cycleBalanceLoading, cycleBalanceError,
    recordLandlordPayment, recordLoading, recordError,
    formatCurrency,
  } = usePaymentTabStore();

  const [unitId, setUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyTenant, setNotifyTenant] = useState(false);

  useEffect(() => {
    if (open && preselectedUnitId) setUnitId(String(preselectedUnitId));
  }, [open, preselectedUnitId]);

  useEffect(() => {
    if (!open) {
      setUnitId(""); setAmount(""); setNotes(""); setNotifyTenant(false);
      clearCycleBalance();
    }
  }, [open, clearCycleBalance]);

  useEffect(() => {
    if (unitId) { fetchCycleBalance(unitId); setAmount(""); }
    else { clearCycleBalance(); }
  }, [unitId, fetchCycleBalance, clearCycleBalance]);

  const selectedUnit = occupiedUnits.find((u) => String(u.unit_id) === String(unitId));

  const amountNum = parseFloat(amount) || 0;
  const amountDue = parseFloat(cycleBalance?.amount_due || 0);
  const amountPaid = parseFloat(cycleBalance?.amount_paid || 0);
  const remaining = parseFloat(cycleBalance?.amount_remaining || 0);
  const isSettled = cycleBalance?.is_settled === true;
  const isEarlyCycle = cycleBalance?.is_early === true;
  const isEarlyPayment = isSettled || isEarlyCycle;
  const maxAllowed = isEarlyPayment ? parseFloat(selectedUnit?.rent_amount || 0) : remaining;
  const newTotal = amountPaid + amountNum;
  const willSettle = !isEarlyPayment && amountNum > 0 && newTotal >= amountDue;
  const isPartial = !isEarlyPayment && amountNum > 0 && newTotal < amountDue;
  const paymentType = isEarlyPayment ? "early" : willSettle ? "full" : isPartial ? "partial" : null;
  const amountValid = amountNum > 0 && amountNum <= maxAllowed;

  const quickFillOptions = useMemo(() => {
    if (!cycleBalance) return [];
    const cap = isEarlyPayment ? maxAllowed : remaining;
    if (cap <= 0) return [];
    if (!isEarlyPayment && amountPaid > 0 && amountPaid < amountDue) {
      return [{ label: "Pay remaining", value: remaining }];
    }
    return [
      { label: "25%", value: Math.floor((cap * 0.25) / 500) * 500 },
      { label: "50%", value: Math.floor((cap * 0.50) / 500) * 500 },
      { label: "Full", value: cap },
    ].filter((o) => o.value > 0);
  }, [cycleBalance, isEarlyPayment, maxAllowed, remaining, amountPaid, amountDue]);

  async function handleSubmit() {
    if (!unitId || !amountValid) return;
    const result = await recordLandlordPayment({ unitId, amount: amountNum, notes, notifyTenant, propertyId });
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
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="flex flex-col max-h-[90dvh]">

          <div className="flex-shrink-0 px-6 pt-6 pb-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Record a Payment
              </DialogTitle>
              <DialogDescription>
                Record cash or off-app payments instantly — no tenant confirmation
                needed. Partial, full, and early payments are all supported.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable body — min-h-0 is required for flex children to shrink */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-5 pb-4">

            {/* Unit picker */}
            <div className="space-y-1.5">
              <Label>Which unit is this for?</Label>
              {/*
                FIX 2: SelectContent position="popper" lets the dropdown grow
                wider than the trigger to accommodate long unit names.
                w-[var(--radix-select-trigger-width)] is removed so it auto-sizes.
              */}
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a unit…" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="min-w-[var(--radix-select-trigger-width)] w-auto max-w-sm"
                >
                  {occupiedUnits.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No occupied units found
                    </div>
                  ) : (
                    occupiedUnits.map((u) => (
                      <SelectItem key={u.unit_id} value={String(u.unit_id)}>
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <span className="font-medium">{u.floor_name} — {u.unit_name}</span>
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

              {selectedUnit && (
                <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Tenant: <span className="font-medium text-foreground">{selectedUnit.tenant_name}</span></span>
                  <span className="mx-0.5">·</span>
                  <PaymentStatusBadge status={selectedUnit.payment_status} />
                </div>
              )}
            </div>

            {cycleBalanceLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading cycle balance…
              </div>
            )}

            {cycleBalanceError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cycleBalanceError}</AlertDescription>
              </Alert>
            )}

            {cycleBalance && !cycleBalanceLoading && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(cycleBalance.period_start).toLocaleDateString()} –{" "}
                    {new Date(cycleBalance.period_end).toLocaleDateString()}
                  </span>
                  {isEarlyPayment && <PaymentTypeBadge type="early" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent due this cycle</span>
                    <span className="font-medium">{formatCurrency(amountDue)}</span>
                  </div>
                  {amountPaid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Already paid</span>
                      <span className="font-medium text-green-700">{formatCurrency(amountPaid)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>{isSettled ? "Status" : "Outstanding"}</span>
                    <span className={isSettled ? "text-green-600" : "text-destructive"}>
                      {isSettled ? "Fully paid ✓" : formatCurrency(remaining)}
                    </span>
                  </div>
                </div>

                {amountPaid > 0 && !isSettled && (
                  <CycleProgressBar paid={amountPaid} total={amountDue} />
                )}

                {isSettled && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded p-2">
                    This cycle is fully paid. Recording now will be saved as an early payment for the next billing cycle.
                  </p>
                )}
                {isEarlyCycle && !isSettled && (
                  <p className="text-xs text-muted-foreground">
                    This cycle hasn't started yet — will be recorded as an early payment.
                  </p>
                )}
              </div>
            )}

            {cycleBalance && !cycleBalanceLoading && (
              <div className="space-y-2">
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

                {amountNum > maxAllowed && maxAllowed > 0 && (
                  <p className="text-xs text-destructive">
                    Exceeds maximum allowed: {formatCurrency(maxAllowed)}.
                  </p>
                )}

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

            {cycleBalance && !cycleBalanceLoading && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {notifyTenant
                      ? <Bell className="h-4 w-4" />
                      : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    Notify tenant
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notifyTenant
                      ? "Tenant will receive an SMS confirming this payment."
                      : "Tenant will not be notified — for your records only."}
                  </p>
                </div>
                <Switch checked={notifyTenant} onCheckedChange={setNotifyTenant} aria-label="Notify tenant" />
              </div>
            )}

            {recordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{recordError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Fixed footer — always visible inside the dialog */}
          <div className="flex-shrink-0 border-t px-6 py-4">
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={recordLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!unitId || !amountValid || recordLoading}>
                {recordLoading
                  ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Recording…</>
                  : <><Check className="h-4 w-4 mr-2" />Record Payment</>}
              </Button>
            </DialogFooter>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

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
                : <XCircle className="h-5 w-5 text-red-600" />}
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
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            {[
              ["Tenant", payment.tenant_name],
              ["Unit", `${payment.unit_name}${payment.floor_number != null ? ` · Floor ${payment.floor_number}` : ""}`],
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tenant note</p>
                  <p className="text-xs">{payment.notes}</p>
                </div>
              </>
            )}
          </div>

          {!isAccept && (
            <>
              <div className="space-y-1.5">
                <Label>Reason for rejection <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Tell the tenant why this payment was not accepted…"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">This will be sent to the tenant.</p>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>The tenant will need to pay again through the proper channel.</AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => onSubmit(payment.id, action, rejectionReason)}
            disabled={loading || (!isAccept && !rejectionReason.trim())}
            className={isAccept ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            {loading
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Processing…</>
              : isAccept
                ? <><Check className="h-4 w-4 mr-2" />Yes, I received it</>
                : <><X className="h-4 w-4 mr-2" />Reject Payment</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

            {[
              [<><User className="h-3.5 w-3.5 inline mr-1.5" />Tenant</>, payment.tenant_name],
              [<><Building2 className="h-3.5 w-3.5 inline mr-1.5" />Unit</>, `${payment.unit_name}${payment.floor_number != null ? ` · Floor ${payment.floor_number}` : ""}`],
              [<><Banknote className="h-3.5 w-3.5 inline mr-1.5" />Amount</>, <span key="a" className="font-semibold text-base">{formatCurrency(payment.amount)}</span>],
              [<><CalendarDays className="h-3.5 w-3.5 inline mr-1.5" />Period</>, `${new Date(payment.payment_period_start).toLocaleDateString()} – ${new Date(payment.payment_period_end).toLocaleDateString()}`],
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

export default function PropertyPaymentsTab({ property, floorData, tenants }) {
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmAction, setConfirmAction] = useState("");
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

  useEffect(() => {
    if (property?.id) initializeTab(property.id);
  }, [property?.id, initializeTab]);

  const occupiedUnits = useMemo(() => {
    if (Array.isArray(tenants) && tenants.length > 0) {
      return tenants
        .filter((t) => t.occupancy_status === "active")
        .map((t) => {
          const lastPayment = t.payment_details?.last_payment;
          const lastPaid = parseFloat(lastPayment?.amount || 0);
          const rent = parseFloat(t.rent_amount || 0);
          const outstanding = t.payment_status === "partial" && lastPaid > 0 && lastPaid < rent
            ? rent - lastPaid : 0;
          return {
            unit_id: t.unit_id,
            unit_name: t.unit_name,
            floor_number: t.floor_number,
            floor_name: t.floor_name ?? `Floor ${t.floor_number}`,
            tenant_name: t.tenant?.full_name ?? t.tenant_name ?? "—",
            rent_amount: rent,
            payment_status: t.payment_status,
            payment_details: t.payment_details,
            next_payment_date: t.next_payment_date,
            amount_outstanding: outstanding,
          };
        });
    }

    if (!floorData) return [];
    const result = [];
    const entries = Array.isArray(floorData)
      ? floorData.map((f, i) => [String(f.floor_number ?? i + 1), f])
      : Object.entries(floorData);
    entries.forEach(([floorNum, floor]) => {
      (floor.units ?? floor.unit_list ?? []).forEach((unit) => {
        const tenantName =
          unit.current_tenant?.full_name ?? unit.current_tenant?.name ?? unit.tenant_name ?? null;
        if (!tenantName) return;
        result.push({
          unit_id: unit.id,
          unit_name: unit.unit_name ?? unit.name,
          floor_number: parseInt(floorNum, 10),
          floor_name: floor.floor_name ?? `Floor ${floorNum}`,
          tenant_name: tenantName,
          rent_amount: parseFloat(unit.rent_amount ?? unit.monthly_rent ?? 0),
          payment_status: unit.payment_status ?? "unknown",
          payment_details: null,
          next_payment_date: null,
          amount_outstanding: 0,
        });
      });
    });
    return result;
  }, [tenants, floorData]);

  const attentionUnits = useMemo(
    () => occupiedUnits.filter((u) => ["overdue", "due", "partial"].includes(u.payment_status)),
    [occupiedUnits]
  );

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
        { description: action === "accept" ? "The tenant has been notified." : "The tenant has been informed." }
      );
      setShowConfirmDialog(false);
      setSelectedPayment(null);
    }
  }

  const filteredPayments = getFilteredPayments();
  const pendingPayments = getPendingPayments();

  const columns = [
    {
      header: "Tenant", accessor: "tenant_name", sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.tenant_name ?? "—"}</p>
          {row.tenant_phone && <p className="text-xs text-muted-foreground">{row.tenant_phone}</p>}
        </div>
      ),
    },
    {
      header: "Unit", accessor: "unit_name", sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.unit_name ?? "—"}</p>
          {row.floor_number != null && <p className="text-xs text-muted-foreground">Floor {row.floor_number}</p>}
        </div>
      ),
    },
    {
      header: "Amount", accessor: "amount", sortable: true,
      cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
    },
    {
      header: "Type", accessor: "payment_method",
      cell: (row) => {
        const t = derivePaymentType(row);
        return t ? <PaymentTypeBadge type={t} /> : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      header: "Period", accessor: "payment_period_start", sortable: true,
      cell: (row) => (
        <span className="text-xs whitespace-nowrap">
          {new Date(row.payment_period_start).toLocaleDateString()} –{" "}
          {new Date(row.payment_period_end).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Status", accessor: "status",
      cell: (row) => (
        <Badge variant="secondary" className={getStatusColor(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: "Date", accessor: "created_at", sortable: true,
      cell: (row) => <span className="text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      header: "Actions", accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => { setSelectedPayment(row); setShowDetailDialog(true); }}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {row.status === "pending" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost"
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleConfirmAction(row, "accept")}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>I received this payment</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleConfirmAction(row, "reject")}>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 gap-2 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading payment data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load payments</h3>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <Button onClick={() => refreshData(property?.id)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {pendingPayments.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <span className="font-medium">
              {pendingPayments.length} payment{pendingPayments.length > 1 ? "s" : ""} waiting for your confirmation.
            </span>{" "}
            Tenants reported these as paid — accept or reject using the ✓ and ✗ buttons in the table below.
          </AlertDescription>
        </Alert>
      )}

      {occupiedUnits.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No occupied units found. Assign tenants to units before recording payments.
          </AlertDescription>
        </Alert>
      )}

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
              Units with outstanding or overdue payments — click Record Payment on any card to act immediately
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
          <Select value={filters.status} onValueChange={(v) => updateFilters({ status: v })}>
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
                <span>
                  <Button
                    onClick={() => { setPreselectedUnitId(null); setShowRecordDialog(true); }}
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

          <Button onClick={() => refreshData(property?.id)} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CloudflareCard>
        <CloudflareCardHeader>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">All payments recorded for this property</p>
        </CloudflareCardHeader>
        <CloudflareCardContent>
          <PaymentHistoryTable
            columns={columns}
            data={filteredPayments}
            emptyMessage="No payments found for this property yet."
          />
        </CloudflareCardContent>
      </CloudflareCard>

      <RecordPaymentDialog
        open={showRecordDialog}
        onOpenChange={(v) => { setShowRecordDialog(v); if (!v) setPreselectedUnitId(null); }}
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