"use client";

import { useRouter } from "next/navigation";
import { Crown, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscriptionStore } from "@/stores/landlord/useSubscriptionStore";

export default function UpgradeModal({ isOpen, onClose, propertyName = null }) {
  const router = useRouter();
  const { extractTokenSubscriptionData } = useSubscriptionStore();
  
  const tokenData = extractTokenSubscriptionData();
  
  const handleUpgrade = () => {
    onClose();
    router.push("/landlord/subscriptions");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-orange-500" />
            Upgrade Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          <div className="text-center">
            {propertyName ? (
              <p className="text-gray-600">
                <span className="font-medium">"{propertyName}"</span> is not visible with your current plan.
              </p>
            ) : (
              <p className="text-gray-600">
                You've reached your property limit of <span className="font-medium">{tokenData?.propertyLimit || 1}</span> properties.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}