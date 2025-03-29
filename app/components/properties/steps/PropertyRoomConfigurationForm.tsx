'use client';

import React, { useState } from 'react';
import { PropertyFormData } from '../PropertyGeneratorWrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * Props for the PropertyRoomConfigurationForm component
 */
interface PropertyRoomConfigurationFormProps {
  formData: PropertyFormData;
  updateFormData: (values: Partial<PropertyFormData>) => void;
  onNext: (isValid: boolean) => void;
}

/**
 * Payment frequency options
 */
const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Bi-Annual' },
  { value: 'annual', label: 'Annual' }
];

/**
 * PropertyRoomConfigurationForm - Second step in the property generation process
 * 
 * Allows configuring:
 * - Number of rooms to generate
 * - Default rent amount
 * - Payment frequency
 */
export default function PropertyRoomConfigurationForm({
  formData,
  updateFormData,
  onNext
}: PropertyRoomConfigurationFormProps) {
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Total rooms validation
    if (!formData.total_rooms || formData.total_rooms < 1) {
      newErrors.total_rooms = 'At least one room is required';
    } else if (formData.total_rooms > 50) {
      newErrors.total_rooms = 'Maximum allowed rooms is 50';
    }
    
    // Default rent validation (optional)
    if (formData.default_rent && formData.default_rent < 0) {
      newErrors.default_rent = 'Rent amount cannot be negative';
    }
    
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
   * Calculate optimal grid dimensions for the room preview
   * @returns Object with columns, rows, and dimensions
   */
  const getGridDimensions = () => {
    const total = formData.total_rooms || 1;
    
    // Simple square or near-square grid
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    
    return { cols, rows, total };
  };

  // Grid dimensions for room preview
  const { cols, rows, total } = getGridDimensions();

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Number of Rooms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="total-rooms" className="text-sm font-medium">
              Number of Rooms <span className="text-red-500">*</span>
            </Label>
            <div className="text-sm font-medium">{formData.total_rooms}</div>
          </div>
          
          <div className="pt-1 pb-2">
            <Slider
              id="total-rooms"
              value={[formData.total_rooms]}
              min={1}
              max={20}
              step={1}
              className={errors.total_rooms ? 'border-red-500' : ''}
              onValueChange={(value) => updateFormData({ total_rooms: value[0] })}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
          
          {errors.total_rooms && (
            <p className="text-red-500 text-xs mt-1">{errors.total_rooms}</p>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            Select the total number of rooms you want to generate.
            For larger properties, you can use multiple floors.
          </p>
        </div>

        {/* Room Preview */}
        <div className="space-y-2 py-2">
          <Label className="text-sm font-medium">Room Layout Preview</Label>
          <div 
            className="border rounded-md p-4 h-48 flex items-center justify-center relative"
            style={{ 
              background: 'linear-gradient(rgba(249, 250, 251, 0.8), rgba(249, 250, 251, 0.8)), url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 10h10v10H10V10zm0-10h10v10H0V0h10v10z\' fill=\'%23f0f0f0\' fill-opacity=\'0.4\'/%3E%3C/svg%3E")'
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="grid gap-2 max-w-[90%] max-h-[90%]"
                style={{ 
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: total }).map((_, i) => (
                  <div 
                    key={`room-${i}`}
                    className="bg-primary/10 border border-primary/30 rounded flex items-center justify-center p-1"
                    style={{ aspectRatio: '1/1' }}
                  >
                    <span className="text-xs text-primary-foreground font-medium">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            This is an approximate preview. The actual layout will be generated based on the property boundary.
          </p>
        </div>

        {/* Rent Configuration */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-medium">Default Rent Configuration</h3>
          
          {/* Default Rent Amount */}
          <div className="space-y-2">
            <Label htmlFor="default-rent" className="text-sm font-medium">
              Default Rent Amount
            </Label>
            <Input
              id="default-rent"
              type="number"
              placeholder="e.g., 5000"
              value={formData.default_rent || ''}
              onChange={(e) => updateFormData({ 
                default_rent: e.target.value === '' ? undefined : Number(e.target.value) 
              })}
              className={errors.default_rent ? 'border-red-500' : ''}
            />
            {errors.default_rent && (
              <p className="text-red-500 text-xs mt-1">{errors.default_rent}</p>
            )}
            <p className="text-xs text-gray-500">
              This is the default rent for all units. You can change individual unit rents later.
            </p>
          </div>
          
          {/* Payment Frequency */}
          <div className="space-y-2">
            <Label htmlFor="payment-frequency" className="text-sm font-medium">
              Payment Frequency
            </Label>
            <Select
              value={formData.payment_frequency || 'monthly'}
              onValueChange={(value) => updateFormData({ payment_frequency: value })}
            >
              <SelectTrigger id="payment-frequency">
                <SelectValue placeholder="Select payment frequency" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_FREQUENCY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              This is the default payment frequency for all units.
            </p>
          </div>
        </div>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Room Configuration Tips</h3>
            <p className="text-xs text-blue-700">
              The system will automatically generate rooms based on the property boundary and the number of
              rooms you specify. Rooms will be arranged in a grid pattern, optimized to fit within the boundary.
              You can adjust individual room details after the property is created.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="pt-4 text-right">
          <Button type="submit">Continue to Property Boundary</Button>
        </div>
      </div>
    </form>
  );
} 