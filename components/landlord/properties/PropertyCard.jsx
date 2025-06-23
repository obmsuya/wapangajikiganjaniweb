// components/landlord/properties/PropertyCard.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  Home,
  Eye,
  TrendingUp
} from "lucide-react";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PropertyCard({ property }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  if (!property) return null;

  // Calculate property statistics
  const totalUnits = property.units?.length || 0;
  const occupiedUnits = property.units?.filter(unit => unit.current_tenant)?.length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  
  // Calculate monthly revenue from occupied units
  const monthlyRevenue = property.units?.reduce((total, unit) => {
    if (unit.current_tenant && unit.current_tenant.rent_amount) {
      return total + parseFloat(unit.current_tenant.rent_amount);
    }
    return total;
  }, 0) || 0;

  // Get property image
  const propertyImage = property.images?.[0]?.image_url || property.prop_image;

  const handleCardClick = () => {
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (rate >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <CloudflareCard 
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {propertyImage && !imageError ? (
          <img
            src={propertyImage}
            alt={property.name || property.property_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Home className="w-16 h-16 text-white opacity-70" />
          </div>
        )}
        
        {/* Occupancy Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${getOccupancyColor(occupancyRate)} font-semibold text-xs px-3 py-1 rounded-lg shadow-sm border`}>
            {occupancyRate}% Occupied
          </Badge>
        </div>

        {/* Property Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-slate-700 font-medium text-xs px-3 py-1 rounded-lg shadow-sm border border-white/50">
            {property.category || 'Property'}
          </Badge>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-6 shadow-lg"
            onClick={handleViewDetails}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* Property Content */}
      <div className="p-6">
        {/* Property Header */}
        <div className="mb-4">
          <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
            {property.name || property.property_name}
          </h3>
          
          <div className="flex items-center text-slate-600 mb-3">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{property.location || property.address}</span>
          </div>

          {/* Property Description */}
          {property.description && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {property.description}
            </p>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Units</span>
            </div>
            <p className="font-bold text-lg text-slate-900">{occupiedUnits}/{totalUnits}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Monthly</span>
            </div>
            <p className="font-bold text-lg text-slate-900">
              TSh {(monthlyRevenue / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Floors:</span>
            <span className="font-medium text-slate-700">
              {property.total_floors || 1} floor{(property.total_floors || 1) !== 1 ? 's' : ''}
            </span>
          </div>
          
          {property.total_area && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Area:</span>
              <span className="font-medium text-slate-700">{property.total_area} sq m</span>
            </div>
          )}
        </div>

        {/* Revenue Indicator */}
        {monthlyRevenue > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Annual Revenue</span>
              </div>
              <span className="text-sm font-bold text-green-700">
                TSh {((monthlyRevenue * 12) / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <Button 
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            onClick={handleViewDetails}
          >
            <Building2 className="w-5 h-5 mr-2" />
            Manage Property
          </Button>
        </div>
      </div>
    </CloudflareCard>
  );
}