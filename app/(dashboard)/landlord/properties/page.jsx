"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2, AlertCircle, Crown, Users, Home, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { useDashboard } from "@/hooks/landlord/useDashboard";
import { useSubscriptionStore } from "@/stores/landlord/useSubscriptionStore";
import PropertyCard from "@/components/landlord/properties/PropertyCard";
import UpgradeModal from "@/components/landlord/subscription/UpgradeModal";

export default function PropertiesPage() {
  const router = useRouter();
  const { 
    dashboardStats, 
    properties, 
    subscriptionContext,
    loading, 
    error, 
    searchProperties, 
    fetchDashboardData
  } = useDashboard();
  
  const { 
    canAddProperties, 
    initializeTokenData, 
    extractTokenSubscriptionData,
    processingPayment: isSubscriptionSyncing
  } = useSubscriptionStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Initialize subscription data from token on mount
  useEffect(() => {
    initializeTokenData();
  }, [initializeTokenData]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchProperties(searchTerm);
      } else {
        fetchDashboardData();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchProperties, fetchDashboardData]);

  // Refresh on sync complete
  useEffect(() => {
    if (!isSubscriptionSyncing && !loading) {
      fetchDashboardData();
      initializeTokenData();  // Re-init store from updated token
    }
  }, [isSubscriptionSyncing, fetchDashboardData, initializeTokenData]);

  // Polling: When syncing (post-upgrade), poll every 5s until success or timeout (e.g., 1 min)
  useEffect(() => {
    if (isSubscriptionSyncing) {
      const interval = setInterval(() => {
        fetchDashboardData();
        initializeTokenData();
      }, 5000);  // Poll every 5 seconds
      setPollingInterval(interval);

      // Timeout after 60s
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isSubscriptionSyncing, fetchDashboardData, initializeTokenData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNavigateToSetup = () => {
    const canAdd = canAddProperties();
    
    if (!canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    
    router.push("/landlord/setup");
  };

  // Handle modal close: If upgraded, trigger sync/polling
  const handleModalClose = (wasUpgraded = false) => {
    setShowUpgradeModal(false);
    if (wasUpgraded) {
      // Assume modal sets isSubscriptionSyncing=true on payment start
      // Here, refetch immediately
      fetchDashboardData();
      initializeTokenData();
    }
  };

  const tokenData = extractTokenSubscriptionData();
  const subscriptionData = subscriptionContext || tokenData;

  const stats = dashboardStats || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    totalMonthlyRent: 0,
    occupancyRate: 0
  };

  // Hybrid Visibility Filter
  const [visibleProperties, invisibleProperties] = useMemo(() => {
    if (!subscriptionData || !properties.length) return [[], []];

    // Sort by created_at (assuming properties have created_at; add if missing in API)
    const sortedProperties = [...properties].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)  // Oldest first
    );

    const visible = [];
    const invisible = [];

    sortedProperties.forEach((property) => {
      // Trust server first
      let shouldShow = property.is_visible !== false;

      // Hybrid client check for free plan
      if (subscriptionData.isFreePlan) {
        const visibleCount = visible.length;
        shouldShow = shouldShow && visibleCount < subscriptionData.propertyLimit;
      }

      if (shouldShow) {
        visible.push(property);
      } else {
        invisible.push(property);
      }
    });

    return [visible, invisible];
  }, [properties, subscriptionData]);

  return (
    <div className="min-h-screen p-6 relative">
      {isSubscriptionSyncing && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-medium text-gray-800">Updating your subscription...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we activate your plan and refresh your properties.</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <CloudflarePageHeader
          title="Properties"
          description="Manage your properties and tenants"
          actions={
            <div className="flex items-center gap-3">
              {subscriptionData && (
                <Badge 
                  variant="outline" 
                  className={subscriptionData.isFreePlan ? 'border-orange-200 text-orange-700' : 'border-green-200 text-green-700'}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {subscriptionData.planName || 'Free Plan'}
                </Badge>
              )}
              
              <Button onClick={handleNavigateToSetup}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          }
        />

        {/* Subscription Status Card */}
        {subscriptionData && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      Properties: {subscriptionData.currentProperties || 0} / {subscriptionData.propertyLimit === -1 ? '∞' : subscriptionData.propertyLimit}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      Visible: {subscriptionData.visibleProperties || visibleProperties.length}
                    </span>
                  </div>
                  
                  {invisibleProperties.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">
                        Invisible: {invisibleProperties.length}
                      </span>
                    </div>
                  )}
                </div>
                
                {subscriptionData.isFreePlan && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/landlord/subscriptions')}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search properties by name or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Properties</h3>
            <p className="text-red-600 mb-6">{error.message || 'Failed to load properties. Please try again.'}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-8">
            {/* Visible Properties */}
            {visibleProperties.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Active Properties ({visibleProperties.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleProperties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property}
                      subscriptionContext={subscriptionData}
                      isVisible={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Invisible Properties */}
            {invisibleProperties.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Upgrade Required ({invisibleProperties.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invisibleProperties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property}
                      subscriptionContext={subscriptionData}
                      isVisible={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by adding your first property. You can manage tenants, 
              collect rent, and track everything in one place.
            </p>
            <Button onClick={handleNavigateToSetup} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}

        {/* Upgrade Modal - Pass callback for close */}
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={(wasUpgraded) => handleModalClose(wasUpgraded)}
          subscriptionData={subscriptionData}
        />
      </div>
    </div>
  );
}