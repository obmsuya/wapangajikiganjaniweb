"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Home,
  Eye,
  Tag,
  Star,
  ArrowRight,
  ImageIcon,
  Crown,
  Lock,
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import UpgradeModal from "@/components/landlord/subscription/UpgradeModal";

export default function PropertyCard({ property, subscriptionContext, isVisible = true }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Calculate accurate occupancy from property floor data
  const occupancyData = useMemo(() => {
    if (!property) return { totalUnits: 0, occupiedUnits: 0, occupancyRate: 0 };

    let totalUnits = 0;
    let occupiedUnits = 0;
    let totalRent = 0;
    let actualRent = 0;

    // Check if property has floor data (detailed view)
    if (property.property_floor && Array.isArray(property.property_floor)) {
      property.property_floor.forEach(floor => {
        if (floor.units_floor && Array.isArray(floor.units_floor)) {
          floor.units_floor.forEach(unit => {
            totalUnits++;
            const rentAmount = parseFloat(unit.rent_amount) || 0;
            totalRent += rentAmount;
            
            // Check for actual occupancy using current_tenant field
            if (unit.current_tenant || unit.status === 'occupied') {
              occupiedUnits++;
              actualRent += rentAmount;
            }
          });
        }
      });
    } else {
      totalUnits = property.total_units || 0;
      
      if (property.stats) {
        occupiedUnits = property.stats.occupiedUnits || property.occupied_units || 0;
        totalRent = property.stats.totalRent || property.total_monthly_rent || 0;
        actualRent = property.stats.actualRent || 0;
      } else {
        occupiedUnits = property.occupied_units || 0;
        totalRent = property.total_monthly_rent || 0;
        actualRent = totalRent; // Assume all occupied units are paying (fallback)
      }
    }

    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      occupancyRate,
      totalRent,
      actualRent
    };
  }, [property]);

  if (!property) return null;

  const propertyImage = property.images?.[0]?.image_url || property.prop_image;
  const propertyName = property.name || property.property_name;
  const propertyLocation = property.location || property.address;
  const propertyCategory = property.category || property.property_type || 'Property';

  const handleCardClick = () => {
    if (!isVisible) {
      setShowUpgradeModal(true);
      return;
    }
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (!isVisible) {
      setShowUpgradeModal(true);
      return;
    }
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
    setShowUpgradeModal(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'multi-floor': 'bg-blue-50 text-blue-700 border-blue-200',
      'single floor': 'bg-green-50 text-green-700 border-green-200',
      'apartment': 'bg-purple-50 text-purple-700 border-purple-200',
      'house': 'bg-orange-50 text-orange-700 border-orange-200',
      'commercial': 'bg-gray-50 text-gray-700 border-gray-200',
      'default': 'bg-neutral-50 text-neutral-700 border-neutral-200'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Card 
        className={`cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
          !isVisible ? 'opacity-75 hover:opacity-90' : 'hover:shadow-lg'
        }`}
        onClick={handleCardClick}
      >
        {/* Property Image */}
        <div className="relative h-48 bg-gradient-to-br from-neutral-100 to-neutral-200">
          {/* Invisible Property Overlay */}
          {!isVisible && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/80 to-red-500/80 flex items-center justify-center z-20">
              <div className="text-center text-white p-4">
                <Crown className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold text-lg">Upgrade Required</p>
                <p className="text-sm opacity-90">Click to upgrade your plan</p>
              </div>
            </div>
          )}

          {/* Property Image */}
          {propertyImage && !imageError ? (
            <img
              src={propertyImage}
              alt={propertyName}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-neutral-400" />
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={getCategoryColor(propertyCategory)}>
              {propertyCategory}
            </Badge>
            
            {subscriptionContext?.isFreePlan && (
              <Badge className={isVisible ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                {isVisible ? 'Active' : 'Invisible'}
              </Badge>
            )}
          </div>

          {/* Occupancy Badge - Only show for visible properties with units */}
          {isVisible && occupancyData.totalUnits > 0 && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-gray-700 border-0">
                {occupancyData.occupancyRate}% Occupied
              </Badge>
            </div>
          )}
        </div>

        {/* Property Content */}
        <CardContent className="p-4">
          {/* Property Name & Location */}
          <div className="mb-3">
            <h3 className={`text-lg font-semibold truncate mb-1 ${!isVisible ? 'text-gray-600' : 'text-gray-900'}`}>
              {propertyName}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{propertyLocation}</span>
            </div>
          </div>

          {/* Property Stats - Only for visible properties */}
          {isVisible ? (
            <div className="space-y-3 mb-4">
              {/* Units Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{occupancyData.totalUnits}</p>
                    <p className="text-gray-500">Total Units</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <p className={`font-medium ${getOccupancyColor(occupancyData.occupancyRate)}`}>
                      {occupancyData.occupiedUnits}/{occupancyData.totalUnits}
                    </p>
                    <p className="text-gray-500">Occupied</p>
                  </div>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              {occupancyData.totalUnits > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Occupancy</span>
                    <span>{occupancyData.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        occupancyData.occupancyRate >= 90 ? 'bg-green-500' :
                        occupancyData.occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${occupancyData.occupancyRate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Monthly Revenue */}
              {occupancyData.actualRent > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Monthly Revenue</span>
                    <span className="font-semibold text-green-800">
                      {formatCurrency(occupancyData.actualRent)}
                    </span>
                  </div>
                  {occupancyData.actualRent < occupancyData.totalRent && (
                    <div className="text-xs text-green-600 mt-1">
                      Potential: {formatCurrency(occupancyData.totalRent)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700">
                <Lock className="h-4 w-4" />
                <div>
                  <span className="text-sm font-medium block">Property requires plan upgrade</span>
                  {occupancyData.totalUnits > 0 && (
                    <span className="text-xs opacity-75">
                      {occupancyData.totalUnits} units • {occupancyData.occupiedUnits} occupied
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isVisible ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleViewDetails}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  className="px-3"
                  onClick={handleViewDetails}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={handleUpgradeClick}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade to Access
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        propertyName={propertyName}
        subscriptionData={subscriptionContext}
      />
    </>
  );
}