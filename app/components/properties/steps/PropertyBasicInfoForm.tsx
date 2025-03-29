'use client';

import React, { useState } from 'react';
import { PropertyFormData } from '../PropertyGeneratorWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';
import { z } from 'zod';

/**
 * Validation schema for the basic info form
 */
const basicInfoSchema = z.object({
  name: z.string().min(3, 'Property name must be at least 3 characters'),
  category: z.string().min(1, 'Please select a property category'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

/**
 * Interface for PropertyBasicInfoForm component props
 */
interface PropertyBasicInfoFormProps {
  formData: PropertyFormData;
  updateFormData: (values: Partial<PropertyFormData>) => void;
  onNext: (isValid: boolean) => void;
}

/**
 * PropertyBasicInfoForm - First step in the property generation process
 * 
 * Allows users to enter basic property information such as name,
 * category, and address.
 */
export default function PropertyBasicInfoForm({
  formData,
  updateFormData,
  onNext
}: PropertyBasicInfoFormProps) {
  // Local form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<[number, number] | null>(
    formData.location?.coordinates ? 
    [formData.location.coordinates[0], formData.location.coordinates[1]] : 
    null
  );
  const [isLocating, setIsLocating] = useState(false);

  /**
   * Validate all form fields and update errors state
   * @returns Boolean indicating if the form is valid
   */
  const validateForm = () => {
    try {
      basicInfoSchema.parse({
        name: formData.name,
        category: formData.category,
        address: formData.address,
      });
      
      // Location is now optional, no need to validate it as required
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as string;
          newErrors[field] = error.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * Handle form submission
   * @param e - Form submit event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    onNext(isValid);
  };

  /**
   * Handle input changes
   * @param field - Form field name
   * @param value - New field value
   */
  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    updateFormData({ [field]: value });
    
    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Get current geolocation from browser
   */
  const getCurrentLocation = () => {
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Note: GeoJSON format requires [longitude, latitude]
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          
          setLocation(coords);
          updateFormData({
            location: {
              type: 'Point',
              coordinates: coords
            }
          });
          setIsLocating(false);
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.location;
            return newErrors;
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({ 
            ...prev, 
            location: 'Unable to get location: ' + error.message 
          }));
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setErrors(prev => ({ 
        ...prev, 
        location: 'Geolocation is not supported by your browser' 
      }));
      setIsLocating(false);
    }
  };

  /**
   * Set manual coordinates
   * @param lat - Latitude
   * @param lng - Longitude 
   */
  const handleManualCoordinates = (lat: number, lng: number) => {
    // GeoJSON format: [longitude, latitude]
    const coords: [number, number] = [lng, lat];
    setLocation(coords);
    updateFormData({
      location: {
        type: 'Point',
        coordinates: coords
      }
    });
    
    // Clear validation error
    if (errors.location) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Property Information</h3>
        <p className="text-sm text-gray-500">
          Enter the basic details of your property. This information will be used
          to identify and categorize your property.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Property Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Property Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter property name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Property Category */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Property Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger 
              id="category"
              className={errors.category ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Select property category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bungalow">Bungalow</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="rooms">Normal Rooms</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
        </div>
      </div>

      {/* Property Address */}
      <div className="space-y-2">
        <Label htmlFor="address">
          Property Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          placeholder="Enter property address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
      </div>

      {/* Location */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> 
            Property Location <span className="text-gray-500 text-sm font-normal">(Optional)</span>
          </CardTitle>
          <CardDescription>
            Set the geographical location of your property. This will be used for mapping and location-based features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Auto-detect location button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={getCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? 'Getting Location...' : 'Use My Current Location'}
            </Button>

            <div className="text-center my-2 text-sm text-gray-500">OR</div>

            {/* Manual coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., -6.776012"
                  value={formData.location?.coordinates ? formData.location.coordinates[1] : ''}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    const lng = formData.location?.coordinates ? formData.location.coordinates[0] : 0;
                    if (!isNaN(lat)) {
                      handleManualCoordinates(lat, lng);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., 39.218225"
                  value={formData.location?.coordinates ? formData.location.coordinates[0] : ''}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    const lat = formData.location?.coordinates ? formData.location.coordinates[1] : 0;
                    if (!isNaN(lng)) {
                      handleManualCoordinates(lat, lng);
                    }
                  }}
                />
              </div>
            </div>

            {errors.location && (
              <p className="text-xs text-red-500">{errors.location}</p>
            )}

            {location && (
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <p className="text-green-700 text-sm font-medium">
                  Location set successfully!
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Coordinates: {location[1]}, {location[0]} (Latitude, Longitude)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-700 flex items-center gap-2">
            <Home className="h-5 w-5" />
            Tips for Room-Based Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="list-disc pl-4 space-y-1">
            <li>Choose &quot;Bungalow&quot; for single-story homes with multiple rooms</li>
            <li>&quot;Normal Rooms&quot; is ideal for properties with individual rentable rooms</li>
            <li>For luxury properties with spacious layouts, select &quot;Villa&quot;</li>
            <li>In the next steps, you&apos;ll be able to configure rooms and layout options</li>
          </ul>
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button type="submit">
          Continue to Room Configuration
        </Button>
      </div>
    </form>
  );
} 