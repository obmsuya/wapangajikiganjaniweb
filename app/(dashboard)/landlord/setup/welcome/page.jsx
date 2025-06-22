// app/(dashboard)/landlord/setup/welcome/page.jsx
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Building2, Users, CreditCard, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Property Management",
    description: "Easily manage multiple properties from one dashboard",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Users,
    title: "Tenant Tracking",
    description: "Keep track of all your tenants and their payment status",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    description: "Automated rent collection and payment reminders",
    color: "bg-purple-100 text-purple-600"
  }
];

const steps = [
  "Add your property details",
  "Design your property layout", 
  "Configure individual units",
  "Set up tenant information",
  "Start collecting rent!"
];

export default function WelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/landlord/setup");
  };

  const handleSkipSetup = () => {
    router.push("/landlord/properties");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Wapangaji Kiganjani!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You're just a few steps away from efficiently managing your properties, 
            tracking tenants, and automating rent collection.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Setup Process */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Quick Setup Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={handleSkipSetup}
            variant="outline"
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Skip for Now
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center items-center gap-8 mt-16 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Easy Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>24/7 Support</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}