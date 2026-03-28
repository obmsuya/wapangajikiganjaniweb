// components/landlord/properties/PropertyTypeSelection.jsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const propertyTypes = [
  {
    id: 'Single Floor',
    title: 'Single Floor House',
    description: 'A single-story property with all units on one level',
    icon: Home,
  },
  {
    id: 'Multi-Floor',
    title: 'Multi-Floor House',
    description: 'A multi-story property with units across multiple floors',
    icon: Building,
  }
];

export default function PropertyTypeSelection({ onValidationChange, propertyData, updatePropertyData }) {
  const selectedType = propertyData?.category || '';

  useEffect(() => {
    onValidationChange?.(!!selectedType);
  }, [selectedType, onValidationChange]);

  const handleTypeSelection = (typeId) => {
    const total_floors = typeId === 'Single Floor' ? 1 : 2;
    updatePropertyData({ category: typeId, total_floors, floors: {} });
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Property Type</h2>
        <p className="text-muted-foreground">Choose the type that best describes your property</p>
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
              className={`cursor-pointer p-6 ${
                selectedType === type.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'border-border hover:border-zinc-400'
              }`}
              onClick={() => handleTypeSelection(type.id)}
            >
              <CardContent>
                <div className="flex items-start gap-4 max-sm:flex-col">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedType === type.id ? 'bg-primary/20 text-primary' : 'bg-gray-300/45 text-gray-600'
                  }`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 gap-4">
                      <h3 className="text-lg font-semibold text-foreground">{type.title}</h3>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === type.id ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {selectedType === type.id && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!selectedType && (
        <p className="text-red-500 text-sm">Please select a property type</p>
      )}

      {selectedType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-100 dark:bg-green-900/20 rounded-3xl p-4 border border-green-400"
        >
          <div className="flex items-start gap-3 max-sm:flex-col">
            <div className="w-8 h-8 bg-green-200 text-green-600 rounded-full flex items-center justify-center">✓</div>
            <div>
              <p className="font-medium text-green-900">
                {propertyTypes.find(t => t.id === selectedType)?.title}
              </p>
              <p className="text-sm text-green-900/65">
                {selectedType === 'Multi-Floor'
                  ? 'Multi-floor property - Layout will be configured in the next step'
                  : 'Single floor property'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}