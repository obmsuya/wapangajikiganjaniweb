// components/landlord/properties/PropertySetupForm.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePropertyCreation } from "@/hooks/properties/useProperties";
import PropertyBasicInfo from "./PropertyBasicInfo";
import PropertyTypeSelection from "./PropertyTypeSelection";
import FloorPlanDesigner from "./FloorPlanDesigner";
import UnitConfiguration from "./UnitConfiguration";
import PropertySummary from "./PropertySummary";

const steps = [
  { id: 1, title: "Property Details", description: "Basic information about your property" },
  { id: 2, title: "Property Type", description: "Choose your property configuration" },
  { id: 3, title: "Floor Plans", description: "Design your property layout" },
  { id: 4, title: "Unit Details", description: "Configure individual units" },
  { id: 5, title: "Review & Create", description: "Review and finalize your property" }
];

export default function PropertySetupForm({ onComplete, onCancel }) {
  const {
    currentStep,
    propertyData,
    floorData,
    configuredUnits,
    isLoading,
    error,
    nextStep,
    prevStep,
    goToStep,
    saveProperty,
    resetForm,
    totalUnits,
    maxSteps,
    updatePropertyData,
    updateFloorData,
    addUnitData
  } = usePropertyCreation();

  const [canProceed, setCanProceed] = useState(false);

  const handleNext = () => {
    if (canProceed) {
      nextStep();
      setCanProceed(false);
    }
  };

  const handlePrevious = () => {
    prevStep();
    setCanProceed(true);
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber <= currentStep) {
      goToStep(stepNumber);
    }
  };

  const handleComplete = async () => {
    try {
      const result = await saveProperty();
      onComplete?.(result);
    } catch (error) {
      console.error("Failed to save property:", error);
    }
  };

  const renderStepContent = () => {
    const baseProps = {
      onValidationChange: setCanProceed,
      onNext: handleNext,
      onPrevious: handlePrevious
    };

    switch (currentStep) {
      case 1:
        return (
          <PropertyBasicInfo 
            {...baseProps}
            propertyData={propertyData}
            updatePropertyData={updatePropertyData}
          />
        );
      case 2:
        return (
          <PropertyTypeSelection 
            {...baseProps}
            propertyData={propertyData}
            updatePropertyData={updatePropertyData}
          />
        );
      case 3:
        return (
          <FloorPlanDesigner 
            {...baseProps}
            propertyData={propertyData}
            floorData={floorData}
            updateFloorData={updateFloorData}
            updatePropertyData={updatePropertyData}
            existingProperty={null}
          />
        );
      case 4:
        return (
          <UnitConfiguration 
            {...baseProps}
            propertyData={propertyData}
            floorData={floorData}
            addUnitData={addUnitData}
          />
        );
      case 5:
        return (
          <PropertySummary 
            {...baseProps}
            propertyData={propertyData}
            floorData={floorData}
            configuredUnits={configuredUnits}
            saveProperty={saveProperty}
            isLoading={isLoading}
            onComplete={handleComplete}
          />
        );
      default:
        return (
          <PropertyBasicInfo 
            {...baseProps}
            propertyData={propertyData}
            updatePropertyData={updatePropertyData}
          />
        );
    }
  };

  const progressPercentage = (currentStep / maxSteps) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Property</h1>
              <p className="text-muted-foreground mt-1">
                Step {currentStep} of {maxSteps}: {steps[currentStep - 1]?.description}
              </p>
            </div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step.id === currentStep
                      ? 'bg-primary-600 text-white'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-12 mx-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="min-h-[600px]">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={onCancel}>
            Cancel Setup
          </Button>
          
          <div className="flex items-center gap-4">
            {currentStep < maxSteps ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={!canProceed || isLoading}
              >
                {isLoading ? 'Creating Property...' : 'Create Property'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}