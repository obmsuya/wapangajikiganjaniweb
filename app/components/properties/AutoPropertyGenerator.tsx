'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Upload, AlertCircle, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';

// Property type interface from Django model
interface PropertyType {
  id: number;
  name: string;
  description: string;
  status: string;
  status_display: string;
}

// Parent property interface
interface ParentProperty {
  id: number;
  name: string;
}

// Step 1: Basic Property Info
interface BasicInfoFormData {
  name: string;
  propertyType: string; // This is the ID of the propertyType
  address: string;
  image?: File | null;
  parent_property?: string | null; // ID of parent property for apartments with floors
  floor_number?: number | null; // Floor number for apartment properties
}

// Step 2: Room Configuration
interface RoomConfigFormData {
  numRooms: number;
  shape: 'rectangle' | 'l_shaped' | 'u_shaped' | 'square_with_space';
}

// Combined form data
interface FormData extends BasicInfoFormData, RoomConfigFormData {}

// Property layouts/shapes
const propertyShapes = [
  { 
    value: 'rectangle', 
    label: 'Rectangle', 
    description: 'A standard rectangular layout with rooms arranged in a grid' 
  },
  { 
    value: 'l_shaped', 
    label: 'L-Shaped', 
    description: 'An L-shaped layout with rooms along two perpendicular sides' 
  },
  { 
    value: 'u_shaped', 
    label: 'U-Shaped', 
    description: 'A U-shaped layout with rooms arranged around three sides of a courtyard' 
  },
  { 
    value: 'square_with_space', 
    label: 'Square with Central Space', 
    description: 'A square layout with rooms arranged around a central common area' 
  },
];

// Default form values
const defaultFormData: FormData = {
  name: '',
  propertyType: '',
  address: '',
  image: null,
  numRooms: 4,
  shape: 'rectangle',
  parent_property: null,
  floor_number: null
};

