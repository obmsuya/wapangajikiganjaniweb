"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Unlink, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthService from "@/services/auth";
import BillingService from "@/services/landlord/billing";
import { BILLING_COPY } from "@/components/landlord/billing/billingCopy";
import { BillingShell, BillingNotice, SmsSignInButton } from "@/components/landlord/billing/BillingShell";

const LINK_ERROR_CODES = ["link_invalid", "link_expired", "link_used"];
const BILLING_SESSION_SECONDS = 1800;

export default function BillingLinkPage() {
  const { code } = useParams();
  const router = useRouter();
  const [language, setLanguage] = useState("sw");
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const exchangedAttemptRef = useRef(-1);

  useEffect(() => {
    // React dev mode runs effects twice and a link works once, so each attempt exchanges once.
    if (exchangedAttemptRef.current === attempt) return;
    exchangedAttemptRef.current = attempt;

    const exchangeLinkCode = async () => {
      try {
        const response = await AuthService.exchangeBillingLink(code);
        const signedInLandlord = BillingService.getSignedInLandlord();
        const isSameLandlordSignedIn =
          !!signedInLandlord &&
          !AuthService.isTokenExpired(signedInLandlord) &&
          String(signedInLandlord.user_id) === String(response.user?.id);

        if (isSameLandlordSignedIn) {
          BillingService.clearBillingSession();
        } else {
          BillingService.saveBillingSession({
            access: response.tokens.access,
            user: response.user,
            expiresInSeconds: response.expires_in ?? BILLING_SESSION_SECONDS,
          });
        }
        router.replace("/billing");
      } catch (error) {
        if (!error?.status) {
          setFailure("network");
          return;
        }
        const errorCode = error.data?.code;
        setFailure(LINK_ERROR_CODES.includes(errorCode) ? errorCode : "link_invalid");
      }
    };

    exchangeLinkCode();
  }, [attempt, code, router]);

  const copy = BILLING_COPY[language];

  const handleRetry = () => {
    setFailure(null);
    setAttempt((previousAttempt) => previousAttempt + 1);
  };

  return (
    <BillingShell language={language} onLanguageChange={setLanguage}>
      {!failure && (
        <BillingNotice icon={Loader2} iconClassName="text-primary animate-spin" title={copy.openingLink} />
      )}

      {failure === "network" && (
        <BillingNotice
          icon={WifiOff}
          iconClassName="text-muted-foreground"
          title={copy.noConnection.title}
          body={copy.noConnection.body}
        >
          <Button onClick={handleRetry}>{copy.tryAgain}</Button>
        </BillingNotice>
      )}

      {LINK_ERROR_CODES.includes(failure) && (
        <BillingNotice
          icon={Unlink}
          iconClassName="text-muted-foreground"
          title={copy.linkErrors[failure].title}
          body={copy.linkErrors[failure].body}
        >
          <SmsSignInButton copy={copy} />
        </BillingNotice>
      )}
    </BillingShell>
  );
}
