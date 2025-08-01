"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Home,
  Eye,
  Tag,
  Star,
  ArrowRight,
  ImageIcon
} from "lucide-react";
import { CloudflareCard } from "@/components/cloudflare/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PropertyCard({ property }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!property) return null;

  const propertyImage = property.images?.[0]?.image_url || property.prop_image;
  const propertyName = property.name || property.property_name;
  const propertyLocation = property.location || property.address;
  const propertyCategory = property.category || property.property_type || 'Property';

  const handleCardClick = () => {
    router.push(`/landlord/properties/${property.id}`);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    router.push(`/landlord/properties/${property.id}`);
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
      'apartment': 'bg-blue-50 text-blue-700 border-blue-200',
      'house': 'bg-green-50 text-green-700 border-green-200',
      'condo': 'bg-purple-50 text-purple-700 border-purple-200',
      'townhouse': 'bg-orange-50 text-orange-700 border-orange-200',
      'commercial': 'bg-gray-50 text-gray-700 border-gray-200',
      'default': 'bg-neutral-50 text-neutral-700 border-neutral-200'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  return (
    <div 
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md p-0 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-br from-neutral-100 to-neutral-200">
        {propertyImage && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-neutral-400" />
              </div>
            )}
            <img
              src={propertyImage}
              alt={propertyName}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Home className="w-16 h-16 text-white/80 mb-2" />
              <p className="text-white/60 text-sm font-medium">No Image</p>
            </div>
          </div>
        )}
        
        {/* Property Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getCategoryColor(propertyCategory)} font-medium text-xs px-2 py-1 rounded-md shadow-sm border`}>
            <Tag className="w-3 h-3 mr-1" />
            {propertyCategory}
          </Badge>
        </div>

        {/* Featured Badge */}
        {property.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm border">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center">
          <Button
            size="sm"
            className="bg-white text-neutral-900 hover:bg-gray-100 rounded-md px-4 py-2 font-medium shadow-sm"
            onClick={handleViewDetails}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* Property Content */}
      <div className="p-4">
        {/* Property Header */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-1">
            {propertyName}
          </h3>
          
          <div className="flex items-center text-neutral-600 mb-3">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-neutral-500" />
            <span className="text-sm line-clamp-1">{propertyLocation}</span>
          </div>

          {/* Property Description */}
          {property.description && (
            <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed mb-3">
              {property.description}
            </p>
          )}
        </div>

        {/* Property Features */}
        <div className="space-y-3 mb-4">
          {/* Status Row */}
          {property.status && (
            <div className="flex justify-end">
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${
                  property.status === 'active' 
                    ? 'border-green-200 text-green-700 bg-green-50' 
                    : 'border-neutral-200 text-neutral-600 bg-neutral-50'
                }`}
              >
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Badge>
            </div>
          )}

          {/* Additional Features */}
          {(property.furnished || property.parking || property.pet_friendly) && (
            <div className="flex flex-wrap gap-2">
              {property.furnished && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                  Furnished
                </Badge>
              )}
              {property.parking && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                  Parking
                </Badge>
              )}
              {property.pet_friendly && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                  Pet Friendly
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex items-center text-neutral-500">
            <Building2 className="w-4 h-4 mr-2" />
            <span className="text-sm">ID: #{property.id}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
            onClick={handleViewDetails}
          >
            Manage
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}