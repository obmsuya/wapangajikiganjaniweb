// components/landlord/properties/PropertyCard.jsx
"use client";

import { MapPin, Home, Users, DollarSign, TrendingUp } from "lucide-react";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";

export default function PropertyCard({ property, onClick }) {
  const stats = property.stats || {};
  const occupancyRate = stats.occupancyRate || 0;
  const monthlyRevenue = stats.monthlyRevenue || 0;

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return "bg-green-100 text-green-800";
    if (rate >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <CloudflareCard 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        {property.prop_image ? (
          <img
            src={property.prop_image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Home className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Occupancy Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={getOccupancyColor(occupancyRate)}>
            {occupancyRate}% Occupied
          </Badge>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {property.name}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{property.location}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm font-medium">{stats.occupiedUnits || 0}/{stats.totalUnits || 0}</p>
              <p className="text-xs text-gray-500">Units</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm font-medium">TSh {monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Monthly</p>
            </div>
          </div>
        </div>

        {/* Property Type & Floors */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{property.category}</span>
          <span className="text-gray-500">{property.total_floors} floor{property.total_floors !== 1 ? 's' : ''}</span>
        </div>

        {/* Revenue Trend Indicator */}
        {occupancyRate > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Revenue potential</span>
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">
                  TSh {(monthlyRevenue * 12).toLocaleString()}/yr
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </CloudflareCard>
  );
}