import React from "react";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentIndex: number;
}

export default function Stepper({ steps, currentIndex }: StepperProps) {
  const stepCount = steps.length;
  // Math to position the line exactly between the centers of the first and last circles
  const lineInsetPercent = 100 / (stepCount * 2);

  return (
    <div className="w-full relative flex items-center justify-between">
      {/* Progress Bar Container Track */}
      <div
        className="absolute h-[3px] bg-base-300 -translate-y-1/2 z-0 rounded-full"
        style={{
          left: `${lineInsetPercent}%`,
          right: `${lineInsetPercent}%`,
          top: "20px", // Center alignment with the 40px (w-10) step circle
        }}
      >
        {/* Progress fill line */}
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${(currentIndex / (stepCount - 1)) * 100}%`,
          }}
        />
      </div>

      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;

        return (
          <div
            key={idx}
            className="flex flex-col items-center relative z-10 flex-1"
          >
            {/* Step Circle Indicator */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold font-mono text-sm border-2 transition-all duration-300 ${
                isCompleted
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : isActive
                    ? "bg-base-100 border-primary text-primary ring-4 ring-primary/20 scale-110"
                    : "bg-base-200 border-base-300 text-base-content/40"
              }`}
            >
              {isCompleted ? (
                <svg
                  className="w-5 h-5 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>

            {/* Step Title Label */}
            <span
              className={`mt-3 text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "text-primary scale-105"
                  : isCompleted
                    ? "text-base-content/85"
                    : "text-base-content/40"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
