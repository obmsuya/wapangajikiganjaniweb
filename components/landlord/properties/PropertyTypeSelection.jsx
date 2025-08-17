// components/landlord/properties/PropertyTypeSelection.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Home, Building } from "lucide-react";
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (propertyData.category !== selectedType) {
      setSelectedType(propertyData.category || '');
    }
  }, [propertyData.category, selectedType]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedType) {
      newErrors.type = 'Please select a property type';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid);
    return isValid;
  }, [selectedType, onValidationChange]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleTypeSelection = (typeId) => {
    setSelectedType(typeId);
    
    const floors = typeId === 'Single Floor' ? 1 : 2;
    
    updatePropertyData({
      category: typeId,
      total_floors: floors,
      floors: {}
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Type</h2>
        <p className="text-muted-foreground">
          Choose the type that best describes your property
        </p>
      </div>

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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {type.title}
                      </h3>
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
                    <p className="text-muted-foreground text-sm mb-4">
                      {type.description}
                    </p>
                    <div className="space-y-1">
                      {type.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
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
                  ? 'Multi-floor property - Layout will be configured in the next step'
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