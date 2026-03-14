// app/(auth)/register/page.jsx - Simplified & Fixed
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Building2,
  Users,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Handshake,
  Sun,
  Moon,
  ArrowLeft
} from "lucide-react";
import customToast from "@/components/ui/custom-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AuthService from "@/services/auth";
import { useTheme } from "@/components/theme-provider";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirm_password: z.string(),
    referral_code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [showReferralCode, setShowReferralCode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    referral_code: "",
  });
  const [errors, setErrors] = useState({});
  const referralCodeDigitsRef = useRef(Array(8).fill(""));
  const referralInputsRef = useRef([]);

  const setReferralDigits = (nextDigits) => {
    referralCodeDigitsRef.current = nextDigits;
    const joined = nextDigits.join("");
    setFormData((prev) => ({ ...prev, referral_code: joined }));
  };

  const handleReferralChange = (index, value) => {
    const char = value
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 1)
      .toUpperCase();
    const nextDigits = [...referralCodeDigitsRef.current];
    nextDigits[index] = char;
    setReferralDigits(nextDigits);
    if (char && index < referralInputsRef.current.length - 1) {
      referralInputsRef.current[index + 1]?.focus();
    }
  };

  const handleReferralKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !referralCodeDigitsRef.current[index] &&
      index > 0
    ) {
      referralInputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      referralInputsRef.current[index - 1]?.focus();
    }
    if (
      e.key === "ArrowRight" &&
      index < referralInputsRef.current.length - 1
    ) {
      referralInputsRef.current[index + 1]?.focus();
    }
  };

  const handleReferralPaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 8)
      .toUpperCase();
    if (!pasted) return;
    const nextDigits = Array(8).fill("");
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setReferralDigits(nextDigits);
    referralInputsRef.current[Math.min(pasted.length, 7)]?.focus();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    try {
      registerSchema.parse(formData);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    setIsLoading(true);
    try {
      const { confirm_password, referral_code, ...registrationData } = formData;
      const joinedReferral = referralCodeDigitsRef.current.join("").trim();
      const userData = {
        ...registrationData,
        user_type: "landlord",
        ...(joinedReferral ? { referral_code: joinedReferral } : {}),
      };

      const user = await AuthService.register(userData);

      customToast.success("Welcome to Wapangaji Kiganjani!", {
        description: `Hello ${user.full_name}, setting up your account...`,
      });

      setTimeout(() => {
        router.push("/landlord/setup");
      }, 500);
    } catch (error) {
      customToast.error("Registration failed", {
        description: error.response?.data?.error || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[a-z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;
    return strength;
  };

  const benefits = [
    {
      icon: Building2,
      title: "Property Portfolio",
      desc: "Manage unlimited properties",
    },
    {
      icon: Users,
      title: "Tenant Management",
      desc: "Streamline tenant relations",
    },
    {
      icon: TrendingUp,
      title: "Revenue Tracking",
      desc: "Monitor your investments",
    },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 relative">
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

      {/* Floating Theme Toggle */}
      <div className="md:flex max-md:pt-12">
        {/* Left Side - Benefits */}
        <div className="hidden w-full p-4 h-screen sticky top-0">
          <div className="md:flex md:flex-1 md:flex-col md:justify-center md:px-8 h-full overflow-hidden relative rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1515263487990-61b07816b324?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870"
              fill
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex items-center justify-center px-4 py-12 md:w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:max-w-lg"
          >
            <div>
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground">
                    Create Your Account
                  </h1>
                  <p className="text-muted-foreground">
                    Start managing your properties today
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    {/* Full Name */}
                    <div className="w-full">
                      <label
                        htmlFor="full_name"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Full Name *
                      </label>
                      <Input
                        id="full_name"
                        name="full_name"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="h-12"
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.full_name}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="w-full">
                      <label
                        htmlFor="phone_number"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Phone Number *
                      </label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        placeholder="+255 XXX XXX XXX"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="h-12"
                      />
                      {errors.phone_number && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone_number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-12 pr-12"
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
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                    {formData.password && (
                      <div className="mt-2">
                        <Progress value={passwordStrength()} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Password strength:{" "}
                          {passwordStrength() < 50
                            ? "Weak"
                            : passwordStrength() < 75
                              ? "Good"
                              : "Strong"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm_password"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirm_password}
                      </p>
                    )}
                    {formData.confirm_password &&
                      formData.password === formData.confirm_password && (
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">
                            Passwords match
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Referral Code (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Referral Code (optional)
                    </label>
                    <div
                      className="flex items-center gap-2 justify-between"
                      onPaste={handleReferralPaste}
                    >
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Input
                          key={i}
                          inputMode="text"
                          maxLength={1}
                          value={referralCodeDigitsRef.current[i]}
                          onChange={(e) =>
                            handleReferralChange(i, e.target.value)
                          }
                          onKeyDown={(e) => handleReferralKeyDown(i, e)}
                          ref={(el) => (referralInputsRef.current[i] = el)}
                          className="text-center md:text-lg uppercase tracking-widest w-8 h-8 md:h-12 md:w-12"
                        />
                      ))}
                    </div>
                    {formData.referral_code && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Code: {formData.referral_code}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                {/* Links */}
                <div className="mt-4 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary font-semibold hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>

                  {/* Partner Registration Link */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Want to earn by referring landlords?
                    </p>
                    <Link href="/register/partner" asChild>
                      <Button variant="outline">
                        <Handshake className="w-4 h-4" />
                        Register as a Partner
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
