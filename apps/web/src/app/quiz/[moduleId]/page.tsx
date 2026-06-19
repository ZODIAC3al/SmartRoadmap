'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type QuestionPayload = {
  sessionId: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  question: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  nextQuestionPayload?: {
    currentQuestionIndex: number;
    question: string;
    options: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

type ResultPayload = {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
};

export default function QuizPage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = params;
  
  // State variables
  const [session, setSession] = useState<QuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [results, setResults] = useState<ResultPayload | null>(null);
  
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState<string>('Assessment');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState('654321098765432109876543'); // Default fallback test ID

  // Fetch module title and start session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    let activeUserId = '654321098765432109876543';
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.id) {
          activeUserId = u.id;
          setUserId(u.id);
        }
      } catch (e) {}
    }

    async function initQuiz() {
      try {
        // 1. Fetch active roadmap to retrieve the specific module topic title
        const roadmapRes = await fetch(`http://localhost:3000/roadmap/user/${activeUserId}`);
        let moduleTopic = 'General Foundations';
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          const activeModule = roadmapData.modules.find((m: any) => m.id === moduleId);
          if (activeModule) {
            setModuleTitle(activeModule.title);
            moduleTopic = activeModule.title;
          }
        }

        // 2. Start dynamic quiz session
        const sessionRes = await fetch('http://localhost:3000/assessment/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUserId,
            moduleId,
            topic: moduleTopic,
          }),
        });

        if (!sessionRes.ok) throw new Error('Failed to start quiz');
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

  // Handle countdown clock ticking
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
  }, [session, answerSubmitted, isFinished]);

  // Submit response when countdown runs out
  const autoSubmitTimeout = () => {
    handleSubmitAnswer('Times Up (No Answer)');
  };

  const handleSubmitAnswer = async (answerText: string) => {
    if (answerSubmitted || !session) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(answerText);
    setAnswerSubmitted(true);

    try {
      const response = await fetch(`http://localhost:3000/assessment/session/${session.sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerText,
          timeTaken: 30 - timer,
        }),
      });

      if (!response.ok) throw new Error('Answer submission failed');
      const data = await response.json();

      setIsCorrect(data.correct);
      setExplanation(data.explanation);

      if (data.isFinished) {
        setIsFinished(true);
        setResults(data.results);
      } else {
        // Prepare next question trigger payload
        setSession((prev: any) => ({
          ...prev,
          nextQuestionPayload: data.nextQuestion,
        }));
      }
    } catch (err) {
      alert('Network error submitting answer.');
      setAnswerSubmitted(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session || !session.nextQuestionPayload) return;
    
    // Update session state to show the next question
    setSession({
      sessionId: session.sessionId,
      totalQuestions: session.totalQuestions,
      currentQuestionIndex: session.nextQuestionPayload.currentQuestionIndex,
      question: session.nextQuestionPayload.question,
      options: session.nextQuestionPayload.options,
      difficulty: session.nextQuestionPayload.difficulty,
    });

    setSelectedAnswer('');
    setAnswerSubmitted(false);
    setIsCorrect(false);
    setExplanation('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col min-h-screen bg-base-100 items-center justify-center p-4 text-center">
        <h2 className="text-display-md mb-2">Quiz Load Error</h2>
        <p className="text-base-content/70 max-w-sm mb-6">
          Unable to generate assessment questions. Please confirm your database connection is active.
        </p>
        <Link href="/roadmap" className="btn btn-primary">
          Back to Roadmap
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content pb-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Module Header */}
        <div className="mb-8">
          <Link href="/roadmap" className="text-caption text-primary hover:underline font-mono">
            ← BACK TO ROADMAP
          </Link>
          <h1 className="text-display-md font-bold mt-2 truncate">{moduleTitle}</h1>
        </div>

        {/* QUIZ FORM INTERFACE */}
        {!isFinished ? (
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-6">
              
              {/* Question Count Header */}
              <div className="flex justify-between items-center mb-6 text-caption font-mono text-base-content/60 border-b border-base-300 pb-3">
                <span>
                  Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                </span>
                <div className="flex gap-2">
                  <span className="badge badge-outline uppercase text-xs">{session.difficulty}</span>
                  <span className={`badge ${timer < 10 ? 'badge-error animate-pulse' : 'badge-primary'} font-mono`}>
                    ⏱ {timer}s
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg font-bold mb-6">{session.question}</h2>

              {/* MCQ Options Stack */}
              <div className="space-y-3 mb-6">
                {session.options.map((option) => {
                  const selected = selectedAnswer === option;
                  let btnStyle = 'btn-outline border-base-300 text-start justify-start font-normal';
                  
                  if (answerSubmitted) {
                    if (selected) {
                      btnStyle = isCorrect ? 'btn-success text-white' : 'btn-error text-white';
                    } else {
                      btnStyle = 'btn-ghost opacity-60';
                    }
                  } else {
                    btnStyle += ' hover:border-primary';
                  }

                  return (
                    <button
                      key={option}
                      disabled={answerSubmitted}
                      onClick={() => handleSubmitAnswer(option)}
                      className={`btn btn-block py-4 h-auto min-h-[3rem] ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Explanations & Next Question Drawer */}
              {answerSubmitted && (
                <div className="space-y-6 border-t border-base-300 pt-6">
                  <div className={`card ${isCorrect ? 'bg-success/10 border-success' : 'bg-error/10 border-error'} border p-4`}>
                    <h4 className={`font-bold text-body-sm mb-1 ${isCorrect ? 'text-success' : 'text-error'}`}>
                      {isCorrect ? '✓ Correct Answer' : '✗ Incorrect Response'}
                    </h4>
                    <p className="text-body-sm text-base-content/85">{explanation}</p>
                  </div>

                  <div className="card-actions justify-end">
                    {session.nextQuestionPayload ? (
                      <button onClick={handleNextQuestion} className="btn btn-primary px-8">
                        Next Question →
                      </button>
                    ) : (
                      <button onClick={() => setIsFinished(true)} className="btn btn-success text-white px-8">
                        View Results 🔮
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* RESULTS CARD VIEW */
          <div className="card bg-base-200 border border-base-300 shadow-sm text-center">
            <div className="card-body p-8 items-center">
              {results?.passed ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center text-3xl mb-4">
                    ✓
                  </div>
                  <h2 className="text-display-md text-success font-bold mb-2">Milestone Verified!</h2>
                  <div className="text-display-xl font-extrabold mb-4">{results.score}%</div>
                  <p className="text-body-sm text-base-content/70 max-w-sm mb-8 leading-relaxed">
                    Excellent work! You have verified mastery of this module. The next dependent modules on your syllabus timeline are now unlocked.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-error/20 text-error flex items-center justify-center text-3xl mb-4">
                    ✗
                  </div>
                  <h2 className="text-display-md text-error font-bold mb-2">Verification Failed</h2>
                  <div className="text-display-xl font-extrabold mb-4">{results?.score}%</div>
                  <p className="text-body-sm text-base-content/70 max-w-sm mb-8 leading-relaxed">
                    You answered {results?.correctAnswers} of {results?.totalQuestions} correctly. You need at least 70% to prove mastery. Review the resources and try again!
                  </p>
                </>
              )}

              <div className="card-actions w-full flex flex-col gap-2">
                <Link href="/roadmap" className="btn btn-primary btn-block">
                  Return to Roadmap
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
