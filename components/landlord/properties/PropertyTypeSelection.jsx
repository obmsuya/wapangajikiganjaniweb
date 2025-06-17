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
    const floors = typeId === 'Single Floor' ? 1 : Math.max(2, floorCount);
    setFloorCount(floors);
    
    updatePropertyData({
      category: typeId,
      total_floors: floors
    });
  };

  const handleFloorCountChange = (value) => {
    const count = parseInt(value) || 1;
    setFloorCount(count);
    updatePropertyData({ total_floors: count });
  };

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
                  ? `${floorCount} floors configured`
                  : 'Single floor property'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}