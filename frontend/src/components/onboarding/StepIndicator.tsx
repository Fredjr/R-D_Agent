'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    number: number;
    label: string;
    description?: string;
  }>;
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Step Circles */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            const isPending = currentStep < step.number;

            return (
              <div key={step.number} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 
                    transition-all duration-300 ease-out
                    ${isCompleted ? 'bg-blue-600 border-blue-600' : ''}
                    ${isActive ? 'bg-white border-blue-600 ring-4 ring-blue-100' : ''}
                    ${isPending ? 'bg-white border-gray-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`
                        text-sm font-semibold
                        ${isActive ? 'text-blue-600' : ''}
                        ${isPending ? 'text-gray-400' : ''}
                      `}
                    >
                      {step.number}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <div
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${isActive ? 'text-blue-600' : ''}
                      ${isCompleted ? 'text-gray-700' : ''}
                      ${isPending ? 'text-gray-400' : ''}
                    `}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1 max-w-[100px]">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
}

// Compact version for mobile
export function CompactStepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% complete
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

