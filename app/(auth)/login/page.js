// app/(auth)/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, Moon, Sun, Building2, Shield, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import customToast from "@/components/ui/custom-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthService from "@/services/auth";

const loginSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required")
});

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    password: ""
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const user = await AuthService.login(formData);
      
      customToast.success("Welcome back!", {
        description: `Hello ${user.full_name}, redirecting to your dashboard...`,
      });
      
      setTimeout(() => {
        // Route based on user_type instead of is_staff
        switch (user.user_type) {
          case 'system_admin':
            router.push("/admin/dashboard");
            break;
          case 'landlord':
            router.push("/landlord/properties");
            break;
          case 'manager':
            router.push("/manager/dashboard");
            break;
          case 'tenant':
            router.push("/tenant/");
            break;
          case 'partner':
            router.push("/partner");
            break;
          default:
            // Fallback based on is_staff for legacy users
            if (user.is_staff || user.is_superuser) {
              router.push("/admin/dashboard");
            } else {
              router.push("/landlord/dashboard");
            }
        }
      }, 500);
    } catch (error) {
      customToast.error("Login failed", {
        description: error.response?.data?.error || "Invalid credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Building2, title: "Property Management", desc: "Effortlessly manage multiple properties" },
    { icon: Shield, title: "Secure Platform", desc: "Bank-level security for your data" },
    { icon: Zap, title: "Real-time Updates", desc: "Instant notifications and updates" }
  ];

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
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Sun className="w-5 h-5 text-yellow-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Moon className="w-5 h-5 text-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Background with proper image handling */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-primary-500/10 to-primary-700/20" />
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
          <div className="w-full flex flex-col justify-center px-12 xl:px-16">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-lg"
            >
              {/* Logo & Brand */}
              <div className="mb-12">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600  rounded-xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 ">
                    Wapangaji Kiganjani
                  </h1>
                </motion.div>
                
                <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Welcome Back to Your
                  <span className="block text-primary-600">Property Empire</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Continue managing your properties with precision. Track payments, 
                  communicate with tenants, and grow your real estate portfolio 
                  with confidence.
                </p>
              </div>

              {/* Features Grid */}
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <motion.div 
                className="mt-12 flex gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div>
                  <div className="text-2xl font-bold text-primary-600">10K+</div>
                  <div className="text-sm text-muted-foreground">Properties Managed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">50K+</div>
                  <div className="text-sm text-muted-foreground">Happy Landlords</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center justify-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Sign In</h3>
                  <p className="text-muted-foreground">Access your property dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-between items-center"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-input" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </motion.div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary-700 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-8 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    New to Wapangaji Kiganjani?{" "}
                    <Link 
                      href="/register" 
                      className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
                    >
                      Create your account
                    </Link>
                  </p>
                </motion.div>

                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mt-6 flex justify-center"
                >
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure & Trusted
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