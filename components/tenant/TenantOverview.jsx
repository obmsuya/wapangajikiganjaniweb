// components/tenant/TenantOverview.jsx
"use client";

import { useEffect } from "react";
import {
  Home, Calendar, AlertTriangle,
  Clock, CreditCard, BadgeCheck, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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

export default function TenantOverview({ onPayNow }) {
  const {
    occupancies, loading, error,
    fetchOccupancies, getUpcomingRent, getOverdueRent,
    getOccupancyStats, formatCurrency,
  } = useTenantDashboardStore();

  const { setSelectedUnit, setShowPaymentDialog } = useTenantPaymentStore();

  useEffect(() => { fetchOccupancies(); }, [fetchOccupancies]);

  const handleQuickPay = (occupancy) => {
    setSelectedUnit(occupancy);
    if (onPayNow) onPayNow(occupancy);
    else setShowPaymentDialog(true);
  };

  const upcomingRent = getUpcomingRent();
  const overdueRent  = getOverdueRent();
  const stats        = getOccupancyStats();

  // Also catch units that have a partial payment outstanding this cycle —
  // these may not appear in overdueRent/upcomingRent if the schedule store
  // hasn't picked them up yet, but cycle_balance tells us directly.
  const partialUnits = occupancies.filter((occ) => {
    const cb = occ.cycle_balance;
    return cb && !cb.is_settled && parseFloat(cb.amount_remaining || 0) > 0;
  });

  const hasUrgent      = overdueRent.length > 0 || upcomingRent.length > 0;
  const hasOutstanding = hasUrgent || partialUnits.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-48" />
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

      {/* ── CONDITIONAL: Amount due section ────────────────────────── */}
      {/* Only shown when there is something overdue or due soon       */}

      {overdueRent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide">
              Overdue — pay now
            </h3>
          </div>
          {overdueRent.slice(0, 3).map((rent) => {
            const cb           = rent.cycle_balance;
            const amountDue    = parseFloat(cb?.amount_due    || rent.rent_amount || 0);
            const amountPaid   = parseFloat(cb?.amount_paid   || 0);
            const amountLeft   = parseFloat(cb?.amount_remaining ?? amountDue);
            const paidPct      = amountDue > 0 ? Math.min(100, (amountPaid / amountDue) * 100) : 0;
            const hasPartial   = amountPaid > 0;

            return (
              <Card key={rent.unit_id} className="border-destructive/40">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold">{rent.unit_name}</p>
                      <p className="text-sm text-muted-foreground">{rent.property_name}</p>
                    </div>
                    {hasPartial && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Paid {fmt(amountPaid)} of {fmt(amountDue)}</span>
                          <span>{fmt(amountLeft)} left</span>
                        </div>
                        <Progress value={paidPct} className="h-1.5" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {rent.days_overdue} day{rent.days_overdue !== 1 ? "s" : ""} overdue
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="font-bold text-destructive">{fmt(amountLeft)}</p>
                    <Button size="sm" variant="destructive" onClick={() => handleQuickPay(rent)}>
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Pay Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {upcomingRent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Due soon
            </h3>
          </div>
          {upcomingRent.slice(0, 3).map((rent) => {
            const cb         = rent.cycle_balance;
            const amountDue  = parseFloat(cb?.amount_due    || rent.rent_amount || 0);
            const amountPaid = parseFloat(cb?.amount_paid   || 0);
            const amountLeft = parseFloat(cb?.amount_remaining ?? amountDue);
            const paidPct    = amountDue > 0 ? Math.min(100, (amountPaid / amountDue) * 100) : 0;
            const hasPartial = amountPaid > 0;

            return (
              <Card key={rent.unit_id} className="border">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold">{rent.unit_name}</p>
                      <p className="text-sm text-muted-foreground">{rent.property_name}</p>
                    </div>
                    {hasPartial && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Paid {fmt(amountPaid)} of {fmt(amountDue)}</span>
                          <span>{fmt(amountLeft)} left</span>
                        </div>
                        <Progress value={paidPct} className="h-1.5" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Due: {fmtDate(rent.due_date || rent.next_due_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="font-bold">{fmt(amountLeft)}</p>
                    <Button size="sm" onClick={() => handleQuickPay(rent)}>
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Pay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Partial payments outstanding — units with some balance still owed
          that don't appear in overdue/upcoming because schedule status may lag */}
      {!hasUrgent && partialUnits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Balance outstanding this cycle
            </h3>
          </div>
          {partialUnits.map((occ) => {
            const cb         = occ.cycle_balance;
            const amountDue  = parseFloat(cb?.amount_due    || occ.rent_amount || 0);
            const amountPaid = parseFloat(cb?.amount_paid   || 0);
            const amountLeft = parseFloat(cb?.amount_remaining ?? amountDue);
            const paidPct    = amountDue > 0 ? Math.min(100, (amountPaid / amountDue) * 100) : 0;

            return (
              <Card key={occ.unit_id} className="border">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold">{occ.unit_name}</p>
                      <p className="text-sm text-muted-foreground">{occ.property_name}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Paid {fmt(amountPaid)} of {fmt(amountDue)}</span>
                        <span className="font-medium">{fmt(amountLeft)} left</span>
                      </div>
                      <Progress value={paidPct} className="h-1.5" />
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="font-bold">{fmt(amountLeft)}</p>
                    <Button size="sm" onClick={() => handleQuickPay(occ)}>
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Pay remaining
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All clear — only show when truly nothing is owed anywhere */}
      {!hasOutstanding && stats.hasActiveRentals && (
        <Card className="border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BadgeCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">You're all caught up!</p>
              <p className="text-sm text-muted-foreground">
                No rent is due right now. Keep it up.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── All your units ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Your Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats.hasActiveRentals ? (
            <div className="text-center py-10 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium mb-1">No active rentals</p>
              <p className="text-sm">Contact your landlord to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupancies.map((occupancy) => {
                const cb         = occupancy.cycle_balance;
                const amountDue  = parseFloat(cb?.amount_due    || occupancy.rent_amount || 0);
                const amountPaid = parseFloat(cb?.amount_paid   || 0);
                const amountLeft = parseFloat(cb?.amount_remaining ?? amountDue);
                const isSettled  = cb?.is_settled ?? false;
                const paidPct    = amountDue > 0 ? Math.min(100, (amountPaid / amountDue) * 100) : 0;
                const hasPartial = amountPaid > 0 && !isSettled;

                return (
                  <Card key={occupancy.unit_id} className="border hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 space-y-4">
                      {/* Unit header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{occupancy.unit_name}</p>
                          <p className="text-xs text-muted-foreground">{occupancy.property_name}</p>
                        {occupancy.floor_number != null && (
                            <p className="text-xs text-muted-foreground">
                              Floor {occupancy.floor_number}
                            </p>
                          )}
                        </div>
                        {isSettled
                          ? <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <BadgeCheck className="h-3 w-3" /> Paid
                            </Badge>
                          : <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
                        }
                      </div>

                      <Separator />

                      {/* Financial summary */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {hasPartial ? "Outstanding" : "Rent"}
                          </span>
                          <span className="font-semibold">
                            {fmt(hasPartial ? amountLeft : amountDue)}
                          </span>
                        </div>
                        {hasPartial && (
                          <>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Paid {fmt(amountPaid)} of {fmt(amountDue)}</span>
                            </div>
                            <Progress value={paidPct} className="h-1.5" />
                          </>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Frequency</span>
                          <span>
                            Every {occupancy.payment_frequency} month
                            {parseInt(occupancy.payment_frequency) !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {occupancy.next_due_date && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Next due</span>
                            <span className="font-medium">{fmtDate(occupancy.next_due_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Pay button — always available unless settled */}
                      {!isSettled && (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleQuickPay(occupancy)}
                        >
                          <CreditCard className="h-4 w-4" />
                          {hasPartial ? "Pay remaining" : "Make payment"}
                        </Button>
                      )}

                      {/* Recent payments */}
                      {occupancy.recent_payments?.length > 0 && (
                        <div className="pt-1 border-t space-y-1">
                          <p className="text-xs text-muted-foreground">Recent payments</p>
                          {occupancy.recent_payments.slice(0, 2).map((p) => (
                            <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>{fmtDate(p.created_at)}</span>
                              <span>{fmt(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}