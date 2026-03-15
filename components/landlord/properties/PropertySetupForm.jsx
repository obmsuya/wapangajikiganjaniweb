"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePropertyCreation } from "@/hooks/properties/useProperties";
import PropertyBasicInfo from "./PropertyBasicInfo";
import PropertyTypeSelection from "./PropertyTypeSelection";
import FloorPlanDesigner from "./FloorPlanDesigner";
import UnitConfiguration from "./UnitConfiguration";
import PropertySummary from "./PropertySummary";

const steps = [
  {
    id: 1,
    title: "Property Details",
    description: "Basic information about your property",
    shortTitle: "Details",
  },
  {
    id: 2,
    title: "Property Type",
    description: "Choose your property configuration",
    shortTitle: "Type",
  },
  {
    id: 3,
    title: "Floor Plans",
    description: "Design your property layout",
    shortTitle: "Floors",
  },
  {
    id: 4,
    title: "Unit Details",
    description: "Configure individual units",
    shortTitle: "Units",
  },
  {
    id: 5,
    title: "Review & Create",
    description: "Review and finalize your property",
    shortTitle: "Review",
  },
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
    maxSteps,
    updatePropertyData,
    updateFloorData,
    addUnitData,
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
    } catch (err) {
      console.error("Failed to save property:", err);
    }
  };

  const renderStepContent = () => {
    const baseProps = {
      onValidationChange: setCanProceed,
      onNext: handleNext,
      onPrevious: handlePrevious,
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

  const currentStepMeta = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Create New Property
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Step {currentStep} of {maxSteps} — {currentStepMeta?.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Cancel setup"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              const isClickable = step.id <= currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      aria-label={`Go to step ${step.id}: ${step.title}`}
                      className={[
                        "size-9 sm:size-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-not-allowed",
                      ].join(" ")}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        step.id
                      )}
                    </button>
                    <span
                      className={[
                        "hidden sm:block text-xs font-medium whitespace-nowrap",
                        isActive
                          ? "text-primary"
                          : isCompleted
                          ? "text-green-600"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {step.shortTitle}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={[
                        "h-0.5 flex-1 mx-2 sm:mx-3 rounded-full transition-colors duration-300",
                        isCompleted ? "bg-green-500" : "bg-muted",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mt-4 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="shrink-0 w-fit"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="shrink-0 w-fit"
              >
                <ChevronLeft className="size-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            )}

            {currentStep < maxSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="shrink-0 w-fit"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed || isLoading}
                className="shrink-0 w-fit"
              >
                {isLoading ? "Creating…" : "Create Property"}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}