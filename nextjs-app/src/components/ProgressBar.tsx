'use client'

import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  completed: boolean
  current: boolean
}

interface ProgressBarProps {
  steps: Step[]
}

export default function ProgressBar({ steps }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-900/50 py-6 mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Círculo del paso */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step.completed
                      ? 'bg-green-600 border-green-600 text-white'
                      : step.current
                      ? 'bg-pink-600 border-pink-600 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                
                {/* Título del paso */}
                <span
                  className={`mt-2 text-sm font-medium transition-colors duration-300 ${
                    step.current
                      ? 'text-white'
                      : step.completed
                      ? 'text-green-400'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              
              {/* Línea conectora */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                    steps[index + 1].completed || steps[index + 1].current
                      ? 'bg-pink-600'
                      : 'bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}