"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiJson, fetchMe, getErrorMessage } from "@/lib/api";

interface Report {
  _id: string;
  contentType: "post" | "comment" | "resource" | "mentor_profile";
  contentId: string;
  reportedBy: {
    name: string;
    email: string;
  };
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolution?: string;
  createdAt: string;
}

type ResolutionStatus = "resolved" | "dismissed";

function isResolutionStatus(value: string): value is ResolutionStatus {
  return value === "resolved" || value === "dismissed";
}

export default function AdminContentPage() {
  const { locale } = useApp();
  const [loading, setLoading] = useState(true);

  // States
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>("resolved");
  const [resolutionText, setResolutionText] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      const data = await apiJson<Report[]>("/admin/reports");
      setReports(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load reports queue."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const me = await fetchMe();
      if (!me || me.role !== "admin") {
        window.location.href = "/admin";
        return;
      }
      await fetchReports();
    })();
  }, [fetchReports]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      await apiJson(`/admin/reports/${selectedReport._id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({
          status: resolutionStatus,
          resolution: resolutionText,
        }),
      });

      toast.success(locale === "en" ? "Report resolved successfully!" : "تمت معالجة البلاغ بنجاح!");
      setSelectedReport(null);
      setResolutionText("");
      fetchReports();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to resolve report."));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  const isRtl = locale === "ar";

  return (
    <div className={`sr-console min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="sr-shell max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Admin Header Banner */}
        <div className="sr-stage sr-signal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-3xl p-6 sm:p-8">
          <div>
            <span className="sr-kicker">
              {isRtl ? "إشراف ومراقبة المحتوى" : "MODERATION GATEWAY"}
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              {isRtl ? "مركز بلاغات وإشراف المحتوى" : "Reports & Decisions"}
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              {isRtl ? "مراجعة المشاريع والمقالات والمصادر التقنية المبلغ عنها وإزالتها لحفظ أمن المنصة." : "Audit flags filed against community posts, comment threads, resources, or mentor profiles."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/certificates"
              className="sr-button-secondary btn btn-xs sm:btn-sm"
            >
              {isRtl ? "مراجعة الشهادات" : "Certificates"}
            </Link>
            <Link
              href="/admin/users"
              className="sr-button-secondary btn btn-xs sm:btn-sm"
            >
              {isRtl ? "إدارة الأعضاء" : "Manage users"}
            </Link>
            <Link
              href="/admin"
              className="sr-button-secondary btn btn-xs sm:btn-sm"
            >
              {isRtl ? "لوحة التحليلات" : "Back to analytics"}
            </Link>
          </div>
        </div>

        {/* Reports queue list */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Moderation table list */}
          <div className="sr-panel md:col-span-2 rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
              {isRtl ? "قائمة البلاغات المعلقة" : "Report Queue Index"}
            </h3>

            <div className="overflow-x-auto">
              {reports.length === 0 ? (
                <p className="text-xs text-base-content/40 text-center py-6">
                  {isRtl ? "منصتك نظيفة بالكامل! لا توجد بلاغات معلقة حالياً." : "Platform clean! No pending reports queue."}
                </p>
              ) : (
                <table className="table w-full text-xs">
                  <thead>
                    <tr className="border-b border-base-300 font-mono text-[9px] uppercase">
                      <th>{isRtl ? "النوع" : "Content"}</th>
                      <th>{isRtl ? "تاريخ البلاغ" : "Filed At"}</th>
                      <th>{isRtl ? "المرسل" : "Reporter"}</th>
                      <th>{isRtl ? "سبب البلاغ" : "Violation Claim"}</th>
                      <th>{isRtl ? "الحالة" : "State"}</th>
                      <th>{isRtl ? "خيارات" : "Control"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((rep) => (
                      <tr key={rep._id} className="border-b border-base-300">
                        <td>
                          <span className="badge bg-neutral text-neutral-content/85 text-[8px] font-black uppercase tracking-wider font-mono border-none px-1.5 py-0.5 rounded">
                            {rep.contentType}
                          </span>
                        </td>
                        <td className="font-mono text-[10px]">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </td>
                        <td>{rep.reportedBy?.name || "-"}</td>
                        <td className="max-w-[150px] truncate" title={rep.reason}>{rep.reason}</td>
                        <td>
                          <span className={`badge border-none font-bold text-[8px] uppercase px-1.5 py-0.5 rounded font-mono ${
                            rep.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                            rep.status === "resolved" ? "bg-green-500/10 text-green-500" : "bg-neutral-content/10 text-neutral-content/40"
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td>
                          {rep.status === "pending" && (
                            <button
                              onClick={() => setSelectedReport(rep)}
                              className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-2 font-bold"
                            >
                              {isRtl ? "معالجة" : "Handle"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Handler sidebar modal form */}
          <div className="md:col-span-1">
            {selectedReport ? (
              <div className="sr-panel rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-base-300 pb-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
                    {isRtl ? "معالجة بلاغ" : "Report Handler Action"}
                  </h3>
                  <button onClick={() => setSelectedReport(null)} className="text-[11px] font-bold hover:underline">
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-base-content/85">
                  <div>
                    <span className="font-bold text-[10px] text-base-content/40 block font-mono">VIOLATING CONTENT TYPE</span>
                    <span className="font-extrabold text-base-content">{selectedReport.contentType.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-base-content/40 block font-mono">CONTENT KEY ID</span>
                    <span className="font-mono text-[10px] text-base-content block bg-base-100 p-1.5 rounded-lg truncate">{selectedReport.contentId}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-base-content/40 block font-mono">VIOLATION DETAILS</span>
                    <p className="p-2.5 bg-base-100 border border-base-300 rounded-xl">{selectedReport.reason}</p>
                  </div>
                </div>

                <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الإجراء المتخذ" : "Decision Outcome"}</label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => {
                        if (isResolutionStatus(e.target.value)) {
                          setResolutionStatus(e.target.value);
                        }
                      }}
                      className="select select-bordered w-full rounded-xl bg-base-100 select-xs text-xs h-10 px-3 font-semibold"
                    >
                      <option value="resolved">Approve Violation & Delete Content</option>
                      <option value="dismissed">Dismiss & Keep Content</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "السبب / القرار" : "Resolution Summary"}</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain action taken..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="sr-button btn btn-sm w-full"
                  >
                    {isRtl ? "حفظ التغييرات" : "Submit Moderation Change"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="sr-panel p-8 rounded-2xl text-center space-y-2 text-base-content/40">
                <span className="text-2xl">🛡️</span>
                <h4 className="font-extrabold text-xs uppercase tracking-wider font-mono">Moderation Detail Box</h4>
                <p className="text-[10px] leading-relaxed max-w-[200px] mx-auto">
                  {isRtl
                    ? "اختر بلاغاً معلقاً من القائمة الجانبية لمعالجة المحتوى أو حفظ القرار."
                    : "Select a pending flag from the list to audit credentials, delete spam posts, or reject profiles."}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
