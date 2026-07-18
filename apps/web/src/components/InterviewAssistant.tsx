// apps/web/src/components/InterviewAssistant.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiJson } from "@/lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export enum InterviewType {
  Technical = "technical",
  Behavioral = "behavioral",
  Mixed = "mixed",
}
export enum InterviewDifficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
  Adaptive = "adaptive",
}
export enum InterviewLanguage {
  EN = "en",
  AR = "ar",
  Mixed = "mixed",
}
export enum InterviewMode {
  Text = "text",
  Voice = "voice",
}

interface InterviewConfig {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: number;
  language: InterviewLanguage;
  mode: InterviewMode;
}

interface Question {
  id: string;
  text: string;
}

export default function InterviewAssistant({ roadmapId }: { roadmapId?: string }) {
  const router = useRouter();
  const [config, setConfig] = useState<InterviewConfig>({
    type: InterviewType.Technical,
    difficulty: InterviewDifficulty.Medium,
    durationMinutes: 15,
    language: InterviewLanguage.EN,
    mode: InterviewMode.Text,
  });
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const answerRef = useRef(""); 
  const [questionIndex, setQuestionIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttempts = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any | null>(null);
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      synthRef.current?.cancel();
      timerRef.current && clearInterval(timerRef.current);
      pollingRef.current && clearTimeout(pollingRef.current);
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
      feedbackTimeoutRef.current && clearTimeout(feedbackTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    const totalSec = config.durationMinutes * 60;
    setTimeLeft(totalSec);
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const speakText = (text: string, callback?: () => void) => {
    if (!synthRef.current || config.mode !== InterviewMode.Voice) {
      if (callback) callback();
      return;
    }
    synthRef.current.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language === InterviewLanguage.AR ? "ar-SA" : "en-US";
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    synthRef.current.speak(utterance);
  };

  const initSpeechRecognition = () => {
    if (recognitionRef.current) return;
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = config.language === InterviewLanguage.AR ? "ar-SA" : "en-US";
      
      recognitionRef.current.onresult = (event: any) => {
        if (paused || isSubmitting || isSpeaking) return;

        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setAnswer((prev) => {
            const next = prev + (prev ? " " : "") + finalTranscript.trim();
            answerRef.current = next;
            return next;
          });
        }

        // Auto-submit silence detection (3s)
        silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && answerRef.current.trim().length > 0) {
            submitAnswer(false, answerRef.current);
          }
        }, 3000); 
      };
      
      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please switch to Text mode.");
          setConfig(prev => ({ ...prev, mode: InterviewMode.Text }));
          setIsRecording(false);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  };

  const toggleRecording = (forceState?: boolean) => {
    if (!recognitionRef.current || isSpeaking) return;
    const newState = forceState !== undefined ? forceState : !isRecording;
    
    if (newState) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        // usually already started error
      }
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
    }
  };

  const handleStart = async () => {
    try {
      const payload = { ...config, roadmapId };
      const res = await apiJson<any>("/interview/session/start", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSessionId(res.sessionId);
      setQuestion(res.question);
      setQuestionIndex(1);
      startTimer();
      toast.success("Interview started!");
      
      if (config.mode === InterviewMode.Voice) {
        initSpeechRecognition();
        speakText(res.question.text, () => {
          toggleRecording(true);
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start interview");
    }
  };

  const submitAnswer = async (skipped = false, currentAnswerValue?: string) => {
    if (!sessionId || isSubmitting) return;
    
    const finalAnswer = currentAnswerValue !== undefined ? currentAnswerValue : answer;
    
    // Stop recording and clear silence timer
    if (isRecording) toggleRecording(false);
    silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
    
    setIsSubmitting(true);
    const startTime = Date.now();
    try {
      const payload = {
        answer: finalAnswer.trim() || "",
        timeTaken: Math.round((Date.now() - startTime) / 1000),
        skipped,
      };
      const res = await apiJson<any>(`/interview/session/${sessionId}/answer`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setAnswer("");
      answerRef.current = "";

      if (res.finished) {
        setQuestion(null);
        await fetchReport(sessionId);
      } else {
        setFeedbackData({
          score: res.score,
          correctness: res.correctness,
          feedback: res.feedback,
          improvementTips: res.improvementTips,
          idealAnswer: res.idealAnswer,
        });
        
        if (config.mode === InterviewMode.Voice) {
          // Speak feedback then move to next question
          const feedbackMsg = `Feedback: ${res.feedback} ${res.improvementTips || ''}. Next question: ${res.nextQuestion.text}`;
          speakText(feedbackMsg, () => {
            setFeedbackData(null);
            setQuestion(res.nextQuestion);
            setQuestionIndex((i) => i + 1);
            toggleRecording(true);
          });
        } else {
          // Text mode: wait 5s to read feedback
          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedbackData(null);
            setQuestion(res.nextQuestion);
            setQuestionIndex((i) => i + 1);
          }, 5000);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to submit answer");
      if (config.mode === InterviewMode.Voice) toggleRecording(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchReport = async (sid: string) => {
    setIsGeneratingReport(true);
    pollingAttempts.current += 1;

    try {
      const res = await apiJson<any>(`/interview/session/${sid}/report`, { method: "GET" });
      
      if (res.status === 'error') {
        toast.error(res.message || "Report generation failed.");
        setIsGeneratingReport(false);
        router.push("/dashboard");
        return;
      }

      if (res.status === 'pending') {
        if (pollingAttempts.current > 15) { // 45 seconds max
          toast.error("Report generation timed out. Please check history later.");
          setIsGeneratingReport(false);
          router.push("/dashboard");
          return;
        }
        pollingRef.current = setTimeout(() => fetchReport(sid), 3000);
      } else {
        toast.success("Interview report ready!");
        router.push(`/mock-interview/report/${sid}`);
      }
    } catch (e: any) {
      if (pollingAttempts.current > 3) {
        toast.error(e.message || "Failed to fetch report");
        setIsGeneratingReport(false);
        router.push("/dashboard");
      } else {
        // Retry a few times on pure network errors
        pollingRef.current = setTimeout(() => fetchReport(sid), 3000);
      }
    }
  };

  const handlePause = async () => {
    if (!sessionId) return;
    try {
      await apiJson<any>(`/interview/session/${sessionId}/pause`, { method: "POST" });
      setPaused(true);
      timerRef.current && clearInterval(timerRef.current);
      if (isRecording) toggleRecording(false);
      synthRef.current?.cancel();
      toast.info("Interview paused");
    } catch (e: any) {
      toast.error(e.message || "Pause failed");
    }
  };

  const handleResume = async () => {
    if (!sessionId) return;
    try {
      await apiJson<any>(`/interview/session/${sessionId}/resume`, { method: "POST" });
      setPaused(false);
      startTimer();
      toast.info("Interview resumed");
      if (config.mode === InterviewMode.Voice && !feedbackData) {
        speakText(question?.text || "", () => toggleRecording(true));
      }
    } catch (e: any) {
      toast.error(e.message || "Resume failed");
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      setIsGeneratingReport(true);
      synthRef.current?.cancel();
      if (isRecording) toggleRecording(false);
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
      feedbackTimeoutRef.current && clearTimeout(feedbackTimeoutRef.current);
      
      await apiJson<any>(`/interview/session/${sessionId}/end`, { method: "POST" });
      timerRef.current && clearInterval(timerRef.current);
      setQuestion(null);
      pollingAttempts.current = 0; // reset
      await fetchReport(sessionId);
    } catch (e: any) {
      toast.error(e.message || "Failed to end session");
      setIsGeneratingReport(false);
    }
  };

  if (isGeneratingReport) {
    return (
      <div className="p-10 bg-base-200 rounded-xl shadow-lg my-8 flex flex-col items-center justify-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <h2 className="text-xl font-bold">Evaluating your performance...</h2>
        <p className="text-base-content/60">Please wait while we generate your detailed interview report.</p>
      </div>
    );
  }

  // --- UI Render ---

  // Voice Mode UI
  if (sessionId && config.mode === InterviewMode.Voice) {
    return (
      <div className="p-6 bg-base-200 rounded-xl shadow-lg my-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full flex items-center justify-between mb-8">
          <div className="badge badge-primary badge-outline">Voice Session: Q{questionIndex}</div>
          <div className="font-mono text-sm font-semibold">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        {/* Dynamic visualizer representation */}
        <div className="flex flex-col items-center justify-center flex-1 space-y-8 w-full max-w-lg text-center">
          
          <div className="relative flex items-center justify-center w-32 h-32">
            {isSpeaking && (
               <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            )}
            {isRecording && (
               <div className="absolute inset-0 rounded-full bg-success/20 animate-ping"></div>
            )}
            {isSubmitting && (
               <div className="absolute inset-0 rounded-full border-4 border-t-primary border-base-300 animate-spin"></div>
            )}
            
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl transition-colors duration-500
              ${isSpeaking ? 'bg-primary text-primary-content' : 
                isRecording ? 'bg-success text-success-content' : 
                isSubmitting ? 'bg-base-300' : 'bg-base-300'}`}>
              {isSpeaking ? '🔊' : isRecording ? '🎤' : isSubmitting ? '⏳' : '⏸'}
            </div>
          </div>

          <div className="h-24">
            {isSpeaking ? (
              <p className="text-xl font-semibold text-primary animate-fade-in">AI is speaking...</p>
            ) : isRecording ? (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xl font-semibold text-success">Listening...</p>
                {answer && <p className="text-sm italic opacity-70">"{answer}"</p>}
              </div>
            ) : isSubmitting ? (
              <p className="text-xl font-semibold opacity-70 animate-fade-in">Evaluating your answer...</p>
            ) : paused ? (
              <p className="text-xl font-semibold text-warning animate-fade-in">Session Paused</p>
            ) : null}
          </div>

          {/* Hidden text data for accessibility/verification */}
          <div className="sr-only">
             <p>Question: {question?.text}</p>
             <p>Feedback: {feedbackData?.feedback}</p>
          </div>
        </div>

        <div className="flex gap-4 w-full mt-8">
          {paused ? (
            <button className="btn btn-warning flex-1" onClick={handleResume}>Resume</button>
          ) : (
            <button className="btn btn-warning flex-1" onClick={handlePause} disabled={isSubmitting}>Pause</button>
          )}
          <button className="btn btn-error flex-1" onClick={handleEndSession} disabled={isSubmitting}>
            End Interview
          </button>
        </div>
      </div>
    );
  }

  // Pre-Start Configuration UI
  if (!sessionId) {
    return (
      <div className="p-6 bg-base-200 rounded-xl shadow-lg my-8">
        <h2 className="text-xl font-bold mb-4 text-primary">AI Mock Interview Assistant</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="flex flex-col">
            <span className="font-medium mb-1">Interview Type</span>
            <select
              className="select select-bordered w-full"
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as InterviewType })}
            >
              {Object.values(InterviewType).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="font-medium mb-1">Difficulty</span>
            <select
              className="select select-bordered w-full"
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value as InterviewDifficulty })}
            >
              {Object.values(InterviewDifficulty).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="font-medium mb-1">Duration (minutes)</span>
            <input
              type="number"
              min={1}
              max={180}
              className="input input-bordered w-full"
              value={config.durationMinutes}
              onChange={(e) => setConfig({ ...config, durationMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col">
            <span className="font-medium mb-1">Language</span>
            <select
              className="select select-bordered w-full"
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value as InterviewLanguage })}
            >
              {Object.values(InterviewLanguage).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col col-span-2">
            <span className="font-medium mb-1">Mode</span>
            <select
              className="select select-bordered w-full"
              value={config.mode}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as InterviewMode })}
            >
              {Object.values(InterviewMode).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          
          {config.mode === InterviewMode.Voice && (
            <div className="col-span-2 alert alert-info text-sm shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Voice Mode is a hands-free conversational experience. Ensure your microphone and speakers are active.</span>
            </div>
          )}
          
          <button className="btn btn-primary col-span-2 mt-4" onClick={handleStart}>
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  // Text Mode UI
  return (
    <div className="p-6 bg-base-200 rounded-xl shadow-lg my-8">
      <h2 className="text-xl font-bold mb-4 text-primary">AI Mock Interview Assistant</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="badge badge-primary badge-outline">Question {questionIndex}</div>
          <div className="font-mono text-sm font-semibold">
            Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <div className="p-4 bg-base-100 rounded-lg shadow-sm border border-base-300">
          <p className="text-lg font-medium">{question?.text}</p>
        </div>

        {feedbackData ? (
           <div className="space-y-4 animate-fade-in mt-4">
             <div className="alert alert-info shadow-sm">
               <div>
                 <h3 className="font-bold">AI Feedback</h3>
                 <div className="text-sm">Processing next question...</div>
               </div>
             </div>
             
             <div className="p-4 bg-base-100 rounded-lg shadow-sm space-y-3 border border-base-300">
                <div className="flex justify-end items-center">
                  <span className={`badge ${feedbackData.correctness === 'correct' ? 'badge-success' : feedbackData.correctness === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                    {feedbackData.correctness}
                  </span>
                </div>
               <div>
                 <p className="text-sm font-semibold text-base-content/70">Feedback:</p>
                 <p>{feedbackData.feedback}</p>
               </div>
               {feedbackData.improvementTips && (
                 <div className="bg-warning/10 p-3 rounded-md">
                   <p className="text-sm font-semibold text-warning-content mb-1">Tips for improvement:</p>
                   <p className="text-sm">{feedbackData.improvementTips}</p>
                 </div>
               )}
             </div>
           </div>
        ) : (
           <div className="relative mt-4">
             <textarea
               className="textarea textarea-bordered w-full min-h-[160px] text-base"
               placeholder="Type your answer..."
               value={answer}
               onChange={(e) => {
                 setAnswer(e.target.value);
                 answerRef.current = e.target.value;
               }}
               disabled={paused || isSubmitting}
             />
           </div>
        )}

        {!feedbackData && (
          <div className="flex gap-2">
            <button
              className="btn btn-success flex-1"
              onClick={() => submitAnswer(false, answerRef.current)}
              disabled={paused || isSubmitting || !answer.trim()}
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : "Submit Answer"}
            </button>
            <button className="btn btn-outline flex-1" onClick={() => submitAnswer(true, "")} disabled={paused || isSubmitting}>
              Skip
            </button>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-base-300">
          {paused ? (
            <button className="btn btn-warning flex-1" onClick={handleResume}>Resume</button>
          ) : (
            <button className="btn btn-warning flex-1" onClick={handlePause} disabled={isSubmitting}>Pause</button>
          )}
          <button className="btn btn-error flex-1" onClick={handleEndSession} disabled={isSubmitting}>
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
}
