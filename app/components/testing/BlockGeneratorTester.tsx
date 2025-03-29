'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Info, X, CheckCircle2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

// API Base URL (using exact URL as requested)
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Property types interface
interface PropertyType {
  id: number;
  name: string;
  status: string;
  status_display: string;
}

// User interface for landlord data
interface LandlordData {
  id: string;
  name: string;
}

// Parent property interface
interface ParentProperty {
  id: number;
  name: string;
}

// Form data interfaces
interface TestFormData {
  name: string;
  propertyType: string;
  address: string;
  numRooms: number;
  shape: 'rectangle' | 'l_shaped' | 'u_shaped' | 'square_with_space';
  landlordId: string;
  parent_property?: string | null;
  floor_number?: number | null;
}

// Block data interface
interface Block {
  id: number;
  block_id: string;
  property: number;
  is_occupied: boolean;
}

// Default form values
const defaultFormData: TestFormData = {
  name: 'Test Property',
  propertyType: '',
  address: 'Test Address, Dar es Salaam',
  numRooms: 4,
  shape: 'rectangle',
  landlordId: '1', // Default landlord ID
  parent_property: null,
  floor_number: null
};

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

export function BlockGeneratorTester() {
  // State
  const [formData, setFormData] = useState<TestFormData>(defaultFormData);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<number | null>(null);
  const [generatedBlocks, setGeneratedBlocks] = useState<Block[]>([]);
  const [requestLogs, setRequestLogs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('property');
  const [landlords, setLandlords] = useState<LandlordData[]>([]);
  const [parentProperties, setParentProperties] = useState<ParentProperty[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  // Grid display state
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(2);

  // Fetch property types and landlords on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch property types - correct path with Django URL structure
        const typesResponse = await fetch(`${API_BASE_URL}/properties/property-types/`, {
          headers: {
            // Add Accept header to explicitly request JSON
            'Accept': 'application/json'
          }
        });
        
        if (!typesResponse.ok) {
          logRequest(`Failed to fetch property types: ${typesResponse.status} ${typesResponse.statusText}`);
          // Log the raw response for debugging
          const rawResponse = await typesResponse.text();
          logRequest(`Raw response: ${rawResponse}`);
          throw new Error('Failed to fetch property types');
        }
        
        const typesData = await typesResponse.json();
        logRequest(`Property types raw data: ${JSON.stringify(typesData)}`);
        
        // Make sure we're processing an array of property types
        const typesArray = Array.isArray(typesData) ? typesData : 
                          (typesData.results && Array.isArray(typesData.results)) ? typesData.results : [];
        
        setPropertyTypes(typesArray);
        logRequest(`Loaded ${typesArray.length} property types successfully`);
        
        // Set default property type if available
        if (typesArray.length > 0) {
          setFormData(prev => ({
            ...prev,
            propertyType: typesArray[0].id.toString()
          }));
        }

        // Fetch landlords - correct path according to auth/admin/users/ pattern
        const landlordResponse = await fetch(`${API_BASE_URL}/auth/admin/users/?user_type=landlord`);
        if (!landlordResponse.ok) {
          // Fallback to try non-admin endpoint
          const fallbackResponse = await fetch(`${API_BASE_URL}/auth/me/`);
          if (!fallbackResponse.ok) {
            logRequest(`Failed to fetch landlords: ${landlordResponse.status} ${landlordResponse.statusText}`);
            throw new Error('Failed to fetch landlords');
          }
          
          // If we can only get current user, use them as the landlord
          const userData = await fallbackResponse.json();
          const formattedLandlords: LandlordData[] = [{
            id: userData.id.toString(),
            name: userData.full_name || 'Current User'
          }];
          
          setLandlords(formattedLandlords);
          logRequest('Using current user as landlord (limited access)');
          
          // Set default landlord
          setFormData(prev => ({
            ...prev,
            landlordId: formattedLandlords[0].id
          }));
        } else {
          const landlordData = await landlordResponse.json();
          
          // Process landlord data with proper typing
          const formattedLandlords: LandlordData[] = landlordData.results?.map((user: { id: number; full_name: string }) => ({
            id: user.id.toString(),
            name: user.full_name
          })) || [];
          
          setLandlords(formattedLandlords);
          logRequest(`Loaded ${formattedLandlords.length} landlords successfully`);
          
          // Set default landlord if available
          if (formattedLandlords.length > 0) {
            setFormData(prev => ({
              ...prev,
              landlordId: formattedLandlords[0].id
            }));
          }
        }

        // Fetch parent properties (apartment buildings) for floor selection
        const parentResponse = await fetch(`${API_BASE_URL}/properties/properties/?type__status=apartment`);
        if (!parentResponse.ok) {
          logRequest(`Failed to fetch parent properties: ${parentResponse.status} ${parentResponse.statusText}`);
          throw new Error('Failed to fetch parent properties');
        }
        const parentData = await parentResponse.json();
        
        // Process parent property data with proper typing
        const formattedParents: ParentProperty[] = parentData.results?.map((property: { id: number; name: string }) => ({
          id: property.id,
          name: property.name
        })) || [];
        
        setParentProperties(formattedParents);
        logRequest(`Loaded ${formattedParents.length} parent properties successfully`);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        logRequest(`ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        toast.error('Failed to load initial data', { 
          description: 'Please check the API logs for details.'
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchInitialData();
  }, []);

  // Calculate grid dimensions based on number of rooms and shape
  useEffect(() => {
    const { numRooms, shape } = formData;
    let rows = 2, cols = 2;

    if (shape === 'rectangle') {
      // Simple calculation for a rectangle - try to make it close to a square
      cols = Math.ceil(Math.sqrt(numRooms));
      rows = Math.ceil(numRooms / cols);
    } else if (shape === 'l_shaped') {
      // For L shape, we want to distribute rooms in an L pattern
      const baseSize = Math.floor(Math.sqrt(numRooms));
      rows = baseSize + 1;
      cols = baseSize + 1;
    } else if (shape === 'u_shaped') {
      // For U shape, we want a U arrangement
      const baseSize = Math.floor(Math.sqrt(numRooms / 3)) + 1;
      rows = baseSize + 1;
      cols = baseSize * 2;
    } else {
      // Square with space - similar to rectangle but with middle space
      cols = Math.ceil(Math.sqrt(numRooms + 1)) + 1;
      rows = cols;
    }

    setGridRows(rows);
    setGridCols(cols);
  }, [formData.numRooms, formData.shape]);

  // Handle input changes
  const handleChange = (field: keyof TestFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If property type changes to apartment, check if we need to add floor number
    if (field === 'propertyType') {
      const selectedType = propertyTypes.find(type => type.id.toString() === value);
      if (selectedType?.status === 'apartment') {
        // For apartment floors, ensure floor_number is set
        if (!formData.floor_number) {
          setFormData(prev => ({ ...prev, floor_number: 1 }));
        }
      } else {
        // For non-apartments, clear parent_property and floor_number
        setFormData(prev => ({ 
          ...prev, 
          parent_property: null,
          floor_number: null
        }));
      }
    }
  };

  // Log API requests for debugging
  const logRequest = (message: string) => {
    setRequestLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Clear logs
  const clearLogs = () => {
    setRequestLogs([]);
  };

  // Handle form submission to create property and blocks
  const handleSubmit = async () => {
    setLoading(true);
    clearLogs(); // Clear previous logs when starting a new submission
    logRequest("=== Starting Property Creation Process ===");
    
    try {
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Property name is required');
        return;
      }

      if (!formData.propertyType) {
        toast.error('Property type is required');
        return;
      }
      
      // Get the selected property type object
      const selectedType = propertyTypes.find(type => type.id.toString() === formData.propertyType);
      logRequest(`Selected property type: ${JSON.stringify(selectedType, null, 2)}`);
      
      if (!selectedType) {
        toast.error('Invalid property type selected');
        return;
      }
      
      // Validate apartment-specific fields
      if (selectedType.status === 'apartment' && !formData.floor_number) {
        toast.error('Apartment requires a floor number');
        return;
      }

      // Prepare property data - ONLY include floor_number for apartments
      const propertyData: {
        name: string;
        type: number;
        address: string;
        landlord: number;
        parent_property?: number;
        floor_number?: number | null;
      } = {
        name: formData.name,
        type: parseInt(formData.propertyType), // Send the ID as integer
        address: formData.address,
        landlord: parseInt(formData.landlordId)
      };

      // Add apartment-specific fields ONLY if type is apartment
      if (selectedType.status === 'apartment') {
        if (formData.parent_property) {
          propertyData.parent_property = parseInt(formData.parent_property);
        }
        propertyData.floor_number = formData.floor_number;
      } else {
        // Explicitly set floor_number to null for non-apartments
        propertyData.floor_number = null;
      }

      logRequest(`Creating property with data: ${JSON.stringify(propertyData, null, 2)}`);

      // Step 1: Create the property
      logRequest("API Request: Creating property...");
      
      // Debug endpoint removed as it doesn't exist
      
      const propertyRequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(propertyData),
      };
      
      logRequest(`Request options: ${JSON.stringify(propertyRequestOptions, null, 2)}`);
      
      const propertyResponse = await fetch(`${API_BASE_URL}/properties/properties/`, propertyRequestOptions);

      // Log the raw response if not successful
      if (!propertyResponse.ok) {
        const errorText = await propertyResponse.text();
        logRequest(`API Error Status: ${propertyResponse.status} ${propertyResponse.statusText}`);
        logRequest(`API Error Response Raw: ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          logRequest(`Parsed Error Details: ${JSON.stringify(errorData, null, 2)}`);
        } catch {
          logRequest(`Could not parse error response as JSON`);
        }
        
        // Switch to logs tab to show the error
        setSelectedTab('logs');
        
        throw new Error(`Failed to create property: ${propertyResponse.status} ${propertyResponse.statusText}`);
      }

      const property = await propertyResponse.json();
      setCreatedPropertyId(property.id);
      
      logRequest(`Property created successfully with ID: ${property.id}`);
      
      // Step 2: Use the simplified automation endpoint to generate blocks
      const automationData = {
        property_id: property.id,
        num_rooms: formData.numRooms,
        shape: formData.shape,
      };
      
      logRequest(`Calling simple automation test endpoint: ${JSON.stringify(automationData, null, 2)}`);
      logRequest("API Request: Creating automation configuration and generating blocks in one step...");
      
      // Using the new simplified endpoint
      const automationResponse = await fetch(`${API_BASE_URL}/properties/simple-automation-test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(automationData),
      });

      if (!automationResponse.ok) {
        const errorText = await automationResponse.text();
        logRequest(`API Error Status: ${automationResponse.status} ${automationResponse.statusText}`);
        logRequest(`API Error Response Raw: ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          logRequest(`Parsed Error Details: ${JSON.stringify(errorData, null, 2)}`);
          
          // Add more detailed error info for common issues
          if (automationResponse.status === 404) {
            logRequest("ERROR: Endpoint not found. Make sure the server has been restarted after updates.");
          } else if (automationResponse.status === 400) {
            logRequest(`ERROR: Bad request data. Check if all required fields are present: ${JSON.stringify(automationData)}`);
          } else if (automationResponse.status === 500) {
            logRequest("ERROR: Server error. Check the server logs for more details.");
          }
        } catch {
          logRequest(`Could not parse error response as JSON`);
        }
        
        // Switch to logs tab to show the error
        setSelectedTab('logs');
        
        throw new Error(`Failed to create automation: ${automationResponse.status} ${automationResponse.statusText}`);
      }
      
      const automationResult = await automationResponse.json();
      logRequest(`Automation completed successfully: ${JSON.stringify(automationResult, null, 2)}`);
      
      // Process blocks from the automation result
      if (automationResult && automationResult.blocks_created) {
        const blocks = automationResult.blocks_created.map((blockId: string, index: number) => ({
          id: index + 1,
          block_id: blockId,
          property: property.id,
          is_occupied: false
        }));
        
        setGeneratedBlocks(blocks);
        logRequest(`Generated ${blocks.length} blocks successfully`);
      } else if (automationResult && automationResult.blocks) {
        // Fallback for backward compatibility
        const blocks = automationResult.blocks.map((blockId: string, index: number) => ({
          id: index + 1,
          block_id: blockId,
          property: property.id,
          is_occupied: false
        }));
        
        setGeneratedBlocks(blocks);
        logRequest(`Generated ${blocks.length} blocks successfully (using legacy field)`);
      } else {
        logRequest('No blocks returned from automation endpoint');
      }
      
      logRequest("=== Property Creation Process Completed Successfully ===");
      
      toast.success('Property and blocks created successfully', {
        description: `Created ${generatedBlocks.length} blocks for property "${property.name}"`
      });
      
      // Switch to the results tab
      setSelectedTab('results');
      
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property and blocks', { 
        description: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      logRequest(`ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      logRequest("=== Property Creation Process Failed ===");
    } finally {
      setLoading(false);
    }
  };

  // Reset the form and clear results
  const handleReset = () => {
    setFormData(defaultFormData);
    setCreatedPropertyId(null);
    setGeneratedBlocks([]);
    setSelectedTab('property');
  };

  // Render property details form
  const renderPropertyDetails = () => {
    // Make sure propertyTypes is an array before using find
    const selectedTypeObj = Array.isArray(propertyTypes) 
      ? propertyTypes.find(type => type.id.toString() === formData.propertyType)
      : undefined;
    const isApartment = selectedTypeObj?.status === 'apartment';

    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            Enter the basic information about the property you want to test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="propertyType">Property Type</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => handleChange('propertyType', value)}
              disabled={fetchingData}
            >
              <SelectTrigger id="propertyType">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name} ({type.status_display})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="landlord">Landlord</Label>
            <Select
              value={formData.landlordId}
              onValueChange={(value) => handleChange('landlordId', value)}
              disabled={fetchingData}
            >
              <SelectTrigger id="landlord">
                <SelectValue placeholder="Select landlord" />
              </SelectTrigger>
              <SelectContent>
                {landlords.map((landlord) => (
                  <SelectItem key={landlord.id} value={landlord.id}>
                    {landlord.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isApartment && (
            <>
              <div className="space-y-1">
                <Label htmlFor="parent_property">Parent Property (Building)</Label>
                <Select
                  value={formData.parent_property?.toString() || ''}
                  onValueChange={(value) => handleChange('parent_property', value)}
                  disabled={fetchingData || parentProperties.length === 0}
                >
                  <SelectTrigger id="parent_property">
                    <SelectValue placeholder="Select parent building" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentProperties.length === 0 ? (
                      <SelectItem value="none" disabled>No apartment buildings available</SelectItem>
                    ) : (
                      parentProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {parentProperties.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No apartment buildings available. Create one first or choose a different property type.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="floor_number">Floor Number</Label>
                <Input
                  type="number"
                  id="floor_number"
                  value={formData.floor_number || 1}
                  onChange={(e) => handleChange('floor_number', parseInt(e.target.value))}
                  min={1}
                  max={50}
                  disabled={!formData.parent_property}
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter property name"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter property address"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render room configuration form
  const renderRoomConfiguration = () => {
    // Make sure propertyTypes is an array before using find
    const selectedTypeObj = Array.isArray(propertyTypes) 
      ? propertyTypes.find(type => type.id.toString() === formData.propertyType)
      : undefined;
    const isApartment = selectedTypeObj?.status === 'apartment';

    return (
      <Card>
        <CardHeader>
          <CardTitle>Room Configuration</CardTitle>
          <CardDescription>
            Configure the number of rooms and layout shape for block generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedTypeObj && (
            <Alert className={isApartment ? "bg-blue-50" : "bg-amber-50"}>
              <AlertCircle className={isApartment ? "text-blue-500" : "text-amber-500"} />
              <AlertTitle>Testing {selectedTypeObj.status_display}</AlertTitle>
              <AlertDescription>
                {selectedTypeObj.status === 'villa' && "Villas are treated as a single block with the entire house."}
                {selectedTypeObj.status === 'bungalow' && "Bungalows will have individual rooms as blocks."}
                {selectedTypeObj.status === 'apartment' && "Apartments are organized by floors, with rooms within each floor."}
                {selectedTypeObj.status === 'room' && "Individual rooms are treated as standalone blocks."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="numRooms">Number of Rooms: {formData.numRooms}</Label>
                <span className="text-sm text-muted-foreground">{formData.numRooms} room{formData.numRooms !== 1 ? 's' : ''}</span>
              </div>
              <Slider
                id="numRooms"
                value={[formData.numRooms]}
                onValueChange={(value) => handleChange('numRooms', value[0])}
                min={1}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label>Property Layout Shape</Label>
              
              <Tabs
                value={formData.shape}
                onValueChange={(value) => handleChange('shape', value as 'rectangle' | 'l_shaped' | 'u_shaped' | 'square_with_space')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-4">
                  {propertyShapes.map((shape) => (
                    <TabsTrigger key={shape.value} value={shape.value}>
                      {shape.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {propertyShapes.map((shape) => (
                  <TabsContent key={shape.value} value={shape.value} className="mt-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          {shape.description}
                        </p>
                        
                        {/* Shape visualization */}
                        <div className="bg-slate-100 p-4 rounded-md">
                          <div className="grid gap-1"
                              style={{
                                gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                              }}>
                            {Array.from({ length: gridRows * gridCols }).map((_, index) => {
                              const row = Math.floor(index / gridCols);
                              const col = index % gridCols;
                              
                              // Determine if this cell should be visible based on shape
                              let isVisible = true;
                              
                              if (shape.value === 'l_shaped') {
                                // For L-shape, hide cells that aren't in the L pattern
                                isVisible = row === gridRows - 1 || col === 0;
                              } else if (shape.value === 'u_shaped') {
                                // For U-shape, hide cells that aren't in the U pattern
                                isVisible = row === 0 || col === 0 || col === gridCols - 1;
                              } else if (shape.value === 'square_with_space') {
                                // For square with space, hide the center cell(s)
                                const centerRow = Math.floor(gridRows / 2);
                                const centerCol = Math.floor(gridCols / 2);
                                isVisible = !(row === centerRow && col === centerCol);
                              }
                              
                              // Calculate current room number
                              let roomNumber = null;
                              if (isVisible) {
                                // Calculate room number based on visible cells
                                const visibleCells = Array.from({ length: index }).filter((_, idx) => {
                                  const r = Math.floor(idx / gridCols);
                                  const c = idx % gridCols;
                                  
                                  if (shape.value === 'l_shaped') {
                                    return r === gridRows - 1 || c === 0;
                                  } else if (shape.value === 'u_shaped') {
                                    return r === 0 || c === 0 || c === gridCols - 1;
                                  } else if (shape.value === 'square_with_space') {
                                    const centerR = Math.floor(gridRows / 2);
                                    const centerC = Math.floor(gridCols / 2);
                                    return !(r === centerR && c === centerC);
                                  }
                                  return true;
                                }).length;
                                
                                roomNumber = visibleCells + 1;
                                if (roomNumber > formData.numRooms) {
                                  isVisible = false;
                                }
                              }
                              
                              return isVisible ? (
                                <div
                                  key={index}
                                  className={cn(
                                    "aspect-square flex items-center justify-center text-xs font-medium",
                                    "bg-primary text-primary-foreground rounded-sm"
                                  )}
                                >
                                  {roomNumber <= formData.numRooms ? roomNumber : ''}
                                </div>
                              ) : (
                                <div
                                  key={index}
                                  className="aspect-square bg-slate-200 rounded-sm"
                                />
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Auto-Generation Information</AlertTitle>
            <AlertDescription>
              The block generation algorithm will automatically create {formData.numRooms} blocks
              with the {formData.shape} layout pattern. Blocks will be given sequential IDs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Render block generation results
  const renderResults = () => {
    if (!createdPropertyId) {
      return (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                Run the block generation process to see results here.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Blocks</CardTitle>
          <CardDescription>
            {generatedBlocks.length} blocks were generated for property ID: {createdPropertyId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Property created successfully with {generatedBlocks.length} blocks.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {generatedBlocks.map((block) => (
                <div 
                  key={block.id}
                  className="p-3 border rounded-md flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <span className="font-medium">{block.block_id}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={handleReset}
              >
                Create Another Property
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render API logs
  const renderLogs = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>API Request Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={clearLogs} className="h-8 gap-1">
            <X className="h-4 w-4" /> Clear
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            className="font-mono text-xs h-[400px] resize-none"
            value={requestLogs.join('\n')}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {fetchingData ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">Loading property types and landlord data...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="property">Property Details</TabsTrigger>
              <TabsTrigger value="rooms">Room Configuration</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="logs">API Logs</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="property">
                {renderPropertyDetails()}
              </TabsContent>
              
              <TabsContent value="rooms">
                {renderRoomConfiguration()}
              </TabsContent>
              
              <TabsContent value="results">
                {renderResults()}
              </TabsContent>

              <TabsContent value="logs">
                {renderLogs()}
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedTab === 'property') {
                  setSelectedTab('rooms');
                } else if (selectedTab === 'rooms') {
                  setSelectedTab('property');
                }
              }}
              disabled={loading || selectedTab === 'results' || selectedTab === 'logs'}
            >
              {selectedTab === 'rooms' ? 'Back to Property Details' : 'Next: Room Configuration'}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedTab === 'results' || selectedTab === 'logs' || !formData.propertyType}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Blocks
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 