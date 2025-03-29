'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/**
 * Interface for Step component props
 */
interface StepProps {
  title: string;
  description?: string;
  active?: boolean;
  completed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Interface for Steps component props
 */
interface StepsProps {
  currentStep: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Step - Individual step component for the multi-step process
 */
export function Step({
  title,
  description,
  active = false,
  completed = false,
  disabled = false,
  onClick
}: StepProps) {
  return (
    <div 
      className={cn(
        "flex flex-col relative", 
        {
          "opacity-100": active || completed, 
          "opacity-50": !active && !completed,
          "cursor-pointer": !disabled && onClick, 
          "cursor-not-allowed": disabled
        }
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div 
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
              {
                "bg-primary border-primary text-white": active || completed,
                "border-gray-300 bg-white text-gray-400": !active && !completed,
              }
            )}
          >
            {completed ? (
              <Check className="h-5 w-5" />
            ) : (
              <span>{}</span>
            )}
          </div>
          
          {/* Connector line */}
        </div>
        
        <div className="mt-1">
          <h3 
            className={cn(
              "text-sm font-medium", 
              {
                "text-gray-900": active || completed,
                "text-gray-500": !active && !completed
              }
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Steps - Container component for the multi-step process
 */
export function Steps({ currentStep, className, children }: StepsProps) {
  // Convert children to array
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={cn("flex justify-between gap-2", className)}>
      {childrenArray.map((child, index) => {
        // If it's the last child, don't render the connector
        const isLast = index === childrenArray.length - 1;
        
        // Clone the child with connector
        if (React.isValidElement(child)) {
          return (
            <div key={index} className="relative flex flex-1 items-center">
              {React.cloneElement(child)}
              
              {/* Connector Line */}
              {!isLast && (
                <div 
                  className={cn(
                    "absolute top-4 w-full h-0.5 left-4 -ml-2", 
                    {
                      "bg-primary": index < currentStep,
                      "bg-gray-200": index >= currentStep
                    }
                  )} 
                />
              )}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
} 