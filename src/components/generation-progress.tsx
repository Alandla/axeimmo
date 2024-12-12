'use client'

import { useCreationStore } from '../store/creationStore'
import { Steps, StepState } from '../types/step'
import { Check, Clock, Loader2, Upload, Mic, FileText, User, Search, X, Sparkle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function GenerationProgress() {
  const { steps } = useCreationStore()
  const t = useTranslations('generation')

  const getPendingIcon = (stepName: Steps) => {
    switch (stepName) {
      case Steps.MEDIA_UPLOAD:
        return <Upload className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.VOICE_GENERATION:
        return <Mic className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.TRANSCRIPTION:
        return <FileText className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.AVATAR_GENERATION:
        return <User className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.SEARCH_MEDIA:
        return <Search className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.ANALYZE_YOUR_MEDIA:
        return <Sparkle className="h-3.5 w-3.5 text-gray-500" />;
      case Steps.ANALYZE_NEW_MEDIA:
        return <Sparkle className="h-3.5 w-3.5 text-gray-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  return (
    <ul className="space-y-4 mt-4">
      {steps
        .sort((a, b) => a.id - b.id)
        .map((step) => (
        <li key={step.id} className="flex items-center space-x-4">
          <div
            className={`rounded-full p-1 ${
              step.state === StepState.COMPLETED
                ? "bg-green-500"
                : step.state === StepState.IN_PROGRESS
                ? "bg-primary"
                : step.state === StepState.FAILED
                ? "bg-red-500"
                : "bg-gray-300"
            }`}
          >
            {step.state === StepState.COMPLETED ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : step.state === StepState.IN_PROGRESS ? (
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            ) : step.state === StepState.FAILED ? (
              <X className="h-3.5 w-3.5 text-white" />
            ) : (
              getPendingIcon(step.name)
            )}
          </div>
          <div className="flex-grow">
            <p className="font-medium text-sm">
              {step.state === StepState.FAILED 
                ? t('error-message') 
                : t(step.name)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${
                  step.state === StepState.COMPLETED
                    ? "bg-green-500"
                    : step.state === StepState.IN_PROGRESS
                    ? "bg-primary"
                    : step.state === StepState.FAILED
                    ? "bg-red-500"
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
