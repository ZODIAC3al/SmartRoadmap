"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Editor from "@monaco-editor/react";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type Challenge = {
  _id: string;
  moduleId: string;
  title: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  starterCode: Record<string, string>;
  passed: boolean;
};

export default function PracticePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Playground workspace state
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("// Select a challenge to begin, or practice writing code here.");
  const [runStdin, setRunStdin] = useState<string>("");
  const [execResult, setExecResult] = useState<{ stdout: string; stderr: string; code: number } | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedUser = getCachedUser();
    const token = hasSession();
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(storedUser);

    async function loadChallenges() {
      try {
        const res = await apiFetch("/coding-challenges");
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.data || []);
        }
      } catch (e) {
        console.error("Failed to load challenges");
      } finally {
        setLoading(false);
      }
    }
    loadChallenges();
  }, []);

  // Fetch or restore draft when selected challenge or language changes
  useEffect(() => {
    if (!mounted) return;
    
    async function restoreDraft() {
      const challengeId = selectedChallenge ? selectedChallenge._id : "null";
      try {
        const res = await apiFetch(`/code-drafts?challengeId=${challengeId}`);
        if (res.ok) {
          const draftData = await res.json();
          if (draftData.data && draftData.data.code) {
            setCode(draftData.data.code);
            setLanguage(draftData.data.language);
            return;
          }
        }
      } catch (e) {}

      // Fallback to starter code or default placeholder
      if (selectedChallenge) {
        const starter = selectedChallenge.starterCode?.[language] || 
                        selectedChallenge.starterCode?.["javascript"] || "";
        setCode(starter);
      } else {
        setCode(language === "python" 
          ? "# Write your freeform python practice code here\nprint('Hello, Python!')"
          : "// Write your freeform javascript practice code here\nconsole.log('Hello, JS!');"
        );
      }
    }
    restoreDraft();
  }, [selectedChallenge, language, mounted]);

  // Debounced auto-save draft helper
  const saveDraftTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);

    saveDraftTimeout.current = setTimeout(async () => {
      const challengeId = selectedChallenge ? selectedChallenge._id : null;
      try {
        await apiFetch("/code-drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            language,
            code: newCode,
            title: challengeId ? null : "scratchpad",
          }),
        });
      } catch (e) {}
    }, 2000); // 2s debounce
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setExecResult(null);
    setTestResults([]);
    try {
      const res = await apiFetch("/code-execution/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin: runStdin,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExecResult(data.data);
        toast.success("Code executed successfully!");
      }
    } catch (e) {
      toast.error("Execution failed.");
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedChallenge) return;
    setExecuting(true);
    setExecResult(null);
    setTestResults([]);
    try {
      const res = await apiFetch(`/coding-challenges/${selectedChallenge._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const submission = data.data;
        setTestResults(submission.results || []);

        const allPassed = submission.status === "completed";
        if (allPassed) {
          toast.success("All tests passed! Challenge completed! 🎉");
          // Refresh challenges list
          setChallenges(
            challenges.map((c) => (c._id === selectedChallenge._id ? { ...c, passed: true } : c))
          );
        } else {
          toast.error("Some test cases failed. Keep debugging!");
        }
      }
    } catch (e) {
      toast.error("Submission failed.");
    } finally {
      setExecuting(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center text-start">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Sandbox workspace</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Practice Arena</h1>
          </div>
          <div className="flex gap-2">
            <select
              className="select select-bordered select-sm bg-white font-bold text-xs"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            {selectedChallenge && (
              <button
                onClick={() => { setSelectedChallenge(null); setTestResults([]); }}
                className="btn btn-outline border-slate-200 btn-sm rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Clear Challenge selection
              </button>
            )}
          </div>
        </div>

        {/* Practice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Challenge List or Prompt Details */}
          <div className="lg:col-span-4 space-y-6">
            
            {selectedChallenge ? (
              // Prompt panel
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Challenge Prompt
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {selectedChallenge.difficulty}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{selectedChallenge.title}</h3>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs leading-relaxed text-slate-600">
                  <pre className="font-sans whitespace-pre-wrap">{selectedChallenge.prompt}</pre>
                </div>
              </div>
            ) : (
              // Selection panel
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Browse Challenges</h3>
                <div className="space-y-3">
                  {challenges.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedChallenge(c)}
                      className="border border-slate-100 rounded-xl p-3.5 hover:shadow-md cursor-pointer bg-slate-50 hover:bg-white transition-all flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs">{c.title}</h4>
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.difficulty}
                        </span>
                      </div>
                      {c.passed ? (
                        <span className="text-emerald-600 font-bold text-xs">✓ Done</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Play →</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sandbox input */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Execution Stdin</h3>
              <textarea
                placeholder="Optionally write standard input here..."
                className="textarea textarea-bordered w-full bg-white border-slate-200 text-slate-800 rounded-xl text-xs h-20"
                value={runStdin}
                onChange={(e) => setRunStdin(e.target.value)}
              />
            </div>

          </div>

          {/* RIGHT COLUMN: Monaco editor & Output */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Editor Canvas */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-lg">
              <Editor
                height="400px"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => handleCodeChange(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                }}
              />

              <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={executing}
                  className="btn btn-outline border-slate-700 text-slate-300 hover:bg-slate-800 btn-sm rounded-xl font-bold text-xs"
                >
                  {executing ? "Running..." : "Run Code"}
                </button>
                {selectedChallenge && (
                  <button
                    onClick={handleSubmitCode}
                    disabled={executing}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-sm rounded-xl font-bold text-xs"
                  >
                    Submit Challenge
                  </button>
                )}
              </div>
            </div>

            {/* Test Results list */}
            {testResults.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Evaluation Results</h3>
                <div className="space-y-2">
                  {testResults.map((tc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className={tc.passed ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                          {tc.passed ? "✓" : "✗"}
                        </span>
                        <span className="font-bold text-slate-700">Test Case {idx + 1}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {tc.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run Output Display */}
            {execResult && (
              <div className="bg-[#0f172a] text-[#38bdf8] border border-slate-800 rounded-2xl p-6 shadow-md text-start space-y-2 font-mono text-xs">
                <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-2">Stdout output</h3>
                {execResult.stdout ? (
                  <pre className="whitespace-pre-wrap">{execResult.stdout}</pre>
                ) : (
                  <span className="text-slate-500 italic">No output logged.</span>
                )}
                {execResult.stderr && (
                  <div className="text-red-400 border-t border-red-950 pt-2 mt-2">
                    <h3 className="font-bold uppercase tracking-widest text-[9px] mb-1">Stderr output</h3>
                    <pre className="whitespace-pre-wrap">{execResult.stderr}</pre>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
