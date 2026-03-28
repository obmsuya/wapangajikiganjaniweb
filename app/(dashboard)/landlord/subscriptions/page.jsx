"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Building2,
  ArrowRight,
  RefreshCw,
  Check,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useSubscriptionStore } from "@/stores/landlord/useSubscriptionStore";
import { toast } from "sonner";

const MOBILE_PROVIDERS = [
  { id: "AIRTEL",   name: "Airtel Money", logo: "/images/airtel-logo.png"    },
  { id: "TIGO",     name: "Tigo Pesa",    logo: "/images/tigo-logo.png"      },
  { id: "MPESA",    name: "M-Pesa",       logo: "/images/vodacom-logo.png"     },
  { id: "HALOPESA", name: "Halopesa",     logo: "/images/halopesa-logo.png"  },
  { id: "AZAMPESA", name: "Azam Pesa",    logo: "/images/azam-pesa-logo.png" },
];

const PERMISSION_LABELS = {
  auto_rent_reminders:    "Auto rent reminders",
  advanced_reporting:     "Advanced reporting",
  export_reports:         "Export reports",
  sms_notifications:      "SMS notifications",
  can_add_managers:       "Manager accounts",
  online_rent_collection: "Online rent collection",
  wallet_withdrawals:     "Wallet withdrawals",
  can_manage_tenants:     "Tenant management",
  website:                "Property website",
  tenant_page:            "Tenant portal",
  notification:           "Push notifications",
  customer_support:       "Priority support",
};

function PlanCardSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-10 w-full mt-2" />
    </Card>
  );
}

