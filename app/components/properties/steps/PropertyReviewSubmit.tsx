'use client';

import React from 'react';
import { PropertyFormData } from '../PropertyGeneratorWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, MapPin, Home, Bed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Interface for PropertyReviewSubmit component props
 */
interface PropertyReviewSubmitProps {
  formData: PropertyFormData;
  updateFormData: (values: Partial<PropertyFormData>) => void;
  onNext: (isValid: boolean) => void;
  isSubmitting?: boolean;
  errors?: string[];
}

/**
 * Maps for property category display
 */
const CATEGORY_DISPLAY: Record<string, string> = {
  'bungalow': 'Bungalow',
  'villa': 'Villa',
  'rooms': 'Normal Rooms'
};

/**
 * Maps for payment frequency display
 */
const PAYMENT_FREQUENCY_DISPLAY: Record<string, string> = {
  'monthly': 'Monthly',
  'quarterly': 'Quarterly (every 3 months)',
  'biannual': 'Bi-Annual (every 6 months)',
  'annual': 'Annual (yearly)'
};

/**
 * PropertyReviewSubmit - Final step in the property generation process
 * 
 * Displays a summary of all the property information entered in previous steps
 * and allows the user to review before submitting.
 */
export default function PropertyReviewSubmit({
  formData,
  onNext,
  isSubmitting = false,
  errors = []
}: PropertyReviewSubmitProps) {
  /**
   * Verify all required data is present
   * @returns boolean indicating if all required data is available
   */
  const isDataComplete = (): boolean => {
    return Boolean(
      formData.name &&
      formData.category &&
      formData.address &&
      formData.total_rooms &&
      formData.boundary
      // Location is now optional
    );
  };

  /**
   * Format coordinates for display
   * @param coords - Array of coordinates
   * @returns Formatted coordinate string
   */
  const formatCoordinates = (coords: [number, number]): string => {
    return `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
  };

  /**
   * Get approximate property area in square meters
   * @returns Area in m² or 'Unknown'
   */
  const getApproximateArea = (): string => {
    if (formData.total_area) {
      return `${formData.total_area} m²`;
    }
    
    // Calculate approximate area if boundary exists
    if (formData.boundary?.coordinates?.[0]) {
      const coords = formData.boundary.coordinates[0];
      // Simple calculation for demonstration - this is not accurate for GPS coords
      // In real app, you would use a proper geospatial library
      let area = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
      }
      area = Math.abs(area / 2);
      
      // Scale to something reasonable (this is just for display)
      const scaledArea = area * 10000;
      return `~${scaledArea.toFixed(2)} m² (estimated)`;
    }
    
    return 'Unknown';
  };

  const renderErrors = () => {
    if (errors.length === 0) return null;
    
    return (
      <Card className="mt-6 border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 text-base">Submission Errors</CardTitle>
          <CardDescription className="text-red-600">
            Please correct the following issues:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Review Property Details</h3>
        <p className="text-sm text-gray-500">
          Please review the property details below before submitting. You can go back to any step 
          to make changes if needed.
        </p>
      </div>

      {/* Basic Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Basic Property Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Property Name</h4>
              <p className="text-base">{formData.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Property Category</h4>
              <p className="text-base">{CATEGORY_DISPLAY[formData.category] || formData.category}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-500">Address</h4>
              <p className="text-base">{formData.address}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Location Coordinates</h4>
              <p className="text-base font-mono text-sm">
                {formData.location?.coordinates 
                  ? formatCoordinates(formData.location.coordinates) 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Approximate Area</h4>
              <p className="text-base">{getApproximateArea()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Configuration Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Room Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total Rooms</h4>
              <p className="text-base">{formData.total_rooms}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Boundary Defined</h4>
              <p className="text-base flex items-center gap-1">
                {formData.boundary ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Yes
                  </>
                ) : (
                  'No'
                )}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Default Rent Amount</h4>
              <p className="text-base">
                {formData.default_rent 
                  ? formatCurrency(formData.default_rent, 'USD') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Payment Frequency</h4>
              <p className="text-base">
                {formData.payment_frequency 
                  ? PAYMENT_FREQUENCY_DISPLAY[formData.payment_frequency] || formData.payment_frequency
                  : 'Monthly (default)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Property Boundary Preview
          </CardTitle>
          <CardDescription>
            This is a simplified preview of the property boundary you&apos;ve defined.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 border rounded-md bg-gray-50 flex items-center justify-center relative overflow-hidden">
            {formData.boundary?.coordinates?.[0] ? (
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 1 1" 
                preserveAspectRatio="none"
                className="absolute inset-0"
              >
                <polygon
                  points={formData.boundary.coordinates[0].map(coord => `${coord[0]},${coord[1]}`).join(' ')}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="0.01"
                />
              </svg>
            ) : (
              <div className="text-gray-400">No boundary defined</div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Your property will be divided into approximately {formData.total_rooms} rooms of similar size.
          </div>
        </CardContent>
      </Card>

      {/* Display errors if any */}
      {renderErrors()}
      
      <div className="flex justify-end mt-8">
        <Button 
          onClick={() => onNext(isDataComplete())}
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Property...' : 'Create Property'}
        </Button>
      </div>
    </div>
  );
} 