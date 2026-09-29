"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";

const DEFAULT_RESEND_SECONDS = 60;

function describeSmsCodeError(error, copy) {
  const errorCode = error?.data?.code;
  if (errorCode === "otp_invalid" || errorCode === "otp_missing") {
    return copy.codeWrong(error.data.attempts_left);
  }
  if (errorCode === "otp_expired") return copy.codeExpired;
  if (errorCode === "otp_locked") return copy.codeLocked;
  if (errorCode && copy.errors?.[errorCode]) return copy.errors[errorCode];
  if (!error?.status) return copy.networkError;
  if (error.status === 429) return copy.tooManyRequests;
  return error.data?.error || error.data?.detail || copy.genericError;
}

// Phone → SMS code → submit. The caller decides what the code unlocks.
export default function SmsCodeForm({ copy, requestCode, submitCode, submitLabel, isSubmitBlocked = false, children }) {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendSecondsLeft, setResendSecondsLeft] = useCountdown();

  const handleSendCode = async (event) => {
    event?.preventDefault();
    const trimmedPhoneNumber = phoneNumber.trim();
    if (!trimmedPhoneNumber) {
      setErrorMessage(copy.phoneRequired);
      return;
    }
    if (isSending) return;

    setIsSending(true);
    setErrorMessage("");
    try {
      const response = await requestCode(trimmedPhoneNumber);
      setResendSecondsLeft(response?.resend_after ?? DEFAULT_RESEND_SECONDS);
      setCode("");
      setStep("code");
    } catch (error) {
      setErrorMessage(describeSmsCodeError(error, copy));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage(copy.codeFormat);
      return;
    }
    if (isSubmitting || isSubmitBlocked) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await submitCode(phoneNumber.trim(), code);
    } catch (error) {
      setErrorMessage(describeSmsCodeError(error, copy));
      setIsSubmitting(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setCode("");
    setErrorMessage("");
  };

  if (step === "phone") {
    return (
      <form onSubmit={handleSendCode} className="space-y-4" noValidate>
        <Input
          type="tel"
          name="phone_number"
          autoComplete="tel"
          aria-label={copy.phoneLabel}
          placeholder="+255 XXX XXX XXX"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          aria-invalid={!!errorMessage}
          className="h-12 bg-background/50"
        />
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <Button type="submit" disabled={isSending}>
          {isSending ? copy.sending : copy.sendCode}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitCode} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        {copy.codeSentTo(phoneNumber.trim())}{" "}
        <button
          type="button"
          onClick={handleChangeNumber}
          className="text-primary hover:underline font-medium"
        >
          {copy.changeNumber}
        </button>
      </p>
      <Input
        type="text"
        name="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label={copy.codeLabel}
        placeholder="123456"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        aria-invalid={!!errorMessage}
        className="h-12 bg-background/50 tracking-[0.5em] text-center"
        autoFocus
      />
      {children}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting || isSubmitBlocked}>
        {isSubmitting ? copy.submitting : submitLabel}
      </Button>
      <button
        type="button"
        onClick={handleSendCode}
        disabled={resendSecondsLeft > 0 || isSending}
        className="w-full text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
      >
        {resendSecondsLeft > 0 ? copy.resendIn(resendSecondsLeft) : copy.resend}
      </button>
    </form>
  );
}
