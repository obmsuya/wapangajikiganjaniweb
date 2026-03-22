// components/tenant/TenantRentSchedule.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Calendar, Clock, CreditCard, AlertTriangle, Home,
  ChevronUp, ChevronDown, ChevronsUpDown, Eye,
  CheckCircle2, XCircle, Info,
} from "lucide-react";
import { Button }      from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }       from "@/components/ui/badge";
import { Skeleton }    from "@/components/ui/skeleton";
import { Separator }   from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTenantDashboardStore } from "@/stores/tenant/useTenantDashboardStore";
import { useTenantPaymentStore }   from "@/stores/tenant/useTenantPaymentStore";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(amount) {
  if (!amount && amount !== 0) return "TZS 0";
  return new Intl.NumberFormat("sw-TZ", {
    style: "currency", currency: "TZS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-TZ", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Schedule detail dialog ────────────────────────────────────────────────────
function ScheduleDetailDialog({ schedule, open, onOpenChange, onPayNow }) {
  if (!schedule) return null;
  const isPaid    = schedule.is_paid;
  const isOverdue = schedule.days_overdue > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Rent Period Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{schedule.unit_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{schedule.property_name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent amount</span>
              <span className="font-semibold text-base">{fmt(schedule.rent_amount)}</span>
            </div>
            {/* Partial payment info */}
            {schedule.amount_paid > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid so far</span>
                <span className="font-medium text-primary">{fmt(schedule.amount_paid)}</span>
              </div>
            )}
            {schedule.amount_remaining > 0 && !isPaid && (
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Still owed</span>
                <span className="text-destructive">{fmt(schedule.amount_remaining)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span>{fmtDate(schedule.period_start)} – {fmtDate(schedule.period_end)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span className={isOverdue && !isPaid ? "text-destructive font-medium" : ""}>
                {fmtDate(schedule.due_date)}
              </span>
            </div>
            {isOverdue && !isPaid && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days overdue</span>
                <span className="text-destructive font-medium">{schedule.days_overdue} days</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              {isPaid ? (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </Badge>
              ) : isOverdue ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" /> Due
                </Badge>
              )}
            </div>
          </div>

          {!isPaid && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {isOverdue
                  ? "This payment is overdue. Pay as soon as possible to avoid issues."
                  : "Pay before the due date to keep a good rental record."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="w-fit" onClick={() => onOpenChange(false)}>Close</Button>
          {!isPaid && (
            <Button
              onClick={() => { onPayNow(schedule); onOpenChange(false); }}
              variant={isOverdue ? "destructive" : "default"}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TenantRentSchedule({ onPayNow }) {
  const {
    rentSchedules,
    loading,
    error,
    fetchRentSchedules,
    getPaymentStatus,
    formatCurrency,
  } = useTenantDashboardStore();

  const { setSelectedUnit, setPaymentFlow } = useTenantPaymentStore();

  const [sortField, setSortField] = useState("due_date");
  const [sortDir,   setSortDir]   = useState("asc");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetail,        setShowDetail]        = useState(false);

  useEffect(() => { fetchRentSchedules(); }, [fetchRentSchedules]);

  const handlePayNow = (schedule) => {
    setSelectedUnit({
      unit_id:          schedule.unit_id,
      unit_name:        schedule.unit_name,
      property_name:    schedule.property_name,
      rent_amount:      schedule.rent_amount,
      payment_frequency: schedule.payment_frequency,
    });
    setPaymentFlow("select");
    onPayNow?.();
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground inline" />;
    return sortDir === "asc"
      ? <ChevronUp   className="ml-1 h-3.5 w-3.5 inline" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 inline" />;
  };

  const sorted = [...rentSchedules].sort((a, b) => {
    const av = a[sortField]; const bv = b[sortField];
    if (av == null) return 1; if (bv == null) return -1;
    const cmp = typeof av === "number"
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const paid    = rentSchedules.filter(s => s.is_paid);
  const unpaid  = rentSchedules.filter(s => !s.is_paid);
  const overdue = unpaid.filter(s => s.days_overdue > 0);
  const due     = unpaid.filter(s => s.days_overdue === 0);

  const statusBadge = (schedule) => {
    if (schedule.is_paid)            return <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>;
    if (schedule.days_overdue > 0)   return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Overdue {schedule.days_overdue}d</Badge>;
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Due</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary row — always visible */}
      {rentSchedules.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Paid",    count: paid.length,    total: paid.reduce((s,r)=>s+r.rent_amount,0),    variant: "outline" },
            { label: "Due",     count: due.length,     total: due.reduce((s,r)=>s+r.rent_amount,0),     variant: "secondary" },
            { label: "Overdue", count: overdue.length, total: overdue.reduce((s,r)=>s+r.rent_amount,0), variant: overdue.length > 0 ? "destructive" : "secondary" },
            { label: "Periods", count: rentSchedules.length, total: null, variant: "outline" },
          ].map(({ label, count, total, variant }) => (
            <Card key={label} className="border">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {total !== null && (
                  <p className="text-xs font-medium mt-1">{formatCurrency(total)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have{" "}
            <span className="font-semibold">
              {overdue.length} overdue payment{overdue.length > 1 ? "s" : ""}
            </span>
            . Please pay as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      {/* Schedule table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rent Schedule
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {paid.length} paid · {unpaid.length} pending
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rentSchedules.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground px-6">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium mb-1">No schedule yet</p>
              <p className="text-sm">Your rent schedule will appear here once set up by your landlord.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("unit_name")}>
                        Unit <SortIcon field="unit_name" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("due_date")}>
                        Due date <SortIcon field="due_date" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Period</TableHead>
                    <TableHead>
                      <button className="flex items-center font-medium" onClick={() => toggleSort("rent_amount")}>
                        Amount <SortIcon field="rent_amount" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => { setSelectedSchedule(schedule); setShowDetail(true); }}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{schedule.unit_name}</p>
                        <p className="text-xs text-muted-foreground">{schedule.property_name}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={
                          !schedule.is_paid && schedule.days_overdue > 0
                            ? "text-destructive font-medium"
                            : ""
                        }>
                          {fmtDate(schedule.due_date)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {fmtDate(schedule.period_start)} – {fmtDate(schedule.period_end)}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatCurrency(schedule.rent_amount)}
                        {/* Show remaining if partial */}
                        {schedule.amount_paid > 0 && !schedule.is_paid && (
                          <p className="text-xs text-muted-foreground font-normal">
                            {formatCurrency(schedule.amount_remaining ?? (schedule.rent_amount - schedule.amount_paid))} left
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(schedule)}</TableCell>
                      <TableCell className="text-right">
                        {schedule.is_paid ? (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setSelectedSchedule(schedule); setShowDetail(true); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={schedule.days_overdue > 0 ? "destructive" : "default"}
                            onClick={(e) => { e.stopPropagation(); handlePayNow(schedule); }}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <ScheduleDetailDialog
        schedule={selectedSchedule}
        open={showDetail}
        onOpenChange={setShowDetail}
        onPayNow={handlePayNow}
      />
    </div>
  );
}