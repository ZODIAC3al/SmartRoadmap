"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser } from "@/lib/api";

type QuestionPayload = {
  sessionId: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  question: string;
  options: string[];
  difficulty: "easy" | "medium" | "hard";
  nextQuestionPayload?: {
    currentQuestionIndex: number;
    question: string;
    options: string[];
    difficulty: "easy" | "medium" | "hard";
  };
};

type ResultPayload = {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
};

// Built locally, question-by-question, strictly from the real answers the
// user submits in this session — never pre-filled or fabricated.
type AnsweredEntry = { index: number; correct: boolean };

const dict = {
  backToRoadmap: { en: "BACK TO ROADMAP", ar: "العودة لخارطة الطريق" },
  question: { en: "Question", ar: "سؤال" },
  of: { en: "of", ar: "من" },
  quickList: { en: "Quiz Questions", ar: "أسئلة الاختبار" },
  correct: { en: "Correct Answer", ar: "إجابة صحيحة" },
  incorrect: { en: "Incorrect Response", ar: "إجابة غير صحيحة" },
  next: { en: "Next Question", ar: "السؤال التالي" },
  viewResults: { en: "View Results", ar: "عرض النتائج" },
  loadError: { en: "Quiz Load Error", ar: "خطأ في تحميل الاختبار" },
  loadErrorBody: {
    en: "Unable to generate assessment questions. Please confirm your database connection is active.",
    ar: "تعذّر توليد أسئلة التقييم. يرجى التأكد من اتصال قاعدة البيانات.",
  },
  backBtn: { en: "Back to Roadmap", ar: "العودة لخارطة الطريق" },
  passed: { en: "Milestone Verified!", ar: "تم التحقق من الإنجاز!" },
  passedBody: {
    en: "Excellent work! You have verified mastery of this module. The next dependent modules on your syllabus timeline are now unlocked.",
    ar: "عمل ممتاز! لقد أثبتّ إتقانك لهذه الوحدة. تم فتح الوحدات التالية في مسارك الدراسي.",
  },
  failed: { en: "Verification Failed", ar: "فشل التحقق" },
  failedBody: {
    en: "You answered {correct} of {total} correctly. You need at least 70% to prove mastery. Review the resources and try again!",
    ar: "أجبت على {correct} من {total} بشكل صحيح. تحتاج إلى 70% على الأقل لإثبات الإتقان. راجع المصادر وحاول مجدداً!",
  },
  returnRoadmap: { en: "Return to Roadmap", ar: "العودة لخارطة الطريق" },
};
type DictKey = keyof typeof dict;

