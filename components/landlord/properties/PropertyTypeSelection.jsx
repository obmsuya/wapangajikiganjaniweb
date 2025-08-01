// components/landlord/properties/PropertyTypeSelection.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Home, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePropertyCreation } from "@/hooks/properties/useProperties";

const propertyTypes = [
  {
    id: 'Single Floor',
    title: 'Single Floor House',
    description: 'A single-story property with all units on one level',
    icon: Home,
    features: ['Easy management', 'Single level access', 'Ideal for families']
  },
  {
    id: 'Multi-Floor',
    title: 'Multi-Floor House',
    description: 'A multi-story property with units across multiple floors',
    icon: Building,
    features: ['Higher capacity', 'Apartment-style units', 'Maximized space usage']
  }
];

export default function PropertyTypeSelection({ onValidationChange }) {
  const { propertyData, updatePropertyData } = usePropertyCreation();
  const [selectedType, setSelectedType] = useState(propertyData.category || '');
  const [floorCount, setFloorCount] = useState(propertyData.total_floors || 1);
  const [errors, setErrors] = useState({});

  // Sync local state with propertyData changes
  useEffect(() => {
    if (propertyData.category !== selectedType) {
      setSelectedType(propertyData.category || '');
    }
    if (propertyData.total_floors !== floorCount) {
      setFloorCount(propertyData.total_floors || 1);
    }
  }, [propertyData.category, propertyData.total_floors, selectedType, floorCount]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedType) {
      newErrors.type = 'Please select a property type';
    }

    if (selectedType === 'Multi-Floor') {
      if (!floorCount || floorCount < 2) {
        newErrors.floors = 'Multi-floor properties must have at least 2 floors';
      } else if (floorCount > 20) {
        newErrors.floors = 'Maximum 20 floors allowed';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid);
    return isValid;
  }, [selectedType, floorCount, onValidationChange]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleTypeSelection = (typeId) => {
    setSelectedType(typeId);
    
    // Determine floor count based on type
    let floors;
    if (typeId === 'Single Floor') {
      floors = 1;
    } else {
      // For Multi-Floor, keep current count if valid, otherwise default to 2
      floors = floorCount >= 2 ? floorCount : 2;
    }
    
    setFloorCount(floors);
    
    // Update the property data immediately
    updatePropertyData({
      category: typeId,
      total_floors: floors,
      // Reset floors configuration when type changes
      floors: {}
    });

    console.log(`Property type updated: ${typeId}, Floors: ${floors}`);
  };

  const handleFloorCountChange = (value) => {
    const count = parseInt(value, 10);
  
    if (!isNaN(count)) {
      setFloorCount(count);

      // Only update property data if the count is valid
      if (count >= 2 && count <= 20) {
        updatePropertyData({ 
          total_floors: count,
          // Reset floors configuration when count changes
          floors: {}
        });
        console.log(`Floor count updated: ${count}`);
      }
    }
  };

  // Debug information (remove in production)
  useEffect(() => {
    console.log('PropertyTypeSelection State:', {
      selectedType,
      floorCount,
      propertyDataCategory: propertyData.category,
      propertyDataFloors: propertyData.total_floors,
      floorsData: propertyData.floors
    });
  }, [selectedType, floorCount, propertyData]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Type</h2>
        <p className="text-muted-foreground">
          Choose the type that best describes your property
        </p>
      </div>

      {/* Property Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {propertyTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === type.id
                  ? 'ring-2 ring-primary-500 border-primary-500'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => handleTypeSelection(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedType === type.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <type.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {type.description}
                    </p>
                    
                    <ul className="space-y-1">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 bg-primary-500 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedType === type.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedType === type.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {errors.type && (
        <p className="text-red-500 text-sm">{errors.type}</p>
      )}

      {/* Floor Count Input for Multi-Floor */}
      {selectedType === 'Multi-Floor' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
        >
          <div className="max-w-md">
            <Label htmlFor="floorCount" className="text-base font-medium">
              Number of Floors *
            </Label>
            <Input
              id="floorCount"
              type="number"
              min="2"
              max="20"
              placeholder="Enter number of floors"
              value={floorCount}
              onChange={(e) => handleFloorCountChange(e.target.value)}
              className={`mt-2 h-12 ${errors.floors ? 'border-red-500' : ''}`}
            />
            {errors.floors && (
              <p className="text-red-500 text-sm mt-1">{errors.floors}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Specify how many floors your property has (2-20 floors)
            </p>
            
            {/* Floor count confirmation */}
            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Configuration:</strong> {floorCount} floor{floorCount !== 1 ? 's' : ''} will be created for layout design
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              ✓
            </div>
            <div>
              <p className="font-medium text-foreground">
                {propertyTypes.find(t => t.id === selectedType)?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedType === 'Multi-Floor' 
                  ? `${floorCount} floors configured - Each floor can have its own layout`
                  : 'Single floor property'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Development Debug Panel (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <strong>Debug Info:</strong>
          <pre>{JSON.stringify({
            selectedType,
            floorCount,
            propertyData: {
              category: propertyData.category,
              total_floors: propertyData.total_floors,
              floors_count: Object.keys(propertyData.floors || {}).length
            }
          }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}