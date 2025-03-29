'use client';

import React, { useState } from 'react';
import { PropertyFormData } from '../PropertyGeneratorWrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyCategory } from '../../../../services/property';

/**
 * Props for the PropertyBasicDetailsForm component
 */
interface PropertyBasicDetailsFormProps {
  formData: PropertyFormData;
  updateFormData: (values: Partial<PropertyFormData>) => void;
  onNext: (isValid: boolean) => void;
}

/**
 * PropertyBasicDetailsForm - First step in the property generation process
 * 
 * Collects basic property information such as:
 * - Property name
 * - Property category
 * - Address
 * - Location (coordinates)
 */
export default function PropertyBasicDetailsForm({
  formData,
  updateFormData,
  onNext
}: PropertyBasicDetailsFormProps) {
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Property category is required';
    }
    
    // Location validation is no longer needed as it's optional
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * Validates the form and proceeds to the next step if valid
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    onNext(isValid);
  };

  /**
   * Handle location coordinate change
   * @param index - Index of the coordinate to update (0 for longitude, 1 for latitude)
   * @param value - New value
   */
  const handleLocationChange = (index: number, value: string) => {
    // Initialize coordinates array if location is undefined
    const newCoordinates = formData.location?.coordinates ? 
      [...formData.location.coordinates] : 
      [0, 0];
    
    newCoordinates[index] = parseFloat(value) || 0;
    
    updateFormData({
      location: {
        type: 'Point',
        coordinates: newCoordinates as [number, number]
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Property Name */}
        <div className="space-y-2">
          <Label htmlFor="property-name" className="text-sm font-medium">
            Property Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="property-name"
            placeholder="Enter property name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Property Category */}
        <div className="space-y-2">
          <Label htmlFor="property-category" className="text-sm font-medium">
            Property Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData({ category: value as PropertyCategory })}
          >
            <SelectTrigger id="property-category" className={errors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select property category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bungalow">Bungalow</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="rooms">Normal Rooms</SelectItem>
              <SelectItem value="apartment">Apartment Building</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>

        {/* Property Address */}
        <div className="space-y-2">
          <Label htmlFor="property-address" className="text-sm font-medium">
            Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="property-address"
            placeholder="Enter property address"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            className={errors.address ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* Location Coordinates */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Location Coordinates <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="longitude" className="text-xs text-gray-500">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={formData.location?.coordinates[0] || ''}
                onChange={(e) => handleLocationChange(0, e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="latitude" className="text-xs text-gray-500">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={formData.location?.coordinates[1] || ''}
                onChange={(e) => handleLocationChange(1, e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
            </div>
          </div>
          {errors.location && (
            <p className="text-red-500 text-xs mt-1">{errors.location}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Tip: You can find coordinates by right-clicking on Google Maps and selecting &quot;What&apos;s here?&quot;
          </p>
        </div>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Getting Started</h3>
            <p className="text-xs text-blue-700">
              Start by providing basic details about your property. This information helps identify 
              and organize your property in the system. The next steps will allow you to configure 
              rooms and define the property boundary.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="pt-4 text-right">
          <Button type="submit">Continue to Room Configuration</Button>
        </div>
      </div>
    </form>
  );
} 