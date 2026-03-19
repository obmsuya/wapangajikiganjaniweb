// app/(auth)/forgot-password/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, Phone, Lock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AuthService from "@/services/auth";

// ------------------------------------------------------------------
// Validation schemas for each step
// ------------------------------------------------------------------
const phoneSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
});

const passwordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ------------------------------------------------------------------
// Step indicators shown at the top
// ------------------------------------------------------------------
const STEPS = [
  { id: 1, label: "Verify Phone" },
  { id: 2, label: "New Password" },
  { id: 3, label: "Done" },
];

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Which step we are on: 1 = phone entry, 2 = new password, 3 = success
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [phone, setPhone] = useState("");
  const [passwords, setPasswords] = useState({
    new_password: "",
    confirm_password: "",
  });

  // Show/hide toggles for the two password fields
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Per-field validation errors
  const [errors, setErrors] = useState({});

  // ------------------------------------------------------------------
  // Step 1 — just validate the phone field client-side, then move on.
  // The actual server call happens in Step 2 with the full payload.
  // ------------------------------------------------------------------
  const handlePhoneNext = () => {
    const result = phoneSchema.safeParse({ phone_number: phone });

    if (!result.success) {
      // Map zod errors to the errors state
      const mapped = {};
      result.error.errors.forEach((e) => {
        mapped[e.path[0]] = e.message;
      });
      setErrors(mapped);
      return;
    }

    setErrors({});
    setStep(2);
  };

  // ------------------------------------------------------------------
  // Step 2 — send phone + new_password + confirm_password to the backend.
  // Backend: POST /api/v1/auth/password-reset/
  // Serializer already validates that passwords match server-side too.
  // ------------------------------------------------------------------
  const handlePasswordReset = async () => {
    const result = passwordSchema.safeParse(passwords);

    if (!result.success) {
      const mapped = {};
      result.error.errors.forEach((e) => {
        mapped[e.path[0]] = e.message;
      });
      setErrors(mapped);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await AuthService.resetPassword({
        phone_number: phone,
        new_password: passwords.new_password,
        confirm_password: passwords.confirm_password,
      });

      toast.success("Password Reset Successful", {
        description: response?.data?.message || response?.message || "Your password has been updated.",
      });

      setStep(3); // show success screen
    } catch (error) {
      // Backend returns { error: "No user found with this phone number" }
      // or a 400 with serializer errors
      const message =
        error.response?.data?.error ||
        error.response?.data?.non_field_errors?.[0] ||
        "Reset failed. Please try again.";

      toast.error("Reset failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Back to login */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Step progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  step >= s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  step >= s.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-px transition-colors duration-300 ${
                    step > s.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* ---- STEP 1: Phone number ---- */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Forgot Password?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the phone number linked to your account
                </p>
              </div>

              <Input
                label="Phone Number"
                name="phone_number"
                placeholder="+255 XXX XXX XXX"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone_number)
                    setErrors((prev) => ({ ...prev, phone_number: null }));
                }}
                error={errors.phone_number}
                className="h-12 bg-background/50"
              />

              <Button onClick={handlePhoneNext} className="w-full">
                Continue
              </Button>
            </motion.div>
          )}

          {/* ---- STEP 2: New password ---- */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Set New Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose a strong password for{" "}
                  <span className="text-foreground font-medium">{phone}</span>
                </p>
              </div>

              {/* New password field */}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNew ? "text" : "password"}
                  name="new_password"
                  placeholder="At least 8 characters"
                  value={passwords.new_password}
                  onChange={(e) => {
                    setPasswords((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }));
                    if (errors.new_password)
                      setErrors((prev) => ({ ...prev, new_password: null }));
                  }}
                  error={errors.new_password}
                  className="h-12 bg-background/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Confirm password field */}
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Repeat your new password"
                  value={passwords.confirm_password}
                  onChange={(e) => {
                    setPasswords((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }));
                    if (errors.confirm_password)
                      setErrors((prev) => ({
                        ...prev,
                        confirm_password: null,
                      }));
                  }}
                  error={errors.confirm_password}
                  className="h-12 bg-background/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                {/* Back to step 1 */}
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ---- STEP 3: Success ---- */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">
                  Password Reset!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. You can now sign in with your
                  new password.
                </p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}