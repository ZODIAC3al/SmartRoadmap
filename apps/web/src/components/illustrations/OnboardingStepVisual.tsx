"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type OnboardingStepNumber = 1 | 2 | 3 | 4;

export interface OnboardingStepVisualProps {
  step: OnboardingStepNumber;
  className?: string;
}

export default function OnboardingStepVisual({
  step,
  className = "",
}: OnboardingStepVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`bg-base-100 dark:bg-stone-900 border border-base-300 dark:border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden select-none max-w-sm w-full ${className}`}
    >
      {/* Step 1: Target Career Destination */}
      {step === 1 && (
        <div className="space-y-4">
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-3, 3, -3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/25 flex items-center justify-center text-3xl mx-auto shadow-inner"
          >
            🎯
          </motion.div>
          <div>
            <h4 className="font-extrabold text-base text-base-content">
              Target Career Role
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1">
              Select your dream role to calibrate required technical proficiencies.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Skill Baseline Audit */}
      {step === 2 && (
        <div className="space-y-4">
          <motion.div
            animate={shouldReduceMotion ? {} : { rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/25 flex items-center justify-center text-3xl mx-auto shadow-inner"
          >
            ⚡
          </motion.div>
          <div>
            <h4 className="font-extrabold text-base text-base-content">
              Baseline Skills Audit
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1">
              Declare existing tech stacks so we don't repeat what you already master.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Commitment & Velocity */}
      {step === 3 && (
        <div className="space-y-4">
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-600 border border-blue-500/25 flex items-center justify-center text-3xl mx-auto shadow-inner"
          >
            ⏱️
          </motion.div>
          <div>
            <h4 className="font-extrabold text-base text-base-content">
              Learning Velocity
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1">
              Set realistic daily study targets to protect your streak milestones.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: AI Roadmap Compilation */}
      {step === 4 && (
        <div className="space-y-4">
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 flex items-center justify-center text-3xl mx-auto shadow-inner"
          >
            🚀
          </motion.div>
          <div>
            <h4 className="font-extrabold text-base text-base-content">
              AI Roadmap Initialized
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1">
              Your custom adaptive roadmap graph has been assembled and is ready to explore.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
