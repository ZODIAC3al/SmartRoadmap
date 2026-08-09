"use client";

import React, { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InterviewReportPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await apiJson<any>(`/interview/session/${params.sessionId}/report`, { method: "GET" });
        if (res.status === 'pending') {
          // Keep polling every 3 seconds if we got here early
          setTimeout(fetchReport, 3000);
        } else if (res.status === 'ready') {
          setReport(res.report);
          setLoading(false);
        } else if (res.overallScore !== undefined) {
          // Direct report object from old backend logic fallback
          setReport(res);
          setLoading(false);
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to load report");
        setLoading(false);
      }
    };
    fetchReport();
  }, [params.sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <h2 className="text-xl font-bold">Loading your interview report...</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="alert alert-error">Report not found or could not be loaded.</div>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 my-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Interview Performance Report</h1>
        <Link href="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>

      <div className="bg-base-200 p-6 rounded-xl shadow-sm space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-success mb-2">Strengths</h3>
          {report.strengths?.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {report.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-base-content/60">No distinct strengths identified.</p>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-error mb-2">Areas for Improvement</h3>
          {report.weaknesses?.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {report.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-base-content/60">No distinct weaknesses identified.</p>
          )}
        </div>
      </div>

      {report.recommendations?.length > 0 && (
        <div className="bg-info/10 p-6 rounded-xl border border-info/20">
          <h3 className="font-semibold text-lg text-info mb-3">AI Recommendations</h3>
          <ul className="list-disc list-inside space-y-2">
            {report.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Question Breakdown</h2>
        {report.questionFeedback?.map((q: any, i: number) => (
          <div key={i} className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-semibold text-lg flex-1">Q{i + 1}: {q.questionText}</h3>
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg">
              <span className="font-semibold text-sm text-base-content/70 uppercase tracking-wider">Your Answer:</span>
              <p className="mt-1">{q.answer || <span className="italic text-base-content/50">Skipped or no answer provided.</span>}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-semibold text-sm text-base-content/70 uppercase tracking-wider">Feedback:</span>
                <p className="text-sm">{q.feedback}</p>
              </div>
              <div className="space-y-2">
                <span className="font-semibold text-sm text-success uppercase tracking-wider">Ideal Answer:</span>
                <p className="text-sm">{q.idealAnswer}</p>
              </div>
            </div>
            
            {q.improvementTips && (
              <div className="bg-warning/10 p-3 rounded-md mt-2">
                <span className="font-semibold text-sm text-warning-content uppercase tracking-wider">Tips:</span>
                <p className="text-sm mt-1">{q.improvementTips}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
