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
  // Get ALL needed data and functions from the hook
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
    // Pass ALL the needed props to each component
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Property</h1>
              <p className="text-muted-foreground mt-1">
                Set up your property to start managing tenants and rent collection
              </p>
            </div>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Step {currentStep} of {maxSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`flex items-center cursor-pointer ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
                onClick={() => handleStepClick(step.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step.id === currentStep
                        ? 'bg-primary-600 text-white'
                        : step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
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

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {totalUnits > 0 && `${totalUnits} units configured`}
          </div>

          {currentStep < maxSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed || isLoading}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Creating Property...' : 'Create Property'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}