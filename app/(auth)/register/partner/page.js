"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Moon,
  Sun,
  Handshake,
  DollarSign,
  Users,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  Star,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const partnerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    phone_number: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^\+?[1-9]\d{8,14}$/, "Please enter a valid phone number"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export default function PartnerRegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    try {
      partnerSchema.parse(formData);
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
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/partner");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const partnerBenefits = [
    {
      icon: DollarSign,
      title: "Earn Commissions",
      desc: "Get paid for every successful referral",
    },
    {
      icon: Users,
      title: "No Limits",
      desc: "Refer unlimited landlords and grow your income",
    },
    {
      icon: TrendingUp,
      title: "Track Performance",
      desc: "Monitor your referrals and earnings in real-time",
    },
  ];

  const passwordStrength = () => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[a-z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;
    return strength;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Theme Toggle */}
      <motion.button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-5 right-4 z-50 p-3 rounded-full bg-card border border-border transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Back to Regular Registration */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-4 z-50"
      >
        <Link
          href="/register"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full transition-all text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>
      </motion.div>

      {/* Background Design */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Floating Elements */}
          <motion.div
            className="absolute top-20 left-10 w-24 h-24 bg-accent/10 rounded-full blur-xl"
            animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-16 w-20 h-20 bg-primary/10 rounded-full blur-xl"
            animate={{ y: [0, 20, 0], scale: [1, 0.9, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-32 left-1/4 w-16 h-16 bg-accent/15 rounded-full blur-lg"
            animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Partner Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-start lg:p-12 xl:p-16 lg:mt-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl w-full mx-auto"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4"
              >
                <Handshake className="w-6 h-6 text-accent-foreground/75" />
              </motion.div>
              <h2 className="font-serif text-4xl xl:text-4xl text-foreground mb-4 leading-tight text-balance">
                Become Our Partner
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Join our partner program and earn commissions by referring
                landlords to our platform.
              </p>
            </div>

            <div className="space-y-6">
              {partnerBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="w-12 h-12 bg-primary/15 border border-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors duration-300">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Commission Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-14 p-6 bg-amber-100 rounded-2xl border border-amber-500"
            >
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-amber-500" />
                <h4 className="font-medium text-amber-600">Partner Rewards</h4>
              </div>
              <p className="text-amber-600 leading-relaxed">
                Earn competitive commissions for every landlord you refer who
                subscribes to our platform. Start building your passive income
                today!
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-20 lg:py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl md:px-8"
          >
            <Card className="border border-border bg-card/95">
              <CardContent className="lg:p-10">
                <div className="text-center mb-10">
                  <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-serif text-3xl text-foreground mb-3"
                  >
                    Partner Registration
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-muted-foreground"
                  >
                    Start earning by referring landlords
                  </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      name="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">
                        {errors.full_name}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      name="phone_number"
                      placeholder="+255 XXX XXX XXX"
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                    {errors.phone_number && (
                      <p className="text-sm text-destructive">
                        {errors.phone_number}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll send your partner details and commission info
                      here
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                    {formData.password && (
                      <div className="space-y-1.5 pt-1">
                        <Progress
                          value={passwordStrength()}
                          className="h-1.5"
                        />
                        <p className="text-xs text-muted-foreground">
                          Password strength:{" "}
                          <span
                            className={
                              passwordStrength() < 50
                                ? "text-destructive"
                                : passwordStrength() < 75
                                  ? "text-amber-500"
                                  : "text-green-600"
                            }
                          >
                            {passwordStrength() < 50
                              ? "Weak"
                              : passwordStrength() < 75
                                ? "Good"
                                : "Strong"}
                          </span>
                        </p>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-foreground">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-sm text-destructive">
                        {errors.confirm_password}
                      </p>
                    )}
                    {formData.confirm_password &&
                      formData.password === formData.confirm_password && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">
                            Passwords match
                          </span>
                        </div>
                      )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating Partner Account...
                        </>
                      ) : (
                        <>Become a Partner</>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-center space-y-4"
                >
                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary/80 font-semibold hover:underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  </p>

                  {/* Regular Registration Link */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Just want to manage properties?
                    </p>
                    <Link
                      href="/register"
                      className="text-sm text-primary hover:text-primary/80 font-medium hover:underline underline-offset-4"
                    >
                      Register as a Landlord
                    </Link>
                  </div>
                </motion.div>

                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-6 flex justify-center"
                >
                  <Badge className="bg-purple-300 border border-purple-600 text-purple-600">
                    <Star className="w-3 h-3 mr-1.5" />
                    Trusted Partner Program
                  </Badge>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
