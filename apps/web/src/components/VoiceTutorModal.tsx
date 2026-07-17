"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceTutor } from "@/hooks/useVoiceTutor";
import { Mic, MicOff, BookOpen, BrainCircuit, X, Play, Square, AlertCircle, Volume2 } from "lucide-react";

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleTopics: string[];
  trackTitle: string;
  cheatSheetContent?: string;
}

export default function VoiceTutorModal({
  isOpen,
  onClose,
  moduleTitle,
  moduleTopics,
  trackTitle,
  cheatSheetContent,
}: VoiceTutorModalProps) {
  const [mode, setMode] = useState<"expert" | "quiz" | "assistant">("expert");
  const [sessionActive, setSessionActive] = useState(false);

  const {
    status,
    userTranscript,
    agentTranscript,
    errorMsg,
    start,
    stop,
  } = useVoiceTutor({
    moduleTitle,
    moduleTopics,
    trackTitle,
    mode,
    cheatSheetContent,
  });

  const handleStart = () => {
    setSessionActive(true);
    start();
  };

  const handleStop = () => {
    setSessionActive(false);
    stop();
  };

  const handleClose = () => {
    stop();
    setSessionActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-base-200 border border-base-300 rounded-[2.5rem] p-6 shadow-2xl space-y-6 text-start relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex justify-between items-center pb-2 border-b border-base-300">
          <div>
            <span className="text-[9px] uppercase font-mono font-bold text-indigo-650 bg-indigo-600/10 px-2 py-0.5 rounded">
              AssemblyAI Voice Agent
            </span>
            <h3 className="font-extrabold text-sm text-base-content mt-1.5">
              AI Voice Tutor
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!sessionActive ? (
          /* Mode Selector Screen */
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-base-content">Select Tutor Behavior</h4>
              <p className="text-[10px] text-base-content/50">
                Choose how the AI tutor should interact with you during this audio session.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "expert" as const,
                  title: "Module Expert",
                  desc: "Q&A session covering specific topics in this module.",
                  icon: <BookOpen className="w-5 h-5 text-indigo-650" />,
                },
                {
                  id: "quiz" as const,
                  title: "Quiz Me",
                  desc: "The AI quizzes you verbally and scores your replies.",
                  icon: <BrainCircuit className="w-5 h-5 text-emerald-500" />,
                },
                {
                  id: "assistant" as const,
                  title: "General Tutor",
                  desc: "Open-ended assistance for this learning path.",
                  icon: <Volume2 className="w-5 h-5 text-amber-500" />,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`border p-4 rounded-2xl flex flex-col items-center text-center space-y-2.5 transition-all ${
                    mode === m.id
                      ? "border-indigo-600 bg-indigo-600/5 shadow-md"
                      : "border-base-300 bg-base-100 hover:bg-base-200"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-base-200 border border-base-300">
                    {m.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-base-content">{m.title}</h5>
                    <p className="text-[9px] text-base-content/50 leading-snug">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-block rounded-xl font-bold h-12 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Audio Session
            </button>
          </div>
        ) : (
          /* Live Streaming Screen */
          <div className="space-y-6">
            {/* Status and Pulsing Ring Waveform */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative flex items-center justify-center">
                <AnimatePresence>
                  {(status === "talking" || status === "listening") && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className={`absolute w-20 h-20 rounded-full ${
                        status === "talking" ? "bg-indigo-600/30" : "bg-emerald-500/30"
                      }`}
                    />
                  )}
                </AnimatePresence>

                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg relative z-10 transition-all duration-300 ${
                    status === "talking"
                      ? "border-indigo-600 bg-indigo-600/10 text-indigo-600"
                      : status === "listening"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-base-350 bg-base-100 text-base-content/40"
                  }`}
                >
                  {status === "talking" ? (
                    <Volume2 className="w-7 h-7" />
                  ) : status === "listening" ? (
                    <Mic className="w-7 h-7" />
                  ) : (
                    <MicOff className="w-7 h-7" />
                  )}
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-base-content/40">
                  {status === "connecting"
                    ? "Establishing connection..."
                    : status === "ready"
                    ? "Agent ready..."
                    : status === "talking"
                    ? "Tutor is speaking..."
                    : status === "listening"
                    ? "Listening to you..."
                    : "Connecting..."}
                </span>
                <h4 className="font-extrabold text-xs text-base-content mt-1">
                  {moduleTitle}
                </h4>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-error/10 text-error text-[10px] font-bold p-3 rounded-xl border border-error/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Live Transcripts */}
            <div className="space-y-4 max-h-48 overflow-y-auto bg-base-100 p-4 border border-base-300 rounded-2xl">
              {/* Agent Bubble */}
              {agentTranscript && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-600">AI Tutor</span>
                  <div className="bg-indigo-600/5 border border-indigo-600/15 p-3 rounded-xl text-xs font-semibold text-base-content leading-relaxed">
                    {agentTranscript}
                  </div>
                </div>
              )}

              {/* User Bubble */}
              {userTranscript && (
                <div className="space-y-1 text-right">
                  <span className="text-[9px] uppercase font-bold text-emerald-500">You (Speaking)</span>
                  <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-xl text-xs font-semibold text-base-content leading-relaxed text-right inline-block max-w-sm">
                    {userTranscript}
                  </div>
                </div>
              )}

              {!agentTranscript && !userTranscript && (
                <div className="text-center py-6 text-[10px] text-base-content/40 italic">
                  Say &quot;Hello&quot; or ask a question to begin the tutoring session.
                </div>
              )}
            </div>

            {/* Controls */}
            <button
              onClick={handleStop}
              className="btn btn-error text-white border-none btn-block rounded-xl font-bold h-12 flex items-center justify-center gap-1.5 shadow-lg shadow-error/10"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Tutor Session
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
