// app/(auth)/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import customToast from "@/components/ui/custom-toast";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import AuthService from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    password: ""
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const user = await AuthService.login(formData);
      
      // Show success toast
      customToast.success("Login successful!", {
        description: `Welcome back, ${user.full_name}`,
      });
      
      // Redirect based on user role
      setTimeout(() => {
        if (user.is_staff || user.is_superuser) {
          router.push("/admin/dashboard");
        } else {
          router.push("/landlord/dashboard");
        }
      }, 500);
    } catch (error) {
      console.error("Login failed:", error);
      
      // Show error toast
      customToast.error("Login failed", {
        description: error.response?.data?.error || "Invalid credentials. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="card space-y-6 overflow-hidden"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-center space-y-2"
            variants={itemVariants}
          >
            <h1 className="text-2xl font-bold">Wapangaji Kiganjani</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants}>
              <Input
                label="Phone Number"
                name="phone_number"
                placeholder="Enter your phone number"
                value={formData.phone_number}
                onChange={handleChange}
                error={errors.phone_number}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />
            </motion.div>
            
            <motion.div 
              className="flex justify-end"
              variants={itemVariants}
            >
              <Link href="/forgot-password" className="text-sm text-primary-500 hover:underline">
                Forgot password?
              </Link>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                type="submit" 
                className="w-full"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </motion.div>
          </form>
          
          <motion.div 
            className="text-center text-sm"
            variants={itemVariants}
          >
            Don't have an account?{" "}
            <Link href="/register" className="text-primary-500 hover:underline">
              Sign up
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}