export default function SubscriptionPage() {
  const [activeTab,     setActiveTab]     = useState("plans");
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [showCheckout,  setShowCheckout]  = useState(false);
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [paymentData,   setPaymentData]   = useState({ provider: "", accountNumber: "" });
  const [isProcessing,  setIsProcessing]  = useState(false);

  const {
    loading,
    plans,
    currentSubscription,
    subscriptionStatus,
    subscriptionHistory,
    fetchPlans,
    fetchCurrentSubscription,
    fetchSubscriptionStatus,
    fetchSubscriptionHistory,
    processMNOPayment,
    cancelSubscription,
    formatCurrency,
  } = useSubscriptionStore();

  useEffect(() => {
    Promise.all([
      fetchPlans(),
      fetchCurrentSubscription(),
      fetchSubscriptionStatus(),
      fetchSubscriptionHistory(),
    ]);
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
    setPaymentData({ provider: "", accountNumber: "" });
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentData.provider || !paymentData.accountNumber) {
      toast.error("Please complete all required fields");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await processMNOPayment(
        selectedPlan.id,
        paymentData.accountNumber,
        paymentData.provider,
      );
      if (response?.success) {
        setShowCheckout(false);
        setShowSuccess(true);
        await Promise.all([fetchCurrentSubscription(), fetchSubscriptionStatus()]);
        setTimeout(() => { setShowSuccess(false); setActiveTab("plans"); }, 5000);
      }
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysRemaining = () => {
    if (!currentSubscription?.endDate) return 0;
    const diff = new Date(currentSubscription.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgress = () => {
    if (!currentSubscription?.startDate || !currentSubscription?.endDate) return 0;
    const total   = new Date(currentSubscription.endDate) - new Date(currentSubscription.startDate);
    const elapsed = Date.now() - new Date(currentSubscription.startDate);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const isCurrentPlan  = (plan) => currentSubscription?.plan?.id === plan.id;
  const daysRemaining  = getDaysRemaining();
  const isExpiringSoon = daysRemaining > 0 && daysRemaining < 7;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">

      {isExpiringSoon && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Subscription expiring in {daysRemaining} days
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Renew now to avoid service interruption.
            </p>
          </div>
          <Button size="sm" variant="destructive" onClick={() => setActiveTab("plans")}>
            Renew
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="plans"   className="flex-1">Plans</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        {/* ── Plans Tab ── */}
        <TabsContent value="plans" className="space-y-6 mt-6">

          {!loading && currentSubscription && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/40">
              <div className="flex items-center gap-3">
                <Crown className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    {currentSubscription.plan.name}
                    <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {daysRemaining} days remaining
                    {" · "}
                    {currentSubscription.plan.propertyLimit === -1
                      ? "Unlimited"
                      : currentSubscription.plan.propertyLimit}{" "}
                    {currentSubscription.plan.propertyLimit === 1 ? "property" : "properties"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <Progress value={getProgress()} className="h-1.5 w-24 hidden sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={cancelSubscription}
                  disabled={loading}
                >
                  Cancel plan
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </>
            ) : (
              plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan);

                const enabledFeatures = Object.entries(plan.features || {})
                  .filter(([, v]) => v === true)
                  .map(([k]) => PERMISSION_LABELS[k] || k.replace(/_/g, " "));

                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col relative overflow-hidden transition-all duration-200 ${
                      isCurrent
                        ? "ring-2 ring-primary shadow-sm"
                        : "hover:shadow-sm"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-primary" />
                    )}

                    <CardHeader className="pb-2 pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-semibold leading-tight">
                            {plan.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {plan.durationDisplay}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge className="text-xs shrink-0">Current</Badge>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="text-3xl font-bold tracking-tight">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          /{plan.duration === "annual"    ? "yr"
                            : plan.duration === "quarterly" ? "3mo"
                            : "mo"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 gap-4 pt-1">
                      <p className="text-sm text-muted-foreground">
                        Up to{" "}
                        <span className="font-semibold text-foreground">
                          {plan.propertyLimit === -1 ? "unlimited" : plan.propertyLimit}
                        </span>{" "}
                        {plan.propertyLimit === 1 ? "property" : "properties"}
                      </p>

                      {enabledFeatures.length > 0 && (
                        <ul className="space-y-2 flex-1">
                          {enabledFeatures.map((label) => (
                            <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                                <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                              </span>
                              <span className="capitalize">{label}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {enabledFeatures.length === 0 && <div className="flex-1" />}

                      <Button
                        className="w-full"
                        variant={isCurrent ? "secondary" : "default"}
                        disabled={isCurrent}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Current plan
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                            Choose plan
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-6">
          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : subscriptionHistory?.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden sm:table-cell">Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{sub.planName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{sub.planType}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()} –{" "}
                          {new Date(sub.endDate).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.status === "active" ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(sub.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No subscription history yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Checkout Dialog ── */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete payment</DialogTitle>
            <DialogDescription>
              {selectedPlan?.name} · {formatCurrency(selectedPlan?.price || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mobile money provider</Label>
              <div className="flex flex-wrap gap-2">
                {MOBILE_PROVIDERS.map((p) => {
                  const selected = paymentData.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setPaymentData((prev) => ({
                          ...prev,
                          provider: selected ? "" : p.id,
                        }))
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <img
                        src={p.logo}
                        alt={p.name}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span>{p.name}</span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
              {!paymentData.provider && (
                <p className="text-xs text-muted-foreground">Select a provider to continue.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-number" className="text-sm font-medium">
                Mobile number
              </Label>
              <Input
                id="mobile-number"
                type="tel"
                placeholder="+255 712 345 678"
                value={paymentData.accountNumber}
                onChange={(e) =>
                  setPaymentData((prev) => ({ ...prev, accountNumber: e.target.value }))
                }
              />
            </div>

            {selectedPlan && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/40 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Plan</span>
                  <span className="font-medium text-foreground">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Properties</span>
                  <span>
                    {selectedPlan.propertyLimit === -1 ? "Unlimited" : selectedPlan.propertyLimit}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedPlan.price)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                isProcessing || !paymentData.provider || !paymentData.accountNumber
              }
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Pay {formatCurrency(selectedPlan?.price || 0)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Payment successful
            </DialogTitle>
            <DialogDescription>Your subscription is now active.</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Plan</span>
              <span className="font-medium text-foreground">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Properties</span>
              <span>
                {selectedPlan?.propertyLimit === -1
                  ? "Unlimited"
                  : selectedPlan?.propertyLimit}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Amount paid</span>
              <span>{formatCurrency(selectedPlan?.price || 0)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              Go to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}