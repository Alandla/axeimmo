'use client'

import { useCreationStore } from '../store/creationStore'
import { StepState } from '../types/step'
import { Check, Clock, Loader2 } from 'lucide-react'

export function GenerationProgress() {
  const { steps } = useCreationStore()

  return (
    <ul className="space-y-4 mt-4">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center space-x-4">
          <div
            className={`rounded-full p-1 ${
              step.state === StepState.COMPLETED
                ? "bg-green-500"
                : step.state === StepState.IN_PROGRESS
                ? "bg-primary"
                : "bg-gray-300"
            }`}
          >
            {step.state === StepState.COMPLETED ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : step.state === StepState.IN_PROGRESS ? (
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-gray-500" />
            )}
          </div>
          <div className="flex-grow">
            <p className="font-medium text-sm">{step.name}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${
                  step.state === StepState.COMPLETED
                    ? "bg-green-500"
                    : step.state === StepState.IN_PROGRESS
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
                style={{ width: `${step.progress}%` }}
              ></div>
            </div>
          </div>
          <span className="text-sm text-gray-500">{step.progress}%</span>
        </li>
      ))}
    </ul>
  )
}
