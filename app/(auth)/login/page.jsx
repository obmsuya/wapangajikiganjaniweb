// app/(auth)/login/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, Building2, Shield, Zap } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthService from "@/services/auth";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import SmsCodeForm, { SMS_CODE_COPY } from "@/components/shared/SmsCodeForm";
import BillingService from "@/services/landlord/billing";

const SMS_SIGN_IN_COPY = { ...SMS_CODE_COPY.en, submitting: "Signing in..." };

// Only same-site paths, so ?next= can't send someone to another site.
// Resolving it catches tricks like "/\\evil.com" that a prefix check misses.
function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath) return null;
  try {
    const resolved = new URL(nextPath, window.location.origin);
    if (resolved.origin !== window.location.origin) return null;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return null;
  }
}

const loginSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [signInMethod, setSignInMethod] = useState("password");

  useEffect(() => {
    const requestedMethod = new URLSearchParams(window.location.search).get("method");
    if (requestedMethod === "sms") setSignInMethod("sms");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const goToDashboard = (user) => {
    // A full sign-in replaces any billing-link session left in this tab.
    BillingService.clearBillingSession();
    toast.success("Welcome back!", {
      description: `Hello ${user.full_name}, redirecting to your dashboard...`,
    });

    const destination = getSafeNextPath() || AuthService.getHomePathForUser(user);
    setTimeout(() => router.push(destination), 500);
  };

  const handleSmsCodeSignIn = async (phoneNumber, code) => {
    const user = await AuthService.loginWithOtp({ phone_number: phoneNumber, otp: code });
    goToDashboard(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await AuthService.login(formData);

      goToDashboard(user);
    } catch (error) {
      toast.error("Login failed", {
        description: error.response?.data?.error || "Invalid credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Building2,
      title: "Property Management",
      desc: "Effortlessly manage multiple properties",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      desc: "Bank-level security for your data",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      desc: "Instant notifications and updates",
    },
  ];

  return (
    <div className="h-screen md:overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full transition-all text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </motion.div>

      <div className="relative z-10 h-screen flex max-md:flex-col max-md:h-full max-md:justify-center">
        {/* Left Panel - Branding & Features */}
        <div className="w-full h-full p-4 max-md:hidden">
          <div className="h-full rounded-3xl relative overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1515263487990-61b07816b324?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870"
              fill
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            <div className="max-md:pt-12">
              <div className="p-4 md:p-8">
                <div className="text-center mb-8 space-y-2">
                  <h3 className="text-3xl font-bold text-foreground">
                    Sign In
                  </h3>
                  <p className="text-muted-foreground">
                    Sign in to access your dashboard and continue managing your
                    properties
                  </p>
                </div>

                {signInMethod === "sms" ? (
                  <SmsCodeForm
                    copy={SMS_SIGN_IN_COPY}
                    requestCode={AuthService.requestLoginOtp}
                    submitCode={handleSmsCodeSignIn}
                    submitLabel="Sign In"
                  />
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Input
                      label="Phone Number"
                      name="phone_number"
                      placeholder="+255 XXX XXX XXX"
                      value={formData.phone_number}
                      onChange={handleChange}
                      error={errors.phone_number}
                      className="h-12 bg-background/50"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative"
                  >
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      className="h-12 bg-background/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-between items-center"
                  >
                    <label className="flex items-center gap-2 text-xs md:text-sm">
                      <Checkbox />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs md:text-sm hover:underline text-primary"
                    >
                      Forgot password?
                    </Link>
                  </motion.div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setSignInMethod(signInMethod === "sms" ? "password" : "sms")}
                >
                  {signInMethod === "sms" ? "Sign in with password" : "Sign in with an SMS code"}
                </Button>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="my-4 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    New to Wapangaji Kiganjani?{" "}
                    <Link
                      href="/register"
                      className="text-primary hover:text-primary-700 font-semibold hover:underline"
                    >
                      Create your account
                    </Link>
                  </p>
                </motion.div>

                <motion.div className="flex items-center gap-4 my-4">
                  <div className="border border-border w-full" />
                  <p className="text-border font-semibold">or</p>
                  <div className="border border-border w-full" />
                </motion.div>

                <Link href="/register/partner" asChild>
                <Button variant="outline">Become a Partner</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
