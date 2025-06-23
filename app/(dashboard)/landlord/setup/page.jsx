// app/(dashboard)/landlord/properties/setup/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PropertySetupForm from "@/components/landlord/properties/PropertySetupForm";
import customToast from "@/components/ui/custom-toast";

export default function PropertySetupPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = (result) => {
    customToast.success("Property Created Successfully!", {
      description: "Your property has been set up and is ready for tenant management.",
    });
    
    // Redirect to properties list after a short delay
    setTimeout(() => {
      router.push("/landlord/properties");
    }, 2000);
  };

  const handleCancel = () => {
    const hasUnsavedChanges = true; // You can implement this logic
    
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave? Your progress will be lost."
      );
      if (!confirmLeave) return;
    }
    
    setIsExiting(true);
    setTimeout(() => {
      router.push("/landlord/properties");
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Property Setup
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and configure your new property
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PropertySetupForm 
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}