"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { fetchMe, getErrorMessage, logout, type SessionUser } from "@/lib/api";
import {
  Certificate,
  getAdminCertificates,
  verifyAdminCertificate,
  adminCertificateFileUrl,
} from "@/lib/profileImport";

export default function AdminCertificatesPage() {
  const router = useRouter();
  const { locale } = useApp();
  const isRtl = locale === "ar";
  const L = useCallback((en: string, ar: string) => (locale === "ar" ? ar : en), [locale]);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [search, setSearch] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingCert, setRejectingCert] = useState<Certificate | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadCertificates = useCallback(async () => {
    try {
      const list = await getAdminCertificates(statusFilter, search);
      setCertificates(list);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, L("Failed to load certificates queue.", "فشل في تحميل قائمة الشهادات.")));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, L]);

  useEffect(() => {
    void (async () => {
      const me = await fetchMe();
      if (!me || me.role !== "admin") {
        toast.error(L("Admin authorization required.", "مطلوب صلاحيات مدير النظام."));
        router.push("/admin");
        return;
      }
      setUser(me);
      await loadCertificates();
    })();
  }, [loadCertificates, router, L]);

  const handleApprove = async (cert: Certificate) => {
    setActionBusy(cert._id);
    try {
      await verifyAdminCertificate(cert._id, "Verified");
      toast.success(L(`Certificate "${cert.title}" verified successfully!`, `تم توثيق الشهادة "${cert.title}" بنجاح!`));
      await loadCertificates();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, L("Failed to verify certificate.", "فشل في توثيق الشهادة.")));
    } finally {
      setActionBusy(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCert) return;

    setActionBusy(rejectingCert._id);
    try {
      await verifyAdminCertificate(rejectingCert._id, "Rejected", rejectReason);
      toast.info(L(`Certificate "${rejectingCert.title}" marked as rejected.`, `تم رفض الشهادة "${rejectingCert.title}".`));
      setRejectingCert(null);
      setRejectReason("");
      await loadCertificates();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, L("Failed to reject certificate.", "فشل في رفض الشهادة.")));
    } finally {
      setActionBusy(null);
    }
  };

  const openFile = (cert: Certificate, download = false) => {
    const url = cert.fileUrl || adminCertificateFileUrl(cert._id, download);
    if (download) {
      const a = document.createElement("a");
      a.href = url;
      a.download = cert.fileName || `${cert.title}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Stats calculation
  const totalCount = certificates.length;
  const pendingCount = certificates.filter((c) => (c.status || "Pending") === "Pending").length;
  const verifiedCount = certificates.filter((c) => c.status === "Verified").length;
  const rejectedCount = certificates.filter((c) => c.status === "Rejected").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-base-100 text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Admin Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#7c3aed] tracking-wider block">
              {L("VERIFICATION GATEWAY", "بوابة التحقق والتوثيق")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content mt-1">
              {L("Certificate Verification & Review", "مراجعة وتوثيق الشهادات المهنية")}
            </h1>
            <p className="text-xs text-base-content/60 max-w-2xl mt-1">
              {L(
                "Review user-submitted certifications, inspect uploaded credentials, approve verified achievements, or provide feedback for rejected submissions.",
                "راجع الشهادات المرفوعة من قبل المستخدمين، افحص الملفات المرفقة، وثّق الإنجازات المعتمدة، أو ارفض غير المطابقة مع توضيح السبب."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/admin" className="btn btn-xs sm:btn-sm btn-outline border-base-300 rounded-xl">
              {L("Dashboard", "الرئيسية")}
            </Link>
            <Link href="/admin/users" className="btn btn-xs sm:btn-sm btn-outline border-base-300 rounded-xl">
              {L("Users", "الأعضاء")}
            </Link>
            <Link href="/admin/content" className="btn btn-xs sm:btn-sm btn-outline border-base-300 rounded-xl">
              {L("Moderation", "الإشراف")}
            </Link>
            <button
              onClick={() => {
                logout();
                setUser(null);
                toast.info("Logged out from admin panel.");
                router.push("/");
              }}
              className="btn btn-xs sm:btn-sm btn-ghost text-red-500 rounded-xl hover:bg-red-50"
            >
              {L("Logout", "تسجيل الخروج")}
            </button>
          </div>
        </div>

        {/* Filter & Metric Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`p-4 rounded-2xl border text-start transition-all ${
              statusFilter === "ALL"
                ? "bg-[#7c3aed]/10 border-[#7c3aed] shadow-sm"
                : "bg-base-200 border-base-300 hover:border-base-400"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-base-content/50 block">
              {L("Total Submissions", "إجمالي الشهادات")}
            </span>
            <span className="text-2xl font-black text-base-content block mt-1">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("Pending")}
            className={`p-4 rounded-2xl border text-start transition-all ${
              statusFilter === "Pending"
                ? "bg-amber-500/10 border-amber-500 shadow-sm"
                : "bg-base-200 border-base-300 hover:border-base-400"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-amber-600 block flex items-center justify-between">
              <span>{L("Pending Review", "قيد المراجعة")}</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </span>
            <span className="text-2xl font-black text-amber-600 block mt-1">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("Verified")}
            className={`p-4 rounded-2xl border text-start transition-all ${
              statusFilter === "Verified"
                ? "bg-emerald-500/10 border-emerald-500 shadow-sm"
                : "bg-base-200 border-base-300 hover:border-base-400"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
              {L("Verified", "موثقة ومعتمدة")}
            </span>
            <span className="text-2xl font-black text-emerald-600 block mt-1">
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("Rejected")}
            className={`p-4 rounded-2xl border text-start transition-all ${
              statusFilter === "Rejected"
                ? "bg-error/10 border-error shadow-sm"
                : "bg-base-200 border-base-300 hover:border-base-400"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-error block">
              {L("Rejected", "مرفوضة")}
            </span>
            <span className="text-2xl font-black text-error block mt-1">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-base-200 border border-base-300 rounded-2xl p-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder={L("Search user, title, or credential ID…", "ابحث باسم المستخدم، الشهادة، أو المعرف…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm input-bordered w-full bg-base-100 rounded-xl text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCertificates}
              className="btn btn-sm btn-outline border-base-300 rounded-xl text-xs"
            >
              🔄 {L("Refresh Queue", "تحديث القائمة")}
            </button>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="bg-base-200 border border-base-300 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm text-xs">
              <thead className="bg-base-100 text-base-content/70">
                <tr>
                  <th>{L("Candidate / User", "المستخدم")}</th>
                  <th>{L("Certificate Details", "تفاصيل الشهادة")}</th>
                  <th>{L("Dates", "التواريخ")}</th>
                  <th>{L("Status", "الحالة")}</th>
                  <th>{L("Document", "المستند")}</th>
                  <th className="text-center">{L("Review Action", "إجراء المراجعة")}</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-base-content/50">
                      {L("No certificates found in this view.", "لا توجد شهادات في هذا القسم حالياً.")}
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => {
                    const u = typeof cert.userId === "object" ? cert.userId : null;
                    const status = cert.status || "Pending";
                    const isBusy = actionBusy === cert._id;

                    return (
                      <tr key={cert._id} className="hover:bg-base-100/60 transition-colors">
                        {/* User info */}
                        <td className="align-top py-3.5">
                          <div className="flex items-center gap-2.5">
                            {u?.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-base-300"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] font-bold text-xs flex items-center justify-center border border-[#7c3aed]/20">
                                {u?.name?.charAt(0) || "U"}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-xs text-base-content">{u?.name || L("Anonymous User", "مستخدم")}</p>
                              <p className="text-[10px] text-base-content/50">{u?.email || (typeof cert.userId === 'string' ? cert.userId : '')}</p>
                              {u?.role && (
                                <span className="badge badge-xs badge-neutral text-[9px] mt-0.5 uppercase font-mono">
                                  {u.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Certificate Title & Org */}
                        <td className="align-top py-3.5">
                          <p className="font-extrabold text-xs text-base-content">{cert.title}</p>
                          {cert.organization && (
                            <p className="text-[11px] text-[#7c3aed] font-medium">{cert.organization}</p>
                          )}
                          {cert.credentialId && (
                            <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                              ID: {cert.credentialId}
                            </p>
                          )}
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-info hover:underline inline-block mt-0.5"
                            >
                              🔗 {L("Verification Link", "رابط التحقق")} ↗
                            </a>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="align-top py-3.5 text-[10px] text-base-content/60 space-y-0.5">
                          <p>
                            <span className="font-semibold text-base-content/40">{L("Issued:", "صدرت:")}</span>{" "}
                            {cert.issueDate || "—"}
                          </p>
                          {cert.expirationDate && (
                            <p>
                              <span className="font-semibold text-base-content/40">{L("Expires:", "تنتهي:")}</span>{" "}
                              {cert.expirationDate}
                            </p>
                          )}
                          <p className="text-base-content/40 text-[9px]">
                            {L("Uploaded:", "رُفعت:")} {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "—"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="align-top py-3.5">
                          {status === "Verified" ? (
                            <div className="space-y-1">
                              <span className="badge bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold py-1 px-2">
                                ✓ {L("Verified", "موثقة")}
                              </span>
                              {cert.reviewedAt && (
                                <p className="text-[9px] text-emerald-600/70">
                                  {new Date(cert.reviewedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : status === "Rejected" ? (
                            <div className="space-y-1">
                              <span className="badge bg-error/15 text-error border border-error/30 text-[10px] font-bold py-1 px-2">
                                ✕ {L("Rejected", "مرفوضة")}
                              </span>
                              {cert.rejectionReason && (
                                <p className="text-[9px] text-error/80 max-w-[150px] truncate" title={cert.rejectionReason}>
                                  {cert.rejectionReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="badge bg-amber-500/15 text-amber-600 border border-amber-500/30 text-[10px] font-bold py-1 px-2">
                              ⏳ {L("Pending", "معلقة")}
                            </span>
                          )}
                        </td>

                        {/* View / Download */}
                        <td className="align-top py-3.5">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => openFile(cert, false)}
                              className="btn btn-xs btn-outline border-base-300 rounded-lg text-[10px] font-bold gap-1"
                            >
                              👁️ {L("View File", "عرض الملف")}
                            </button>
                            <button
                              onClick={() => openFile(cert, true)}
                              className="btn btn-xs btn-ghost text-base-content/70 rounded-lg text-[10px] gap-1"
                            >
                              ⬇️ {L("Download", "تحميل")}
                            </button>
                          </div>
                        </td>

                        {/* Review Actions */}
                        <td className="align-top py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {status !== "Verified" && (
                              <button
                                onClick={() => handleApprove(cert)}
                                disabled={isBusy}
                                className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl font-bold gap-1 shadow-sm"
                              >
                                {isBusy ? <span className="loading loading-spinner loading-xs" /> : "✓ " + L("Approve", "توثيق")}
                              </button>
                            )}

                            {status !== "Rejected" && (
                              <button
                                onClick={() => {
                                  setRejectingCert(cert);
                                  setRejectReason("");
                                }}
                                disabled={isBusy}
                                className="btn btn-xs btn-outline border-error/50 text-error hover:bg-error hover:text-white rounded-xl font-bold gap-1"
                              >
                                ✕ {L("Reject", "رفض")}
                              </button>
                            )}

                            {status === "Verified" && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                {L("Approved", "معتمد")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reject Confirmation Modal */}
        {rejectingCert && (
          <div className="modal modal-open">
            <div className="modal-box bg-base-200 border border-base-300 rounded-3xl p-6 max-w-md">
              <h3 className="font-black text-lg text-base-content">
                {L("Reject Certificate Submission", "رفض طلب توثيق الشهادة")}
              </h3>
              <p className="text-xs text-base-content/60 mt-1">
                {L(
                  `Are you sure you want to reject "${rejectingCert.title}"? Please provide a helpful reason for the user.`,
                  `هل أنت متأكد من رفض توثيق "${rejectingCert.title}"؟ يرجى كتابة سبب الرفض لتوجيه المستخدم.`
                )}
              </p>

              <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-bold">{L("Rejection Reason / Feedback", "سبب الرفض والملاحظات")}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered bg-base-100 text-xs w-full h-24 rounded-xl"
                    placeholder={L("e.g. Unreadable document image, missing credential number, expired certificate…", "مثال: الصورة غير واضحة، رقم الشهادة غير مطابق، الشهادة منتهية الصلاحية…")}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-action flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingCert(null);
                      setRejectReason("");
                    }}
                    className="btn btn-sm btn-ghost rounded-xl text-xs"
                  >
                    {L("Cancel", "إلغاء")}
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(actionBusy)}
                    className="btn btn-sm bg-error hover:bg-red-700 text-white border-none rounded-xl text-xs font-bold"
                  >
                    {actionBusy ? <span className="loading loading-spinner loading-xs" /> : L("Confirm Rejection", "تأكيد الرفض")}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop" onClick={() => setRejectingCert(null)} />
          </div>
        )}

      </div>
    </div>
  );
}
