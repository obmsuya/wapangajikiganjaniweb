"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BILLING_COPY, SMS_SIGN_IN_FOR_BILLING_PATH } from "./billingCopy";

export function BillingShell({ language, onLanguageChange, children }) {
  const copy = BILLING_COPY[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <p className="text-base font-bold text-foreground">Wapangaji Kiganjani</p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onLanguageChange(language === "sw" ? "en" : "sw")}
          >
            <Globe className="w-4 h-4" />
            {copy.otherLanguage}
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

// A full-page message with an icon, used for errors, waiting and success.
export function BillingNotice({ icon: Icon, iconClassName = "text-primary", title, body, children }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 space-y-4">
      <Icon className={`h-12 w-12 mx-auto ${iconClassName}`} aria-hidden="true" />
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {body && <p className="text-muted-foreground">{body}</p>}
      {children && <div className="space-y-3 pt-2">{children}</div>}
    </div>
  );
}

export function SmsSignInButton({ copy }) {
  return (
    <Button asChild>
      <Link href={SMS_SIGN_IN_FOR_BILLING_PATH}>{copy.signInWithSmsCode}</Link>
    </Button>
  );
}