export default function QuizPage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = params;
  const { locale } = useApp();
  const isAr = locale === "ar";
  const tr = (key: DictKey, vars?: Record<string, string>) => {
    let s = dict[key][isAr ? "ar" : "en"];
    if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.replace(`{${k}}`, v)));
    return s;
  };
  const prefersReducedMotion = useReducedMotion();

  const [session, setSession] = useState<QuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [results, setResults] = useState<ResultPayload | null>(null);
  const [answeredHistory, setAnsweredHistory] = useState<AnsweredEntry[]>([]);

  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState<string>("Assessment");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedUser = getCachedUser();

    async function initQuiz() {
      try {
        const roadmapRes = await apiFetch("/roadmap/me");
        let moduleTopic = "General Foundations";
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          const activeModule = roadmapData.modules.find((m: any) => m.id === moduleId);
          if (activeModule) {
            setModuleTitle(activeModule.title);
            moduleTopic = activeModule.title;
          }
        }

        const sessionRes = await apiFetch("/assessment/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId, topic: moduleTopic }),
        });

        if (!sessionRes.ok) throw new Error("Failed to start quiz");
        const sessionData = await sessionRes.json();
        setSession(sessionData);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    initQuiz();
  }, [moduleId]);

  useEffect(() => {
    if (session && !answerSubmitted && !isFinished) {
      setTimer(30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            autoSubmitTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, answerSubmitted, isFinished]);

  const autoSubmitTimeout = () => handleSubmitAnswer("Times Up (No Answer)");

  const handleSubmitAnswer = async (answerText: string) => {
    if (answerSubmitted || !session) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(answerText);
    setAnswerSubmitted(true);

    try {
      const response = await apiFetch(`/assessment/session/${session.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText, timeTaken: 30 - timer }),
      });

      if (!response.ok) throw new Error("Answer submission failed");
      const data = await response.json();

      setIsCorrect(data.correct);
      setExplanation(data.explanation);
      setAnsweredHistory((prev) => [...prev, { index: session.currentQuestionIndex, correct: !!data.correct }]);

      if (data.isFinished) {
        setIsFinished(true);
        setResults(data.results);
      } else {
        setSession((prev: any) => ({ ...prev, nextQuestionPayload: data.nextQuestion }));
      }
    } catch (err) {
      alert("Network error submitting answer.");
      setAnswerSubmitted(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session || !session.nextQuestionPayload) return;
    setSession({
      sessionId: session.sessionId,
      totalQuestions: session.totalQuestions,
      currentQuestionIndex: session.nextQuestionPayload.currentQuestionIndex,
      question: session.nextQuestionPayload.question,
      options: session.nextQuestionPayload.options,
      difficulty: session.nextQuestionPayload.difficulty,
    });
    setSelectedAnswer("");
    setAnswerSubmitted(false);
    setIsCorrect(false);
    setExplanation("");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-100 items-center justify-center p-4 gap-6">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col min-h-screen bg-base-100 items-center justify-center p-4 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center text-2xl">
          <i className="lni lni-warning" />
        </div>
        <h2 className="text-2xl font-bold">{tr("loadError")}</h2>
        <p className="text-base-content/60 max-w-sm mb-2">{tr("loadErrorBody")}</p>
        <Link href="/roadmap" className="btn btn-primary gap-2">
          <i className={isAr ? "lni lni-arrow-right" : "lni lni-arrow-left"} /> {tr("backBtn")}
        </Link>
      </div>
    );
  }

  const timerData = [{ name: "timer", value: (timer / 30) * 100, fill: timer <= 10 ? "#ef4444" : "#6366f1" }];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col min-h-screen bg-base-100 text-base-content pb-12 px-4">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 pt-6">
          <Link href="/roadmap" className="text-xs text-indigo-600 hover:underline font-mono font-bold flex items-center gap-1.5 w-fit">
            <i className={isAr ? "lni lni-arrow-right" : "lni lni-arrow-left"} /> {tr("backToRoadmap")}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 truncate">{moduleTitle}</h1>
        </div>

        {!isFinished ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* MAIN QUESTION PANEL */}
            <motion.div
              key={session.currentQuestionIndex}
              initial={prefersReducedMotion ? undefined : { opacity: 0, x: isAr ? 16 : -16 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="md:col-span-8 card bg-base-200 border border-base-300 shadow-sm"
            >
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-6 text-xs font-mono text-base-content/50 border-b border-base-300 pb-3">
                  <span>
                    {tr("question")} {session.currentQuestionIndex + 1} {tr("of")} {session.totalQuestions}
                  </span>
                  <span className="badge badge-outline uppercase text-xs">{session.difficulty}</span>
                </div>

                <h2 className="text-lg font-bold mb-6">{session.question}</h2>

                <div className="space-y-3 mb-6">
                  {session.options.map((option) => {
                    const selected = selectedAnswer === option;
                    let btnStyle = "btn-outline border-base-300 text-start justify-start font-normal";
                    let icon: string | null = null;

                    if (answerSubmitted) {
                      if (selected) {
                        btnStyle = isCorrect ? "btn-success text-white" : "btn-error text-white";
                        icon = isCorrect ? "lni-checkmark-circle" : "lni-close";
                      } else {
                        btnStyle = "btn-ghost opacity-50";
                      }
                    } else {
                      btnStyle += " hover:border-indigo-500";
                    }

                    return (
                      <button
                        key={option}
                        disabled={answerSubmitted}
                        onClick={() => handleSubmitAnswer(option)}
                        className={`btn btn-block py-4 h-auto min-h-[3rem] justify-between ${btnStyle}`}
                      >
                        <span className="text-start flex-1">{option}</span>
                        {icon && <i className={`lni ${icon}`} />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {answerSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 border-t border-base-300 pt-6 overflow-hidden"
                    >
                      <div className={`card ${isCorrect ? "bg-success/10 border-success" : "bg-error/10 border-error"} border p-4`}>
                        <h4 className={`font-bold text-sm mb-1 flex items-center gap-1.5 ${isCorrect ? "text-success" : "text-error"}`}>
                          <i className={`lni ${isCorrect ? "lni-checkmark-circle" : "lni-close"}`} />
                          {isCorrect ? tr("correct") : tr("incorrect")}
                        </h4>
                        <p className="text-sm text-base-content/80">{explanation}</p>
                      </div>

                      <div className="card-actions justify-end">
                        {session.nextQuestionPayload ? (
                          <button onClick={handleNextQuestion} className="btn btn-primary px-8 gap-2">
                            {tr("next")} <i className={isAr ? "lni lni-arrow-left" : "lni lni-arrow-right"} />
                          </button>
                        ) : (
                          <button onClick={() => setIsFinished(true)} className="btn btn-success text-white px-8 gap-2">
                            <i className="lni lni-medal" /> {tr("viewResults")}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* RIGHT PANEL — countdown ring + live progress list */}
            <div className="md:col-span-4 space-y-4">
              <div className="card bg-base-200 border border-base-300 shadow-sm">
                <div className="card-body p-5 items-center">
                  <div className="relative w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="72%"
                        outerRadius="100%"
                        barSize={8}
                        data={timerData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={8} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-black font-mono ${timer <= 10 ? "text-error" : "text-indigo-600"}`}>
                        {timer}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300 shadow-sm">
                <div className="card-body p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-base-content/40 mb-3">
                    {tr("quickList")}
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: session.totalQuestions }).map((_, i) => {
                      const entry = answeredHistory.find((a) => a.index === i);
                      const isCurrent = i === session.currentQuestionIndex;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold ${isCurrent
                            ? "bg-indigo-600/10 text-indigo-600 border border-indigo-600/30"
                            : entry
                              ? entry.correct
                                ? "text-success"
                                : "text-error"
                              : "text-base-content/35"
                            }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isCurrent
                              ? "bg-indigo-600 text-white"
                              : entry
                                ? entry.correct
                                  ? "bg-success text-white"
                                  : "bg-error text-white"
                                : "bg-base-300"
                              }`}
                          >
                            {entry ? (
                              <i className={`lni ${entry.correct ? "lni-checkmark" : "lni-close"}`} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          {tr("question")} {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESULTS */
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
            className="card bg-base-200 border border-base-300 shadow-sm text-center max-w-2xl mx-auto"
          >
            <div className="card-body p-8 items-center">
              {results?.passed ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center text-3xl mb-4">
                    <i className="lni lni-checkmark-circle" />
                  </div>
                  <h2 className="text-2xl text-success font-bold mb-2">{tr("passed")}</h2>
                  <div className="text-5xl font-extrabold mb-4">{results.score}%</div>
                  <p className="text-sm text-base-content/70 max-w-sm mb-8 leading-relaxed">{tr("passedBody")}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-error/20 text-error flex items-center justify-center text-3xl mb-4">
                    <i className="lni lni-close" />
                  </div>
                  <h2 className="text-2xl text-error font-bold mb-2">{tr("failed")}</h2>
                  <div className="text-5xl font-extrabold mb-4">{results?.score}%</div>
                  <p className="text-sm text-base-content/70 max-w-sm mb-8 leading-relaxed">
                    {tr("failedBody", {
                      correct: String(results?.correctAnswers ?? 0),
                      total: String(results?.totalQuestions ?? 0),
                    })}
                  </p>
                </>
              )}
              <div className="card-actions w-full flex flex-col gap-2">
                <Link href="/roadmap" className="btn btn-primary btn-block gap-2">
                  <i className={isAr ? "lni lni-arrow-right" : "lni lni-arrow-left"} /> {tr("returnRoadmap")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}