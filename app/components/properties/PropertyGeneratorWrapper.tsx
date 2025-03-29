'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import PropertyBasicInfoForm from './steps/PropertyBasicInfoForm';
import PropertyRoomConfigurationForm from './steps/PropertyRoomConfigurationForm';
import PropertyBoundaryForm from './steps/PropertyBoundaryForm';
import PropertyReviewSubmit from './steps/PropertyReviewSubmit';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminPropertyService, { 
  PropertyCategory, 
  RoomBasedPropertyRequest
} from '../../../services/property';
import { AxiosError } from 'axios';

/**
 * Interface for GeoJSON Point
 */
interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

/**
 * Interface for GeoJSON Polygon
 */
interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

/**
 * Interface for the property form data
 */
export interface PropertyFormData {
  name: string;
  category: PropertyCategory;
  address: string;
  location?: GeoPoint;
  total_rooms: number;
  default_rent?: number;
  payment_frequency?: string;
  boundary?: GeoPolygon;
  total_area?: number;
  has_corridor?: boolean;
}

/**
 * Initial form data state
 */
const initialFormData: PropertyFormData = {
  name: '',
  category: 'bungalow',
  address: '',
  total_rooms: 4,
  payment_frequency: 'monthly',
  location: undefined,
  boundary: undefined,
  total_area: undefined,
  has_corridor: undefined,
  default_rent: undefined
};

/**
 * PropertyGeneratorWrapper component
 * 
 * This component manages the multi-step property generation process
 */
export default function PropertyGeneratorWrapper() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionErrors] = useState<string[]>([]);
  
  /**
   * Steps in the property generation process
   */
  const steps = [
    { id: 'basics', title: 'Basic Info' },
    { id: 'rooms', title: 'Room Configuration' },
    { id: 'boundary', title: 'Property Boundary' },
    { id: 'review', title: 'Review & Submit' }
  ];

  /**
   * Update form data with new values
   * @param values - Partial form data to update
   */
  const updateFormData = (values: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...values }));
  };

  /**
   * Handle next step action
   * @param isValid - Whether the current step is valid
   */
  const handleNext = (isValid: boolean) => {
    if (!isValid) {
      toast.error('Incomplete Information', {
        description: 'Please complete all required fields before proceeding.'
      });
      return;
    }

    // If on last step, submit form
    if (currentStep === steps.length - 1) {
      handleSubmit();
      return;
    }

    // Otherwise go to next step
    setCurrentStep(prev => prev + 1);
  };

  /**
   * Handle back step action
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare the property data
      const propertyData: RoomBasedPropertyRequest = {
        name: formData.name,
        category: formData.category,
        address: formData.address,
        total_rooms: parseInt(String(formData.total_rooms)),
        total_area: formData.total_area && !isNaN(parseFloat(String(formData.total_area))) 
          ? parseFloat(String(formData.total_area)) 
          : undefined,
      };
      
      // Only add location if it has valid coordinates
      if (formData.location?.coordinates && 
          Array.isArray(formData.location.coordinates) && 
          formData.location.coordinates.length === 2 &&
          (formData.location.coordinates[0] !== 0 || formData.location.coordinates[1] !== 0)) {
        // Round coordinates to reduce data size
        propertyData.location = {
          type: 'Point',
          coordinates: [
            parseFloat(formData.location.coordinates[0].toFixed(5)),
            parseFloat(formData.location.coordinates[1].toFixed(5))
          ]
        };
      }
      
      // Add boundary with simplified coordinates
      if (formData.boundary && formData.boundary.coordinates && formData.boundary.coordinates.length > 0) {
        const simplifiedCoordinates = formData.boundary.coordinates.map(ring => {
          // If boundary has too many points, simplify by taking every other point
          if (ring.length > 20) {
            return ring.filter((_, index) => index % 2 === 0).map(coord => [
              parseFloat(coord[0].toFixed(5)),
              parseFloat(coord[1].toFixed(5))
            ]);
          }
          // Otherwise just round the coordinates
          return ring.map(coord => [
            parseFloat(coord[0].toFixed(5)),
            parseFloat(coord[1].toFixed(5))
          ]);
        });
        
        propertyData.boundary = {
          type: 'Polygon',
          coordinates: simplifiedCoordinates
        };
      }
      
      // Log the API base URL from the environment
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
      
      const response = await AdminPropertyService.createRoomBasedProperty(propertyData);
      
      toast.success('Property Created Successfully', {
        description: `Your property "${formData.name}" has been created.`
      });
      
      // Navigate to the new property's details page
      if (response.property_id) {
        router.push(`/properties/${response.property_id}`);
      } else {
        router.push('/properties');
      }
      
    } catch (error) {
      console.error('Error creating property:', error);
      
      // Handle API error responses
      const axiosError = error as AxiosError<{
        errors?: Record<string, string[]>, 
        error?: string
      }>;
      
      let errorMessage = 'Failed to create property. Please try again.';
      
      if (axiosError.response) {
        // Add status code to error message
        const statusCode = axiosError.response.status;
        errorMessage = `API Error (${statusCode}): `;
        
        if (axiosError.response.data?.errors) {
          // Extract error messages from the API response
          const errorMessages = Object.values(axiosError.response.data.errors)
            .flat()
            .join(', ');
          errorMessage += errorMessages;
        } else if (axiosError.response.data?.error) {
          // Simple error message from Django
          errorMessage += axiosError.response.data.error;
        } else {
          errorMessage += axiosError.message || 'Unknown error';
        }
      }
      
      toast.error('Property Creation Failed', {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render the current step component
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PropertyBasicInfoForm 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNext} 
          />
        );
      case 1:
        return (
          <PropertyRoomConfigurationForm 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNext} 
          />
        );
      case 2:
        return (
          <PropertyBoundaryForm 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNext} 
          />
        );
      case 3:
        return (
          <PropertyReviewSubmit 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNext}
            isSubmitting={isSubmitting}
            errors={submissionErrors}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-bold tracking-tight">Create New Property</h2>
        </div>
        
        {/* Custom Steps Component */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div 
                key={step.id}
                className="flex flex-col items-center relative flex-1"
              >
                {/* Step Circle */}
                <button
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isActive && "bg-primary/20 border-primary text-primary",
                    isCompleted && "bg-primary border-primary text-white",
                    !isActive && !isCompleted && "border-gray-300 bg-white text-gray-400",
                    index > currentStep && "cursor-not-allowed",
                    index < currentStep && "cursor-pointer"
                  )}
                  disabled={index > currentStep || isSubmitting}
                  onClick={() => {
                    if (index < currentStep) setCurrentStep(index);
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                
                {/* Step Title */}
                <div className="mt-2 text-sm font-medium">
                  {step.title}
                </div>
                
                {/* Step Description */}
                <div className="text-xs text-gray-500 mt-0.5">
                  Step {index + 1} of {steps.length}
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute top-5 w-full h-0.5 left-1/2",
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card className="p-6">
        {renderStepContent()}
      </Card>
    </div>
  );
} 