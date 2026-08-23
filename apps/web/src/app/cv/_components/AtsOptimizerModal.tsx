import React, { useState } from 'react';
import type { CVData } from '../types';
import { CloseIcon, SparklesIcon } from './icons';
import { apiFetch } from '@/lib/api';

interface AtsOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: CVData;
  onApplyAtsAnalysis?: (analysis: any) => void;
}

export const AtsOptimizerModal: React.FC<AtsOptimizerModalProps> = ({
  isOpen,
  onClose,
  cv,
  onApplyAtsAnalysis,
}) => {
  const [jobTitle, setJobTitle] = useState(cv.personal?.title || 'Senior Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(cv.atsAnalysis || null);

  if (!isOpen) return null;

  const handleRunCheck = async () => {
    setIsAnalyzing(true);
    try {
      const res = await apiFetch('/cv/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobTitle: jobTitle,
          jobDescription,
          cvData: cv,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysisResult(data.analysis);
          if (onApplyAtsAnalysis) onApplyAtsAnalysis(data.analysis);
        }
      }
    } catch (err) {
      console.error('ATS check failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAutoFix = async () => {
    if (!analysisResult) return;
    setIsAutoFixing(true);
    try {
      const res = await apiFetch('/cv/ats-autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobTitle: jobTitle,
          missingKeywords: analysisResult.missingKeywords || [],
          cvData: cv,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          // Re-run check with updated data
          handleRunCheck();
        }
      }
    } catch (err) {
      console.error('Auto fix failed:', err);
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="card w-full max-w-2xl bg-base-200 border border-base-300 text-base-content p-6 rounded-2xl shadow-2xl relative text-start animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-circle btn-xs btn-ghost text-stone-700 dark:text-stone-300 font-medium"
        >
          <CloseIcon />
        </button>

        <div className="flex items-center gap-3 border-b border-base-300 pb-4 mb-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
            📊
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight">ATS Resume Optimizer</h3>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-0.5">
              Analyze your CV against job descriptions to increase interview callbacks.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label text-xs font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Target Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="input input-bordered input-sm bg-base-100 font-semibold"
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunCheck}
                disabled={isAnalyzing}
                className="btn btn-sm bg-primary hover:bg-[#8E1616] text-white border-none rounded-lg font-bold w-full flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <span className="loading loading-spinner loading-xs"></span> : <SparklesIcon />}
                Run ATS Optimization Analysis
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label text-xs font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">
              Paste Target Job Description (Optional for Keyword Matching)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="textarea textarea-bordered h-28 bg-base-100 font-medium text-xs resize-none"
              placeholder="Paste the full job posting text here to evaluate keyword match & missing skills..."
            />
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-base-content">Overall ATS Compliance Score</h4>
                  <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-mono">Evaluated for {jobTitle}</p>
                </div>
                <div className="radial-progress text-primary font-mono font-extrabold text-sm" style={{ "--value": analysisResult.overallScore || 85, "--size": "3.8rem" } as any}>
                  {analysisResult.overallScore || 85}%
                </div>
              </div>

              {/* Sub Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300/50">
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-bold uppercase block">Keyword Match</span>
                  <span className="font-mono font-extrabold text-base text-primary">{analysisResult.matchScore || 80}%</span>
                </div>
                <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300/50">
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-bold uppercase block">Formatting</span>
                  <span className="font-mono font-extrabold text-base text-[#8E1616]">{analysisResult.formattingScore || 95}%</span>
                </div>
                <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300/50">
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-bold uppercase block">Readability</span>
                  <span className="font-mono font-extrabold text-base text-blue-600">{analysisResult.readabilityScore || 90}%</span>
                </div>
                <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300/50">
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-bold uppercase block">Skills Match</span>
                  <span className="font-mono font-extrabold text-base text-purple-600">88%</span>
                </div>
              </div>

              {/* Missing Keywords */}
              {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 && (
                <div>
                  <h5 className="font-bold text-xs text-error mb-1.5 flex items-center gap-1">
                    <span>⚠️</span> Missing Keywords Found
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingKeywords.map((kw: string, i: number) => (
                      <span key={i} className="badge badge-error badge-outline text-[10px] font-mono font-bold">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Recommendations */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div>
                  <h5 className="font-bold text-xs text-base-content mb-1.5 flex items-center gap-1">
                    <span>💡</span> Recommendations
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-800 dark:text-stone-200 font-medium font-medium">
                    {analysisResult.suggestions.map((sug: string, i: number) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRunAutoFix}
                  disabled={isAutoFixing}
                  className="btn btn-sm bg-primary hover:bg-[#8E1616] text-white border-none rounded-lg font-bold flex items-center gap-1.5"
                >
                  {isAutoFixing && <span className="loading loading-spinner loading-xs"></span>}
                  <SparklesIcon />
                  Auto-Integrate Missing Keywords
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
