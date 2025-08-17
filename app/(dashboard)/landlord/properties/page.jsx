// app/(dashboard)/landlord/properties/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { CloudflarePageHeader } from "@/components/cloudflare/Breadcrumbs";
import { useDashboard } from "@/hooks/landlord/useDashboard";
import PropertyCard from "@/components/landlord/properties/PropertyCard";

export default function PropertiesPage() {
  const router = useRouter();
  const { 
    dashboardStats, 
    properties, 
    loading, 
    error, 
    searchProperties, 
  } = useDashboard();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchProperties(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchProperties]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNavigateToSetup = () => {
    // Navigate to property setup - adjust route as needed
    window.location.href = "/landlord/setup";
  };

  const stats = dashboardStats || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    totalMonthlyRent: 0,
    occupancyRate: 0
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <CloudflarePageHeader
          title="Properties"
          description="Manage your properties and tenants"
          actions={
            <Button onClick={handleNavigateToSetup}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          }
        />

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
              <CloudflareCard key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CloudflareCard>
            ))}
          </div>
        ) : error ? (
          <CloudflareCard className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Error loading properties</p>
            <p className="text-gray-500 text-sm mb-4">{error.message || "Something went wrong"}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CloudflareCard>
        ) : !properties || properties.length === 0 ? (
          <CloudflareCard className="text-center p-8">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? "No properties found" : "No properties yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `No properties match "${searchTerm}". Try a different search term.`
                : "Get started by adding your first property to begin managing tenants and collecting rent."
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleNavigateToSetup} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Property
              </Button>
            )}
          </CloudflareCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}

        {/* Search Results Count */}
        {searchTerm && properties && properties.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Found {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}