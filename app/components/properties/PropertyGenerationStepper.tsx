'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

/**
 * Interface for step data
 */
export interface Step {
  title: string;
  description: string;
}

/**
 * PropertyGenerationStepper component properties
 */
interface PropertyGenerationStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

/**
 * PropertyGenerationStepper component
 * 
 * A responsive stepper component that shows the current progress through
 * a multi-step property generation workflow.
 * 
 * @param steps - Array of step objects containing title and description
 * @param currentStep - Index of the current active step
 * @param onStepClick - Optional callback for when a step is clicked
 */
export default function PropertyGenerationStepper({
  steps,
  currentStep,
  onStepClick
}: PropertyGenerationStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop view (horizontal stepper) */}
      <div className="hidden md:flex justify-between mb-8">
        {steps.map((step, index) => {
          // Determine step status
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
            
          return (
            <div 
              key={`step-${index}`}
              className={cn(
                "flex flex-col items-center w-full relative group",
                // If clickable, add pointer cursor
                onStepClick && index <= currentStep ? "cursor-pointer" : "",
                // If not the last item, add connector line
                index !== steps.length - 1 ? "after:content-[''] after:absolute after:top-5 after:w-full after:h-0.5 after:bg-gray-200 after:left-1/2" : ""
              )}
              onClick={() => onStepClick && onStepClick(index)}
              role={onStepClick ? "button" : undefined}
              tabIndex={onStepClick ? 0 : undefined}
            >
              {/* Step circle */}
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full z-10 transition-colors duration-200",
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  isActive ? "bg-primary/20 border-2 border-primary text-primary" : 
                  "bg-gray-100 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step title */}
              <div 
                className={cn(
                  "mt-2 text-sm font-medium transition-colors duration-200",
                  isCompleted || isActive ? "text-primary" : "text-gray-500"
                )}
              >
                {step.title}
              </div>
              
              {/* Step description (smaller screens hide) */}
              <div className="text-xs text-gray-500 text-center hidden lg:block mt-1">
                {step.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile view (vertical list) */}
      <div className="md:hidden space-y-3 mb-6">
        {steps.map((step, index) => {
          // Determine step status
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div 
              key={`mobile-step-${index}`}
              className={cn(
                "flex items-center p-3 rounded-md transition-colors",
                isActive ? "bg-primary/10 border border-primary/20" : 
                isCompleted ? "bg-gray-50" : "bg-gray-50/50",
                onStepClick && index <= currentStep ? "cursor-pointer" : ""
              )}
              onClick={() => onStepClick && onStepClick(index)}
              role={onStepClick ? "button" : undefined}
              tabIndex={onStepClick ? 0 : undefined}
            >
              {/* Step indicator */}
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full mr-3",
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  isActive ? "bg-primary/20 border-2 border-primary text-primary" : 
                  "bg-gray-100 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              
              {/* Step text */}
              <div>
                <div 
                  className={cn(
                    "text-sm font-medium",
                    isCompleted || isActive ? "text-primary" : "text-gray-500"
                  )}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 