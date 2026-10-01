"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle, Clock, Crown, Loader2, LogIn, Smartphone, Unlink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api/api-client";
import BillingService from "@/services/landlord/billing";
import { MOBILE_PROVIDERS } from "@/components/landlord/subscription/mobileProviders";
import { BILLING_COPY, getBillingLanguage } from "@/components/landlord/billing/billingCopy";
import { BillingShell, BillingNotice, SmsSignInButton } from "@/components/landlord/billing/BillingShell";

const POLL_INTERVAL_MS = 5000;
const POLL_LIMIT_MS = 5 * 60 * 1000;
// Views that a billing session running out should replace; a payment in flight keeps waiting.
const VIEWS_ENDED_BY_EXPIRY = ["loading", "plans", "load_error"];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function PlanCardSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full mt-2" />
    </Card>
  );
}

export default function BillingPage() {
  const [language, setLanguage] = useState("sw");
  const [view, setView] = useState("loading");
  const [landlord, setLandlord] = useState(null);
  const [isFullSession, setIsFullSession] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [provider, setProvider] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [paidPlan, setPaidPlan] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const isPageOpenRef = useRef(true);
  const isPaymentStartingRef = useRef(false);

  const copy = BILLING_COPY[language];

  const loadBillingData = async () => {
    setView("loading");
    try {
      const [plansResponse, statusResponse, currentResponse] = await Promise.all([
        BillingService.getPlans(),
        BillingService.getSubscriptionStatus(),
        BillingService.getCurrentSubscription(),
      ]);
      setPlans(Array.isArray(plansResponse) ? plansResponse : plansResponse?.results || []);
      setSubscriptionStatus(statusResponse);
      setCurrentSubscription(currentResponse);
      setView("plans");
    } catch (error) {
      setView(BillingService.isSessionEndedError(error) ? "session_ended" : "load_error");
    }
  };

  useEffect(() => {
    isPageOpenRef.current = true;
    const billingSession = BillingService.getBillingSession();
    const signedInLandlord = BillingService.getSignedInLandlord();

    if (billingSession) {
      setLanguage(getBillingLanguage(billingSession.user));
      if (BillingService.isBillingSessionExpired(billingSession)) {
        setView("session_ended");
        return;
      }
      setLandlord({ name: billingSession.user?.full_name, phone: billingSession.user?.phone_number });
    } else if (signedInLandlord) {
      setIsFullSession(true);
      setLandlord({ name: signedInLandlord.full_name, phone: signedInLandlord.phone_number });
    } else {
      setView("no_session");
      return;
    }

    loadBillingData();

    let expiryTimer = null;
    if (billingSession) {
      const millisecondsLeft = Math.max(billingSession.expires_at - Date.now(), 0);
      expiryTimer = setTimeout(() => {
        setSelectedPlan(null);
        setView((currentView) => (VIEWS_ENDED_BY_EXPIRY.includes(currentView) ? "session_ended" : currentView));
      }, millisecondsLeft);
    }

    return () => {
      isPageOpenRef.current = false;
      clearTimeout(expiryTimer);
    };
  }, []);

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setProvider("");
    setAccountNumber(landlord?.phone || "");
    setCheckoutError("");
  };

  const finishSuccessfulPayment = async () => {
    setView("success");
    // The full session's token carries the plan in its claims; refresh it in
    // the background so the dashboard sees the new plan. The success page
    // never waits on it.
    if (isFullSession) {
      api.refreshToken().catch(() => null);
    }
  };

  const waitForPayment = async (transactionId) => {
    const startedAt = Date.now();
    while (isPageOpenRef.current) {
      await wait(POLL_INTERVAL_MS);
      if (!isPageOpenRef.current) return;
      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        setView("still_pending");
        return;
      }

      try {
        const transaction = await BillingService.getTransactionStatus(transactionId);
        setHasConnectionIssue(false);
        if (transaction?.status === "completed") {
          await finishSuccessfulPayment();
          return;
        }
        if (transaction?.status === "failed") {
          setFailureReason(transaction.failure_reason || "");
          setView("failed");
          return;
        }
      } catch (error) {
        // The link session can run out mid-payment; the payment itself still completes on the server.
        if (BillingService.isSessionEndedError(error)) {
          setView("still_pending");
          return;
        }
        setHasConnectionIssue(true);
      }
    }
  };

  const handlePay = async () => {
    if (isPaymentStartingRef.current) return;
    // AzamPay wants the digits only; people type spaces as the placeholder shows.
    const trimmedAccountNumber = accountNumber.replace(/\s/g, "");
    if (!provider || !trimmedAccountNumber) {
      setCheckoutError(copy.missingFields);
      return;
    }

    isPaymentStartingRef.current = true;
    setIsStartingPayment(true);
    setCheckoutError("");
    try {
      const response = await BillingService.startMobileMoneyCheckout({
        planId: selectedPlan.id,
        accountNumber: trimmedAccountNumber,
        provider,
      });
      if (!response?.transaction_id) {
        setCheckoutError(response?.error || copy.genericError);
        return;
      }
      setPaidPlan(selectedPlan);
      setPaymentPhone(trimmedAccountNumber);
      setSelectedPlan(null);
      setHasConnectionIssue(false);
      setView("waiting");
      waitForPayment(response.transaction_id);
    } catch (error) {
      if (BillingService.isSessionEndedError(error)) {
        setSelectedPlan(null);
        setView("session_ended");
      } else if (!error?.status) {
        setCheckoutError(copy.checkoutNetworkError);
      } else {
        setCheckoutError(error.data?.error || copy.genericError);
      }
    } finally {
      isPaymentStartingRef.current = false;
      setIsStartingPayment(false);
    }
  };

  const handleTryAgainAfterFailure = () => {
    setFailureReason("");
    loadBillingData();
  };

  const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleDateString(language === "sw" ? "sw-TZ" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const currentPlan = subscriptionStatus?.current_plan;
  const isCurrentPlan = (plan) => currentSubscription?.plan?.id === plan.id;

  return (
    <BillingShell language={language} onLanguageChange={setLanguage}>
      {view === "no_session" && (
        <BillingNotice icon={LogIn} title={copy.noSessionTitle} body={copy.noSessionBody}>
          <SmsSignInButton copy={copy} />
        </BillingNotice>
      )}

      {view === "session_ended" && (
        <BillingNotice
          icon={Unlink}
          iconClassName="text-muted-foreground"
          title={copy.sessionExpiredTitle}
          body={copy.sessionExpiredBody}
        >
          <SmsSignInButton copy={copy} />
        </BillingNotice>
      )}

      {view === "load_error" && (
        <BillingNotice
          icon={AlertTriangle}
          iconClassName="text-destructive"
          title={copy.loadErrorTitle}
          body={copy.noConnection.body}
        >
          <Button onClick={loadBillingData}>{copy.tryAgain}</Button>
        </BillingNotice>
      )}

      {view === "waiting" && (
        <BillingNotice
          icon={Loader2}
          iconClassName="text-primary animate-spin"
          title={copy.waitingTitle}
          body={copy.waitingBody(paymentPhone)}
        >
          {hasConnectionIssue && (
            <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
              {copy.connectionIssue}
            </p>
          )}
        </BillingNotice>
      )}

      {view === "success" && (
        <BillingNotice
          icon={CheckCircle}
          iconClassName="text-emerald-500"
          title={copy.successTitle}
          body={copy.successBody}
        >
          {paidPlan && <p className="font-semibold text-foreground">{paidPlan.name}</p>}
          {isFullSession && (
            <Button asChild variant="outline">
              <Link href="/landlord/properties">{copy.goToDashboard}</Link>
            </Button>
          )}
        </BillingNotice>
      )}

      {view === "failed" && (
        <BillingNotice
          icon={AlertTriangle}
          iconClassName="text-destructive"
          title={copy.failedTitle}
          body={failureReason ? `${failureReason}. ${copy.failedBody}` : copy.failedBody}
        >
          <Button onClick={handleTryAgainAfterFailure}>{copy.tryAgain}</Button>
        </BillingNotice>
      )}

      {view === "still_pending" && (
        <BillingNotice icon={Clock} iconClassName="text-amber-500" title={copy.pendingTitle} body={copy.pendingBody} />
      )}

      {(view === "loading" || view === "plans") && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{copy.title}</h1>
            {landlord?.name && <p className="text-muted-foreground">{copy.greeting(landlord.name)}</p>}
          </div>

          {view === "plans" && subscriptionStatus && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/40">
              <Crown className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{copy.currentPlan}</p>
                <p className="font-medium text-foreground">
                  {subscriptionStatus.has_active_subscription && currentPlan?.plan_name
                    ? currentPlan.plan_name
                    : copy.noActivePlan}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentPlan?.end_date && !currentPlan?.is_free_plan && `${copy.activeUntil(formatDate(currentPlan.end_date))} · `}
                  {copy.propertiesUsed(subscriptionStatus.property_counts?.total ?? 0, subscriptionStatus.property_limit)}
                </p>
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold text-foreground">{copy.choosePlan}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {view === "loading" ? (
              <>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </>
            ) : (
              plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan);
                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base leading-tight">{plan.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{plan.duration_display}</p>
                        </div>
                        {isCurrent && <Badge className="text-xs shrink-0">{copy.currentBadge}</Badge>}
                      </div>
                      <div className="mt-3">
                        <span className="text-3xl font-bold tracking-tight">{formatCurrency(plan.price)}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {copy.perDuration[plan.duration] || copy.perDuration.monthly}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                      <p className="text-sm text-muted-foreground">{copy.upToProperties(plan.property_limit)}</p>
                      {plan.description && <p className="text-sm text-muted-foreground flex-1">{plan.description}</p>}
                      <Button
                        className="mt-auto"
                        variant={isCurrent ? "secondary" : "default"}
                        disabled={isCurrent}
                        onClick={() => handleChoosePlan(plan)}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            {copy.currentBadge}
                          </>
                        ) : (
                          copy.choose
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      <Dialog
        open={view === "plans" && !!selectedPlan}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isStartingPayment) setSelectedPlan(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{copy.checkoutTitle}</DialogTitle>
            <DialogDescription>
              {selectedPlan?.name} · {formatCurrency(selectedPlan?.price)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <p id="billing-provider-label" className="text-sm font-medium">{copy.providerLabel}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="billing-provider-label">
                {MOBILE_PROVIDERS.map((mobileProvider) => {
                  const isSelected = provider === mobileProvider.id;
                  return (
                    <button
                      key={mobileProvider.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setProvider(mobileProvider.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <img src={mobileProvider.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                      <span>{mobileProvider.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-mobile-number" className="text-sm font-medium">
                {copy.phoneLabel}
              </Label>
              <Input
                id="billing-mobile-number"
                type="tel"
                autoComplete="tel"
                placeholder="+255 712 345 678"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
              />
            </div>

            {checkoutError && (
              <p role="alert" className="text-sm text-destructive">
                {checkoutError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isStartingPayment}
              onClick={() => setSelectedPlan(null)}
            >
              {copy.cancel}
            </Button>
            <Button className="flex-1" disabled={isStartingPayment} onClick={handlePay}>
              {isStartingPayment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  {copy.starting}
                </>
              ) : (
                <>
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  {copy.pay(formatCurrency(selectedPlan?.price))}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BillingShell>
  );
}
