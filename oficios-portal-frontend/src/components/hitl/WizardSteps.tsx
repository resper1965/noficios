'use client';

import { CheckCircle } from 'lucide-react';

export interface WizardStep {
  number: number;
  label: string;
  description: string;
}

interface WizardStepsProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardSteps({ steps, currentStep, onStepClick }: WizardStepsProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isClickable = currentStep >= step.number && onStepClick;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && onStepClick(step.number)}
                    disabled={!isClickable}
                    className={`
                      relative w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 animate-pulse' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-700 text-gray-400 border-2 border-gray-600' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </button>
                  
                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 mt-[-40px]">
                    <div
                      className={`h-1 rounded transition-all ${
                        currentStep > step.number ? 'bg-green-600' : 'bg-gray-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

