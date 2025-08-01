// app/(auth)/register/partner/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { 
  Eye, EyeOff, Moon, Sun, Handshake, DollarSign, Users, 
  CheckCircle2, RefreshCw, ArrowLeft, TrendingUp, Star
} from "lucide-react";
import { useTheme } from "next-themes";
import customToast from "@/components/ui/custom-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AuthService from "@/services/auth";

const partnerSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  phone_number: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[1-9]\d{8,14}$/, "Please enter a valid phone number"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
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
    confirm_password: ""
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
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
      const { confirm_password, ...registrationData } = formData;
      const partnerData = { 
        ...registrationData, 
        user_type: 'partner'
      };
      
      const user = await AuthService.register(partnerData);
      
      customToast.success("Welcome to Our Partner Program!", {
        description: `Hello ${user.full_name}, your partner account is ready!`,
      });
      
      setTimeout(() => {
        router.push("/partner");
      }, 500);
    } catch (error) {
      customToast.error("Partner Registration Failed", {
        description: error.response?.data?.error || "Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const partnerBenefits = [
    { icon: DollarSign, title: "Earn Commissions", desc: "Get paid for every successful referral" },
    { icon: Users, title: "No Limits", desc: "Refer unlimited landlords and grow your income" },
    { icon: TrendingUp, title: "Track Performance", desc: "Monitor your referrals and earnings in real-time" }
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme Toggle */}
      <motion.button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-card border border-card-border shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700" />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Back to Regular Registration */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link 
          href="/register"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-card-border rounded-lg shadow-md hover:shadow-lg transition-all text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>
      </motion.div>

      {/* Background Design */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Floating Elements */}
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-orange-200/20 rounded-full"
            animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-40 right-16 w-16 h-16 bg-purple-200/20 rounded-full"
            animate={{ y: [0, 20, 0], rotate: [0, -180, -360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Partner Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <Handshake className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Become Our Partner
              </h2>
              <p className="text-muted-foreground text-lg">
                Join our partner program and earn commissions by referring landlords to our platform.
              </p>
            </div>

            <div className="space-y-8">
              {partnerBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Commission Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-12 p-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl border border-orange-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold text-foreground">Partner Rewards</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn competitive commissions for every landlord you refer who subscribes to our platform. 
                Start building your passive income today!
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl font-bold text-foreground mb-2"
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Input
                      label="Full Name"
                      name="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      error={errors.full_name}
                      className="h-12 bg-background/50"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
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
                  >
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      className="h-12 bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send your partner details and commission info here
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="relative"
                  >
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      className="h-12 bg-background/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
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
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative"
                  >
                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      placeholder="Confirm your password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      error={errors.confirm_password}
                      className="h-12 bg-background/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {formData.confirm_password &&
                      formData.password === formData.confirm_password && (
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">
                            Passwords match
                          </span>
                        </div>
                      )}
                  </motion.div>

 
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-primary-700 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating Partner Account...
                        </>
                      ) : (
                        <>
                          <Handshake className="w-4 h-4 mr-2" />
                          Become a Partner
                        </>
                      )}
                    </Button>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-center space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link 
                      href="/login" 
                      className="text-orange-600 hover:text-orange-700 font-semibold hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>

                  {/* Regular Registration Link */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Just want to manage properties?
                    </p>
                    <Link 
                      href="/register" 
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
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
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <Star className="w-3 h-3 mr-1" />
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