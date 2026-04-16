"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Calendar,
  Award,
  UserCheck,
  UserX,
  Clock,
  BarChart4,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePartnerPerformance } from "@/hooks/admin/useAdminPartner";

function formatCurrency(amount) {
  if (!amount) return "TZS 0";
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function formatPct(v) {
  if (!v) return "0%";
  return `${parseFloat(v).toFixed(1)}%`;
}

// Stat card — muted bg, no color hardcoding
function StatCard({ title, value, icon: Icon, loading, sub }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <p className="text-xl font-medium leading-none tabular-nums">{value}</p>
      )}
      {sub && !loading && (
        <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
      )}
    </div>
  );
}

// Labeled key-value row inside a card
function InfoRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${valueClass}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// Rank badge for top partners
function RankBadge({ rank }) {
  const labels = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (labels[rank]) {
    return <span className="text-base leading-none">{labels[rank]}</span>;
  }
  return (
    <span className="size-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
      {rank}
    </span>
  );
}

export default function PartnerAnalyticsDashboard() {
  const { performance, loading, refreshPerformance } = usePartnerPerformance();

  const stats = performance?.partner_stats ?? {};
  const financials = performance?.financial_stats ?? {};
  const topPartners = performance?.top_partners ?? [];
  const recentActivity = performance?.recent_activity ?? [];

  // Highest earner for progress bar context
  const maxEarned = useMemo(
    () => topPartners.reduce((m, p) => Math.max(m, p.total_earned ?? 0), 0),
    [topPartners],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium">Partner overview</h2>
          <p className="text-sm text-muted-foreground truncate">
            Performance metrics and commission activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 flex-none"
          onClick={refreshPerformance}
          disabled={loading}
        >
          <RefreshCw
            className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        <StatCard
          title="Total partners"
          value={stats.total_partners ?? 0}
          icon={Users}
          loading={loading}
          sub={`${stats.active_partners ?? 0} active`}
        />
        <StatCard
          title="Total referrals"
          value={stats.total_referrals ?? 0}
          icon={Activity}
          loading={loading}
          sub={`${stats.partners_with_referrals ?? 0} partners referred`}
        />
        <StatCard
          title="Conversion rate"
          value={formatPct(stats.conversion_rate)}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Commissions paid"
          value={formatCurrency(financials.total_commissions_paid)}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Pending payouts"
          value={formatCurrency(financials.outstanding_balance)}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Lifetime earned"
          value={formatCurrency(financials.lifetime_earned)}
          icon={BarChart4}
          loading={loading}
        />
      </div>

      {/* Partner health row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          {
            label: "Active",
            value: stats.active_partners ?? 0,
            total: stats.total_partners ?? 0,
            icon: UserCheck,
          },
          {
            label: "Suspended",
            value: stats.suspended_partners ?? 0,
            total: stats.total_partners ?? 0,
            icon: UserX,
          },
          {
            label: "With referrals",
            value: stats.partners_with_referrals ?? 0,
            total: stats.total_partners ?? 0,
            icon: Award,
          },
        ].map(({ label, value, total, icon: Icon }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div
              key={label}
              className="bg-muted/40 rounded-lg px-4 py-3.5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {pct}%
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <p className="text-lg font-medium tabular-nums leading-none">
                  {value}
                </p>
              )}
              <Progress value={pct} className="h-1" />
            </div>
          );
        })}
      </div>

      {/* Financial + Activity detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="size-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Financial summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {loading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-4 w-full my-2" />)
            ) : (
              <>
                <InfoRow
                  label="Lifetime earned"
                  value={formatCurrency(financials.lifetime_earned)}
                />
                <InfoRow
                  label="Total payouts"
                  value={formatCurrency(financials.total_payouts)}
                />
                <InfoRow
                  label="Outstanding balance"
                  value={formatCurrency(financials.outstanding_balance)}
                />
                <InfoRow
                  label="Avg commission"
                  value={formatCurrency(financials.average_commission)}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="size-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Activity summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {loading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-4 w-full my-2" />)
            ) : (
              <>
                <InfoRow
                  label="Commission transactions"
                  value={financials.total_commission_transactions ?? 0}
                />
                <InfoRow
                  label="Payout transactions"
                  value={financials.total_payout_transactions ?? 0}
                />
                <InfoRow
                  label="Partners with referrals"
                  value={stats.partners_with_referrals ?? 0}
                />
                <InfoRow
                  label="Suspended"
                  value={stats.suspended_partners ?? 0}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top performing partners */}
      {(loading || topPartners.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Top performing partners
            </p>

            {loading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 flex flex-col gap-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
            ) : (
              <div className="flex flex-col gap-2">
                {topPartners.map((partner, i) => {
                  const pct =
                    maxEarned > 0
                      ? Math.round(
                          ((partner.total_earned ?? 0) / maxEarned) * 100,
                        )
                      : 0;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border px-4 py-3"
                    >
                      <RankBadge rank={i + 1} />
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {partner.partner_name?.charAt(0) ?? "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {partner.partner_name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs font-mono shrink-0"
                          >
                            {partner.referral_code}
                          </Badge>
                          <Badge
                            variant={
                              partner.is_active ? "default" : "secondary"
                            }
                            className="text-xs shrink-0"
                          >
                            {partner.is_active ? "Active" : "Suspended"}
                          </Badge>
                        </div>
                        <Progress value={pct} className="h-1" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(partner.total_earned)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {partner.transaction_count ?? 0} txns
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Recent commission activity */}
      {(loading || recentActivity.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent commission activity
            </p>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs h-9">Partner</TableHead>
                    <TableHead className="text-xs h-9">Commission</TableHead>
                    <TableHead className="text-xs h-9">Rate</TableHead>
                    <TableHead className="text-xs h-9">Landlord</TableHead>
                    <TableHead className="text-xs h-9">Plan</TableHead>
                    <TableHead className="text-xs h-9">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <TableRow key={i}>
                            {Array(6)
                              .fill(0)
                              .map((_, j) => (
                                <TableCell key={j} className="py-2">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              ))}
                          </TableRow>
                        ))
                    : recentActivity.map((row, i) => (
                        <TableRow key={i} className="h-12">
                          <TableCell className="text-sm font-medium">
                            {row.partner_name}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums font-medium text-primary">
                            {formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell>
                            {row.commission_rate ? (
                              <Badge
                                variant="outline"
                                className="text-xs tabular-nums"
                              >
                                {parseFloat(row.commission_rate).toFixed(1)}%
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.landlord_name ?? "—"}
                          </TableCell>
                          <TableCell>
                            {row.plan_name ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm">{row.plan_name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {row.plan_type}
                                </span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {formatDate(row.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