// Get auth token from context or localStorage as fallback
const getToken = (): string | null => {
  // For client-side only
  if (typeof window === 'undefined') return null;
  
  try {
    // First try to get from localStorage directly (backward compatibility)
    const token = localStorage.getItem('token');
    if (token) return token;
    
    // If not found in localStorage, try to get from cookie (middleware approach)
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Define a type for the property data from the API
interface PropertyData {
  id: number;
  name: string;
  type_name?: string;
  type?: number;
  status?: string;
}

export function AutoPropertyGenerator() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [parentProperties, setParentProperties] = useState<ParentProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [selectedPropertyTypeStatus, setSelectedPropertyTypeStatus] = useState<string | null>(null);

  // Fix the API base URL - add a trailing slash to prevent double slashes in requests
  const API_BASE_URL = 'http://localhost:8000/api/v1';
  
  // Fetch property types on component mount
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Use the correct API endpoint for property types
        const response = await fetch(`${API_BASE_URL}/properties/property-types/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched property types:', data);
        
        // Check if the response has a results array (paginated response)
        const propertyTypesData = data.results || data;
        
        if (Array.isArray(propertyTypesData) && propertyTypesData.length > 0) {
          setPropertyTypes(propertyTypesData);
        } else {
          console.warn('No property types found in the response');
          setPropertyTypes([]);
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
        toast.error('Failed to load property types', {
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPropertyTypes();
  }, [API_BASE_URL]);

  // Fetch parent properties when a property type with "apartment" status is selected
  useEffect(() => {
    const fetchParentProperties = async () => {
      if (!selectedPropertyTypeStatus || selectedPropertyTypeStatus !== 'apartment') {
        return;
      }

      try {
        setIsLoadingParents(true);
        const token = getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Fetch properties that can be parents (non-apartment properties)
        const response = await fetch(`${API_BASE_URL}/properties/properties/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if the response has a results array (paginated response)
        const propertiesData = data.results || data;
        
        if (Array.isArray(propertiesData) && propertiesData.length > 0) {
          // Filter out apartment properties, they can't be parents
          const potentialParents = propertiesData.filter(
            (property: PropertyData) => property.type_name && !property.type_name.toLowerCase().includes('apartment')
          );
          setParentProperties(potentialParents.map((p: PropertyData) => ({ id: p.id, name: p.name })));
        } else {
          console.warn('No parent properties found in the response');
          setParentProperties([]);
        }
      } catch (error) {
        console.error('Error fetching parent properties:', error);
        toast.error('Failed to load potential parent properties', {
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      } finally {
        setIsLoadingParents(false);
      }
    };
    
    fetchParentProperties();
  }, [selectedPropertyTypeStatus, API_BASE_URL]);
  
  // Validate current step before proceeding
  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Property name is required';
      }
      
      if (!formData.propertyType) {
        newErrors.propertyType = 'Property type is required';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Property address is required';
      }

      // Check if the selected property type has status "apartment"
      const selectedType = propertyTypes.find(type => type.id === Number(formData.propertyType));
      
      if (selectedType && selectedType.status === 'apartment') {
        // For apartments, parent_property and floor_number are required
        if (!formData.parent_property) {
          newErrors.parent_property = 'Parent property is required for apartments';
        }
        
        if (formData.floor_number === null || formData.floor_number === undefined) {
          newErrors.floor_number = 'Floor number is required for apartments';
        } else if (formData.floor_number < 1) {
          newErrors.floor_number = 'Floor number must be at least 1';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigate to next step
  const nextStep = () => {
    const isValid = validateStep();
    if (isValid) {
      setStep(step + 1);
    }
  };
  
  // Go back to previous step
  const prevStep = () => {
    setStep(step - 1);
  };
  
  // Handle form field changes
  const handleChange = (field: keyof FormData, value: string | number | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update selected property type status when property type changes
    if (field === 'propertyType' && value) {
      const selectedType = propertyTypes.find(type => type.id === Number(value));
      setSelectedPropertyTypeStatus(selectedType?.status || null);
      
      // If not an apartment, reset parent_property and floor_number
      if (selectedType?.status !== 'apartment') {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          parent_property: null,
          floor_number: null
        } as FormData)); // Type assertion to fix linter error
      }
    }
  };
  
  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange('image', e.target.files[0]);
    }
  };
  
  // Calculate grid dimensions based on number of rooms
  const getGridDimensions = () => {
    const numRooms = formData.numRooms;
    const cols = Math.ceil(Math.sqrt(numRooms));
    const rows = Math.ceil(numRooms / cols);
    return { cols, rows, total: numRooms };
  };
  
  // Submit the form data
  const handleSubmit = async () => {
    const isValid = validateStep();
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Find the selected property type to get its name
      const selectedType = propertyTypes.find(
        type => type.id === Number(formData.propertyType)
      );
      
      if (!selectedType) {
        throw new Error('Invalid property type selected');
      }
      
      // Create property data object based on property type
      const propertyData: {
        name: string;
        type: number;
        address: string;
        parent_property?: number;
        floor_number?: number;
      } = {
        name: formData.name,
        type: Number(formData.propertyType),
        address: formData.address
      };
      
      // Add parent_property and floor_number for apartment properties
      if (selectedType.status === 'apartment') {
        if (formData.parent_property) {
          propertyData.parent_property = Number(formData.parent_property);
        }
        
        if (formData.floor_number !== null && formData.floor_number !== undefined) {
          propertyData.floor_number = formData.floor_number;
        }
      }
      
      console.log('Creating property with data:', propertyData);
      
      const propertyResponse = await fetch(`${API_BASE_URL}/properties/properties/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });
      
      if (!propertyResponse.ok) {
        const errorData = await propertyResponse.json();
        throw new Error(errorData.detail || errorData.error || `Error ${propertyResponse.status}: ${propertyResponse.statusText}`);
      }
      
      const propertyResult = await propertyResponse.json();
      const propertyId = propertyResult.id;
      
      console.log('Property created successfully:', propertyResult);
      
      // Upload image if provided
      if (formData.image) {
        const formDataImg = new FormData();
        formDataImg.append('image', formData.image);
        
        const imageResponse = await fetch(`${API_BASE_URL}/properties/properties/${propertyId}/image/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataImg
        });
        
        if (!imageResponse.ok) {
          console.error('Failed to upload image:', await imageResponse.json());
          toast.warning('Property created but image upload failed');
        } else {
          console.log('Image uploaded successfully');
        }
      }
      
      // Now create blocks using automation if it's not an apartment floor
      // Apartments floors don't need block generation since they're children properties
      if (selectedType.status !== 'apartment' || !formData.parent_property) {
        const automationData = {
          property: propertyId,
          num_rooms: formData.numRooms,
          shape: formData.shape
        };
        
        console.log('Creating automation config with data:', automationData);
        
        // Create automation config
        const automationResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}/automation/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(automationData)
        });
        
        if (!automationResponse.ok) {
          const errorData = await automationResponse.json();
          toast.warning('Property created but block generation failed', {
            description: errorData.detail || errorData.error || `Error ${automationResponse.status}`
          });
        } else {
          console.log('Automation config created successfully:', await automationResponse.json());
          
          // Generate blocks using the automation config
          const generateResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}/generate-blocks/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ shape: formData.shape, num_rooms: formData.numRooms })
          });
          
          if (!generateResponse.ok) {
            const errorData = await generateResponse.json();
            toast.warning('Property created but block generation failed', {
              description: errorData.detail || errorData.error || `Error ${generateResponse.status}`
            });
          } else {
            console.log('Blocks generated successfully:', await generateResponse.json());
            toast.success('Property created successfully with automated blocks');
          }
        }
      } else {
        toast.success('Apartment floor created successfully');
      }
      
      // Navigate to the property detail page
      router.push(`/client/properties/${propertyId}`);
      
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render property details form
  const renderPropertyDetails = () => {
    // Check if the selected property type has apartment status
    const selectedType = propertyTypes.find(
      type => type.id === Number(formData.propertyType)
    );
    const isApartmentType = selectedType?.status === 'apartment';

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-bold text-foreground">
            Property Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter property name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={cn(errors.name ? 'border-destructive' : '', "font-medium")}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType" className="font-bold text-foreground">
            Building Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.propertyType}
            onValueChange={(value) => handleChange('propertyType', value)}
            disabled={isLoading || isSubmitting}
          >
            <SelectTrigger 
              id="propertyType"
              className={cn(errors.propertyType ? 'border-destructive' : '', "font-medium")}
            >
              <SelectValue placeholder="Select building type" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : propertyTypes.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground font-medium">
                  No property types available
                </div>
              ) : (
                propertyTypes.map((type) => (
                  <SelectItem 
                    key={type.id} 
                    value={String(type.id)} 
                    className="font-medium"
                  >
                    {type.name}
                    {type.description && (
                      <span className="text-xs text-muted-foreground block">
                        {type.description}
                      </span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.propertyType && <p className="text-xs text-destructive">{errors.propertyType}</p>}
          {(propertyTypes.length === 0 && !isLoading) && (
            <div className="mt-2">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No building types available</AlertTitle>
                <AlertDescription>
                  Property types need to be added in the system before creating properties.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Parent Property Selection - Only show for apartment type */}
        {isApartmentType && (
          <div className="space-y-2">
            <Label htmlFor="parentProperty" className="font-bold text-foreground">
              Parent Property <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.parent_property || ''}
              onValueChange={(value) => handleChange('parent_property', value)}
              disabled={isLoadingParents || isSubmitting}
            >
              <SelectTrigger 
                id="parentProperty"
                className={cn(errors.parent_property ? 'border-destructive' : '', "font-medium")}
              >
                <SelectValue placeholder="Select parent property" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingParents ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : parentProperties.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground font-medium">
                    No parent properties available
                  </div>
                ) : (
                  parentProperties.map((property) => (
                    <SelectItem 
                      key={property.id} 
                      value={String(property.id)} 
                      className="font-medium"
                    >
                      {property.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.parent_property && <p className="text-xs text-destructive">{errors.parent_property}</p>}
            {(parentProperties.length === 0 && !isLoadingParents && isApartmentType) && (
              <div className="mt-2">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No parent properties available</AlertTitle>
                  <AlertDescription>
                    You need to create a main property first before adding apartment floors.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Floor Number - Only show for apartment type */}
        {isApartmentType && (
          <div className="space-y-2">
            <Label htmlFor="floorNumber" className="font-bold text-foreground">
              Floor Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="floorNumber"
              type="number"
              min="1"
              placeholder="Enter floor number"
              value={formData.floor_number === null ? '' : formData.floor_number}
              onChange={(e) => handleChange('floor_number', e.target.value ? parseInt(e.target.value) : null)}
              className={cn(errors.floor_number ? 'border-destructive' : '', "font-medium")}
              disabled={isSubmitting}
            />
            {errors.floor_number && <p className="text-xs text-destructive">{errors.floor_number}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="address" className="font-bold text-foreground">
            Property Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Enter property address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={cn(errors.address ? 'border-destructive' : '', "font-medium")}
            disabled={isSubmitting}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="image" className="font-bold text-foreground">
            Property Image
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
            <Label
              htmlFor="image"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-accent transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formData.image ? 'Change Image' : 'Upload Image'}
              </span>
            </Label>
            {formData.image && (
              <span className="text-sm text-muted-foreground">
                {formData.image.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render room configuration form
  const renderRoomConfiguration = () => {
    const { cols, rows, total } = getGridDimensions();
    
    // Check if the selected property type has apartment status
    const selectedType = propertyTypes.find(
      type => type.id === Number(formData.propertyType)
    );
    const isApartmentType = selectedType?.status === 'apartment';
    
    return (
      <div className="space-y-6">
        {/* Selected building type information */}
        {formData.propertyType && (
          <div className="mb-6">
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Selected Building Type: {selectedType?.name}</AlertTitle>
              <AlertDescription>
                {selectedType?.description}
                {isApartmentType && formData.parent_property && (
                  <span className="block text-xs mt-1">
                    This is a floor in an apartment building. It will be created as a child property.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      
        {/* For apartment floors, show a different message */}
        {isApartmentType && formData.parent_property ? (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>Apartment Floor Configuration</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                This floor (Floor {formData.floor_number}) will be created as a child property of the selected parent property.
                You&apos;ll be able to add individual rooms/blocks to this floor after creation.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="numRooms" className="text-sm font-bold text-foreground">
                Number of Rooms <span className="text-destructive">*</span>
              </Label>
              <div className="text-sm font-bold text-foreground">{formData.numRooms}</div>
            </div>
            
            <div className="pt-1 pb-2">
              <Slider
                id="numRooms"
                value={[formData.numRooms]}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => handleChange('numRooms', value[0])}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
            
            {errors.numRooms && <p className="text-xs text-destructive">{errors.numRooms}</p>}
          </div>
        )}

        {!isApartmentType || !formData.parent_property ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shape" className="text-sm font-bold text-foreground">
                Property Layout Shape <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select the physical layout shape that best represents your property structure.
                This will determine how rooms are automatically arranged.
              </p>
            </div>
            
            <Tabs 
              defaultValue="rectangle" 
              value={formData.shape} 
              onValueChange={(value) => handleChange('shape', value as FormData['shape'])}
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
                {propertyShapes.map((shape) => (
                  <TabsTrigger key={shape.value} value={shape.value} className="font-medium">
                    {shape.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {propertyShapes.map((shape) => (
                <TabsContent key={shape.value} value={shape.value} className="mt-0">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-foreground mb-4 font-medium">{shape.description}</p>
                      <div className="aspect-video bg-muted border rounded-md flex items-center justify-center p-4">
                        <div className="relative w-4/5 h-4/5">
                          {shape.value === 'rectangle' && (
                            <div 
                              className="grid gap-2"
                              style={{ 
                                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
                              }}
                            >
                              {Array.from({ length: total }).map((_, i) => (
                                <div 
                                  key={`room-${i}`}
                                  className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center p-1"
                                  style={{ aspectRatio: '1/1' }}
                                >
                                  <span className="text-xs font-medium text-foreground">
                                    {i + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {shape.value === 'l_shaped' && (
                            <div className="w-full h-full relative">
                              <div className="absolute top-0 left-0 w-1/2 h-full">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: Math.min(Math.ceil(total / 2), total) }).map((_, i) => (
                                    <div 
                                      key={`room-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-1/2 w-1/2 h-1/2">
                                <div className="grid grid-cols-2 gap-2 h-full">
                                  {Array.from({ length: Math.max(0, total - Math.ceil(total / 2)) }).map((_, i) => (
                                    <div 
                                      key={`room-${i + Math.ceil(total / 2)}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + Math.ceil(total / 2) + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {shape.value === 'u_shaped' && (
                            <div className="w-full h-full relative">
                              <div className="absolute top-0 left-0 w-1/3 h-full">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: Math.ceil(total / 3) }).map((_, i) => (
                                    <div 
                                      key={`room-left-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="absolute top-0 right-0 w-1/3 h-full">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: Math.ceil(total / 3) }).map((_, i) => (
                                    <div 
                                      key={`room-right-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + Math.ceil(total / 3) + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: Math.max(0, total - 2 * Math.ceil(total / 3)) }).map((_, i) => (
                                    <div 
                                      key={`room-bottom-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 2 * Math.ceil(total / 3) + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {shape.value === 'square_with_space' && (
                            <div className="w-full h-full relative border border-muted-foreground/20 rounded">
                              {/* Top row */}
                              <div className="absolute top-0 left-0 right-0 h-1/4">
                                <div className="grid grid-cols-3 gap-2 h-full">
                                  {Array.from({ length: 3 }).map((_, i) => (
                                    <div 
                                      key={`room-top-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Bottom row */}
                              <div className="absolute bottom-0 left-0 right-0 h-1/4">
                                <div className="grid grid-cols-3 gap-2 h-full">
                                  {Array.from({ length: 3 }).map((_, i) => (
                                    <div 
                                      key={`room-bottom-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 4}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Left column (middle section) */}
                              <div className="absolute top-1/4 left-0 w-1/3 h-2/4">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: 2 }).map((_, i) => (
                                    <div 
                                      key={`room-left-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 7}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Right column (middle section) */}
                              <div className="absolute top-1/4 right-0 w-1/3 h-2/4">
                                <div className="grid grid-cols-1 gap-2 h-full">
                                  {Array.from({ length: 2 }).map((_, i) => (
                                    <div 
                                      key={`room-right-${i}`}
                                      className="bg-primary/20 border border-primary/30 rounded flex items-center justify-center"
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {i + 9}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Center space */}
                              <div className="absolute top-1/4 left-1/3 w-1/3 h-2/4 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground font-medium">Common Area</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : null}
        
        {/* How Auto Generation Works alert */}
        <div className="mt-6">
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>How Auto Generation Works</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                {isApartmentType && formData.parent_property 
                  ? "For apartment floors, you&apos;ll be able to manually add rooms/blocks after the floor is created."
                  : "The system will automatically generate the specified number of rooms in your selected layout shape. Each room will be created as a block/unit in your property, which can later be assigned to tenants."}
              </p>
              {!isApartmentType || !formData.parent_property ? (
                <p className="text-sm mt-2">
                  Room IDs will be automatically assigned based on the layout pattern.
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border border-border">
      <CardContent className="p-6">
        {/* Step Indicator */}
        <div className="flex mb-8">
          <div className="flex-1">
            <div className="relative flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                step >= 1 ? "bg-primary border-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
              )}>
                1
              </div>
              <div className={cn(
                "flex-1 h-1 mx-2",
                step >= 2 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                step >= 2 ? "bg-primary border-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
              )}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className={cn(
                "text-xs font-medium",
                step >= 1 ? "text-foreground" : "text-muted-foreground"
              )}>
                Property Details
              </span>
              <span className={cn(
                "text-xs font-medium",
                step >= 2 ? "text-foreground" : "text-muted-foreground"
              )}>
                Room Configuration
              </span>
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="mb-6">
          {step === 1 && renderPropertyDetails()}
          {step === 2 && renderRoomConfiguration()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={isSubmitting}
              className="font-medium"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 2 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={isSubmitting}
              className="font-medium"
            >
              Next
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Property'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 