'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { toast } from 'react-toastify';
import {
  Certificate,
  GitHubAccount,
  GitHubRepo,
  LinkedInAccount,
  Project,
  getGitHubStatus,
  getGitHubAuthUrl,
  getGitHubAccount,
  getGitHubRepos,
  refreshGitHub,
  importGitHubRepos,
  disconnectGitHub,
  getLinkedInStatus,
  getLinkedInAuthUrl,
  getLinkedInAccount,
  importLinkedInManual,
  importLinkedInPdf,
  disconnectLinkedIn,
  uploadCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate,
  fetchCertificateBlob,
  getProjects,
  updateProject,
  deleteProject,
} from '@/lib/profileImport';

// ── Icons ──────────────────────────────────────────────────────────────
const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z" />
  </svg>
);
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-6-7l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0v12a2 2 0 002 2h6a2 2 0 002-2V7" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6m2.5-9.5a2.12 2.12 0 010 3l-9 9L3 21l1.5-4.5 9-9a2.12 2.12 0 013 0z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-6 3V4m0 0l-3 3m3-3l3 3" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const Spinner = () => <span className="loading loading-spinner loading-sm" />;

// ── Helpers ────────────────────────────────────────────────────────────
const PRIMARY = 'btn bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white font-bold';
const OUTLINE = 'btn btn-outline border-base-300 hover:bg-base-300 hover:text-base-content';

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

interface RepoRow extends GitHubRepo {
  checked: boolean;
}

export default function ProfileImportPage() {
  const { locale, t } = useApp();
  const L = useCallback((en: string, ar: string) => (locale === 'ar' ? ar : en), [locale]);

  const [loading, setLoading] = useState(true);

  // GitHub
  const [ghConfigured, setGhConfigured] = useState(false);
  const [ghAccount, setGhAccount] = useState<GitHubAccount | null>(null);
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [ghBusy, setGhBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  // LinkedIn
  const [liConfigured, setLiConfigured] = useState(false);
  const [liAccount, setLiAccount] = useState<LinkedInAccount | null>(null);
  const [liBusy, setLiBusy] = useState(false);

  // Certificates
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [certBusy, setCertBusy] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certTitle, setCertTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [ghS, ghA, reposRes, liS, liA, certsRes, projRes] = await Promise.all([
        getGitHubStatus().catch(() => ({ configured: false })),
        getGitHubAccount().catch(() => ({ connected: false, account: null })),
        getGitHubRepos().catch(() => ({ repos: [] })),
        getLinkedInStatus().catch(() => ({ configured: false, apiLimitations: true })),
        getLinkedInAccount().catch(() => ({ connected: false, account: null })),
        getCertificates().catch(() => ({ certificates: [] })),
        getProjects().catch(() => ({ projects: [] })),
      ]);
      setGhConfigured(ghS.configured);
      setGhAccount(ghA.connected ? ghA.account : null);
      setRepos((reposRes.repos ?? []).map((r) => ({ ...r, checked: false })));
      setLiConfigured(liS.configured);
      const activeLi = liA.connected ? liA.account : null;
      setLiAccount(activeLi);
      if (activeLi?.profile) {
        setLiForm((f) => ({
          ...f,
          fullName: activeLi.profile?.fullName || f.fullName,
          headline: activeLi.profile?.headline || f.headline,
          about: activeLi.profile?.about || f.about,
          skills: activeLi.profile?.skills?.join(', ') || f.skills,
          languages: activeLi.profile?.languages?.join(', ') || f.languages,
          experience: (activeLi.profile?.experience as any) || f.experience,
          education: (activeLi.profile?.education as any) || f.education,
          certifications: (activeLi.profile?.certifications as any) || f.certifications,
        }));
      }
      setCerts(certsRes.certificates ?? []);
      setProjects(projRes.projects ?? []);
    } catch {
      /* surface nothing — individual handlers toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle OAuth callback redirect (?github=connected|error&message=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const gh = params.get('github');
    const li = params.get('linkedin');
    if (gh === 'connected') toast.success(L('GitHub connected successfully!', 'تم ربط GitHub بنجاح!'));
    if (gh === 'error') toast.error(params.get('message') || L('GitHub connection failed.', 'فشل ربط GitHub.'));
    if (li === 'connected') toast.success(L('LinkedIn connected successfully!', 'تم ربط LinkedIn بنجاح!'));
    if (li === 'error') toast.error(params.get('message') || L('LinkedIn connection failed.', 'فشل ربط LinkedIn.'));
    if (gh || li) {
      window.history.replaceState({}, '', '/profile/import');
      loadAll();
    }
  }, [loadAll, L]);

  // ── GitHub actions ────────────────────────────────────────────────────
  const connectGitHub = async () => {
    if (!ghConfigured) {
      toast.info(L('GitHub OAuth is not configured on this server.', 'لم يتم ضبط تسجيل دخول GitHub على الخادم.'));
      return;
    }
    try {
      const { url } = await getGitHubAuthUrl();
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const fetchRepos = async () => {
    setGhBusy(true);
    try {
      const { repos: list } = await getGitHubRepos();
      setRepos(list.map((r) => ({ ...r, checked: false })));
      toast.success(L(`${list.length} repositories loaded.`, `تم تحميل ${list.length} مستودعاً.`));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGhBusy(false);
    }
  };

  const refreshGitHubData = async () => {
    setGhBusy(true);
    try {
      const { account } = await refreshGitHub();
      setGhAccount(account);
      toast.success(L('GitHub profile and stats refreshed.', 'تم تحديث بيانات ملف وإحصائيات GitHub.'));
      await fetchRepos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGhBusy(false);
    }
  };

  const toggleRepo = (id: number) =>
    setRepos((rows) => rows.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));

  const importRepos = async () => {
    const selected = repos.filter((r) => r.checked);
    if (selected.length === 0) {
      toast.warning(L('Select at least one repository.', 'اختر مستودعاً واحداً على الأقل.'));
      return;
    }
    setImportBusy(true);
    try {
      const payload = selected.map((r) => ({
        repoId: r.id,
        name: r.name,
        description: r.description || undefined,
        url: r.html_url,
        homepage: r.homepage || undefined,
        language: r.language || undefined,
        topics: r.topics || [],
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.updated_at,
      }));
      const { imported, skipped } = await importGitHubRepos(payload);
      toast.success(
        L(
          `Imported ${imported.length} project(s)${skipped ? `, skipped ${skipped} duplicate(s)` : ''}.`,
          `تم استيراد ${imported.length} مشروع${skipped ? `، وتجاوز ${skipped} مكرر` : ''}.`,
        ),
      );
      setRepos((rows) => rows.map((r) => ({ ...r, checked: false })));
      const { projects: list } = await getProjects();
      setProjects(list);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImportBusy(false);
    }
  };

  const doDisconnectGitHub = async () => {
    if (!confirm(L('Disconnect GitHub?', 'هل تريد قطع اتصال GitHub؟'))) return;
    try {
      await disconnectGitHub();
      setGhAccount(null);
      setRepos([]);
      toast.success(L('GitHub disconnected.', 'تم قطع اتصال GitHub.'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── LinkedIn actions ─────────────────────────────────────────────────
  const connectLinkedIn = async () => {
    if (!liConfigured) {
      toast.info(L('LinkedIn OAuth is not configured — use the manual or PDF import below.', 'لم يتم ضبط LinkedIn — استخدم الاستيراد اليدوي أو عبر PDF أدناه.'));
      return;
    }
    try {
      const { url } = await getLinkedInAuthUrl();
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const [liForm, setLiForm] = useState({
    fullName: '',
    headline: '',
    about: '',
    skills: '',
    languages: '',
    experience: [] as Array<{ title: string; company: string; startDate: string; endDate: string; description: string }>,
    education: [] as Array<{ school: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string }>,
    certifications: [] as Array<{ name: string; authority: string; issueDate: string; expirationDate: string; credentialId: string; credentialUrl: string }>,
  });

  const importLinkedIn = async () => {
    setLiBusy(true);
    try {
      const payload = {
        fullName: liForm.fullName || undefined,
        headline: liForm.headline || undefined,
        about: liForm.about || undefined,
        skills: liForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        languages: liForm.languages.split(',').map((s) => s.trim()).filter(Boolean),
        experience: liForm.experience.filter((e) => e.title || e.company),
        education: liForm.education.filter((e) => e.school),
        certifications: liForm.certifications.filter((c) => c.name),
      };
      await importLinkedInManual(payload);
      toast.success(L('LinkedIn profile imported.', 'تم استيراد ملف LinkedIn.'));
      const { account } = await getLinkedInAccount();
      setLiAccount(account);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLiBusy(false);
    }
  };

  const onLinkedInPdf = async (file: File) => {
    setLiBusy(true);
    try {
      await importLinkedInPdf(file);
      toast.success(L('LinkedIn PDF uploaded. Review and complete the fields below.', 'تم رفع ملف LinkedIn PDF. راجع وأكمل الحقول أدناه.'));
      const { account } = await getLinkedInAccount();
      setLiAccount(account);
      if (account?.profile) {
        setLiForm((f) => ({
          ...f,
          fullName: account.profile?.fullName || f.fullName,
          headline: account.profile?.headline || f.headline,
          about: account.profile?.about || f.about,
          skills: account.profile?.skills?.join(', ') || f.skills,
          languages: account.profile?.languages?.join(', ') || f.languages,
          experience: (account.profile?.experience as any) || f.experience,
          education: (account.profile?.education as any) || f.education,
          certifications: (account.profile?.certifications as any) || f.certifications,
        }));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLiBusy(false);
    }
  };

  const doDisconnectLinkedIn = async () => {
    if (!confirm(L('Disconnect LinkedIn?', 'هل تريد قطع اتصال LinkedIn؟'))) return;
    try {
      await disconnectLinkedIn();
      setLiAccount(null);
      toast.success(L('LinkedIn disconnected.', 'تم قطع اتصال LinkedIn.'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── Certificate actions ──────────────────────────────────────────────
  const onCertFileChange = (file: File | null) => {
    if (!file) return;
    const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    if (!ok) {
      toast.error(L('Unsupported file. Use PDF, JPG, JPEG or PNG.', 'صيغة غير مدعومة. استخدم PDF أو JPG أو JPEG أو PNG.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(L('File exceeds the 5 MB limit.', 'الملف يتجاوز الحد المسموح 5 ميجابايت.'));
      return;
    }
    setCertFile(file);
  };

  const uploadCert = async () => {
    if (!certFile) {
      toast.warning(L('Choose a file to upload.', 'اختر ملفاً للرفع.'));
      return;
    }
    if (!certTitle.trim()) {
      toast.warning(L('Certificate name is required.', 'اسم الشهادة مطلوب.'));
      return;
    }
    setCertBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', certFile);
      fd.append('title', certTitle);
      await uploadCertificate(fd);
      toast.success(L('Certificate uploaded.', 'تم رفع الشهادة.'));
      setCertTitle('');
      setCertFile(null);
      const { certificates } = await getCertificates();
      setCerts(certificates);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCertBusy(false);
    }
  };

  const openCertificate = async (cert: Certificate, mode: 'view' | 'download') => {
    try {
      if (cert.fileUrl) {
        if (mode === 'view') {
          window.open(cert.fileUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        // Download mode with direct fileUrl
        const a = document.createElement('a');
        a.href = cert.fileUrl;
        a.download = cert.fileName || cert.title || 'certificate';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      // Fallback via API endpoint blob fetch
      const blob = await fetchCertificateBlob(cert._id);
      const url = URL.createObjectURL(blob);
      if (mode === 'view') {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = cert.fileName || cert.title || 'certificate';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveCertEdit = async () => {
    if (!editingCert) return;
    try {
      await updateCertificate(editingCert._id, {
        title: editingCert.title,
        organization: editingCert.organization,
        issueDate: editingCert.issueDate,
        expirationDate: editingCert.expirationDate,
        credentialId: editingCert.credentialId,
        credentialUrl: editingCert.credentialUrl,
      });
      toast.success(L('Certificate updated.', 'تم تحديث الشهادة.'));
      setEditingCert(null);
      const { certificates } = await getCertificates();
      setCerts(certificates);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const removeCert = async (id: string) => {
    if (!confirm(L('Delete this certificate?', 'حذف هذه الشهادة؟'))) return;
    try {
      await deleteCertificate(id);
      setCerts((c) => c.filter((x) => x._id !== id));
      toast.success(L('Certificate deleted.', 'تم حذف الشهادة.'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── Project actions ──────────────────────────────────────────────────
  const saveProjectEdit = async () => {
    if (!editingProject) return;
    try {
      await updateProject(editingProject._id, {
        name: editingProject.name,
        description: editingProject.description,
        demoLink: editingProject.demoLink,
        technologies: editingProject.technologies,
        lastUpdated: editingProject.lastUpdated,
      });
      toast.success(L('Project updated.', 'تم تحديث المشروع.'));
      setEditingProject(null);
      const { projects: list } = await getProjects();
      setProjects(list);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const removeProject = async (id: string) => {
    if (!confirm(L('Delete this project?', 'حذف هذا المشروع؟'))) return;
    try {
      await deleteProject(id);
      setProjects((p) => p.filter((x) => x._id !== id));
      toast.success(L('Project deleted.', 'تم حذف المشروع.'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-base-100 text-base-content min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="font-extrabold text-xl text-base-content">{L('Import Profile', 'استيراد الملف الشخصي')}</h1>
            <p className="text-xs text-base-content/50 mt-1">
              {L('Connect GitHub, LinkedIn and upload certificates to build your profile.', 'اربط GitHub و LinkedIn وارفع الشهادات لبناء ملفك الشخصي.')}
            </p>
          </div>
          <Link href="/profile" className={OUTLINE + ' btn-sm rounded-xl'}>
            {L('Back to Settings', 'العودة للإعدادات')}
          </Link>
        </div>

        {/* ───────────────── GitHub ───────────────── */}
        <section className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center text-[#7c3aed]">
                <GitHubIcon />
              </span>
              <div>
                <h2 className="font-extrabold text-sm">{L('GitHub', 'GitHub')}</h2>
                <p className="text-[11px] text-base-content/50">
                  {ghAccount
                    ? `@${ghAccount.username || ghAccount.githubId}`
                    : L('Import repositories as portfolio projects.', 'استورد المستودعات كمشاريع في معرض أعمالك.')}
                </p>
              </div>
            </div>
            {ghAccount ? (
              <button onClick={doDisconnectGitHub} className="btn btn-outline border-error/40 text-error btn-sm rounded-xl">
                {L('Disconnect', 'قطع الاتصال')}
              </button>
            ) : (
              <button onClick={connectGitHub} className={PRIMARY + ' btn-sm rounded-xl'}>
                {L('Connect GitHub', 'ربط GitHub')}
              </button>
            )}
          </div>

          {ghAccount && (
            <div className="mt-4 flex flex-col gap-3 bg-base-100 border border-base-300 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {ghAccount.avatar && (
                  <img src={ghAccount.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-base-300" />
                )}
                <div className="text-xs">
                  <p className="font-bold">{ghAccount.fullName || ghAccount.username}</p>
                  <p className="text-base-content/55">
                    {ghAccount.followers ?? 0} {L('followers', 'متابع')} · {ghAccount.following ?? 0} {L('following', 'يتابع')}
                    {ghAccount.totalStars ? ` · ★ ${ghAccount.totalStars}` : ''}
                    {ghAccount.location ? ` · ${ghAccount.location}` : ''}
                  </p>
                  {ghAccount.lastSyncedAt && (
                    <p className="text-[10px] text-base-content/40 mt-0.5">
                      {L('Last synced:', 'آخر مزامنة:')} {formatDate(ghAccount.lastSyncedAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <button onClick={refreshGitHubData} disabled={ghBusy} className={OUTLINE + ' btn-sm rounded-xl'}>
                    {ghBusy ? <Spinner /> : L('Refresh GitHub Data', 'تحديث بيانات GitHub')}
                  </button>
                  <button onClick={fetchRepos} disabled={ghBusy} className={OUTLINE + ' btn-sm rounded-xl'}>
                    {ghBusy ? <Spinner /> : L('Load Repositories', 'تحميل المستودعات')}
                  </button>
                </div>
              </div>
              {ghAccount.languagesSummary && Object.keys(ghAccount.languagesSummary).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-base-200">
                  <span className="text-[11px] font-semibold text-base-content/60 mr-1">{L('Top Languages:', 'أبرز اللغات:')}</span>
                  {Object.entries(ghAccount.languagesSummary).slice(0, 6).map(([lang]) => (
                    <span key={lang} className="badge badge-sm badge-secondary font-medium text-[10px]">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {repos.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="overflow-x-auto border border-base-300 rounded-xl">
                <table className="table table-sm text-xs">
                  <thead className="bg-base-100">
                    <tr>
                      <th className="w-10"></th>
                      <th>{L('Repository', 'المستودع')}</th>
                      <th>{L('Language', 'اللغة')}</th>
                      <th>★</th>
                      <th>⑂</th>
                      <th>{L('Updated', 'آخر تحديث')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repos.map((r) => (
                      <tr key={r.id} className="hover:bg-base-100">
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={r.checked}
                            onChange={() => toggleRepo(r.id)}
                          />
                        </td>
                        <td>
                          <p className="font-bold">{r.name}</p>
                          {r.description && <p className="text-[10px] text-base-content/55 line-clamp-1">{r.description}</p>}
                        </td>
                        <td>{r.language || '—'}</td>
                        <td>{r.stargazers_count ?? 0}</td>
                        <td>{r.forks_count ?? 0}</td>
                        <td>{formatDate(r.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={importRepos} disabled={importBusy} className={PRIMARY + ' btn-sm rounded-xl'}>
                  {importBusy ? <Spinner /> : <><CheckIcon /> {L('Import Selected Projects', 'استيراد المشاريع المحددة')}</>}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ───────────────── LinkedIn ───────────────── */}
        <section className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center text-[#0a66c2]">
                <LinkedInIcon />
              </span>
              <div>
                <h2 className="font-extrabold text-sm">{L('LinkedIn', 'LinkedIn')}</h2>
                <p className="text-[11px] text-base-content/50">{L('Connect or import your profile.', 'اربط أو استورد ملفك الشخصي.')}</p>
              </div>
            </div>
            {liAccount ? (
              <button onClick={doDisconnectLinkedIn} className="btn btn-outline border-error/40 text-error btn-sm rounded-xl">
                {L('Disconnect', 'قطع الاتصال')}
              </button>
            ) : (
              <button onClick={connectLinkedIn} className="btn bg-[#0a66c2] hover:bg-[#004182] border-none text-white btn-sm rounded-xl font-bold">
                {L('Connect LinkedIn', 'ربط LinkedIn')}
              </button>
            )}
          </div>

          {liAccount && (
            <div className="mt-4 flex flex-col gap-3 bg-base-100 border border-base-300 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-3">
                {liAccount.picture ? (
                  <img src={liAccount.picture} alt="" className="w-12 h-12 rounded-full object-cover border border-base-300 shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0a66c2]/10 border border-[#0a66c2]/30 flex items-center justify-center text-[#0a66c2] font-bold text-lg">
                    {liAccount.fullName?.charAt(0) || 'L'}
                  </div>
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{liAccount.fullName || liAccount.linkedinId}</p>
                    <span className="badge badge-success badge-sm text-[10px] font-semibold gap-1">
                      <CheckIcon /> {L('Identity Verified', 'تم توثيق الهوية')}
                    </span>
                  </div>
                  {liAccount.email && <p className="text-base-content/60">{liAccount.email}</p>}
                  <p className="text-[10px] text-base-content/40">
                    {L('Connected via Sign In with LinkedIn (OpenID Connect)', 'متصل عبر تسجيل الدخول بـ LinkedIn')}
                    {liAccount.connectedAt ? ` · ${formatDate(liAccount.connectedAt)}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 bg-info/10 border border-info/30 rounded-xl p-3 text-[11px] text-base-content/80">
            <p className="font-bold text-info flex items-center gap-1.5">
              <span>ℹ️</span> {L('LinkedIn API Notice', 'تنبيه حول API LinkedIn')}
            </p>
            <p className="mt-1 leading-relaxed">
              {L(
                'LinkedIn’s standard OAuth API shares basic profile identity (name, email, photo) for security. Work experience, education, skills, certifications, and languages must be added below via Manual Entry or PDF Import.',
                'تشارك واجهة LinkedIn العامة بيانات الهوية الأساسية (الاسم والبريد والصورة). يتم إضافة الخبرات والتعليم والمهارات والشهادات أدناه عبر الإدخال اليدوي أو استيراد ملف PDF.',
              )}
            </p>
          </div>

          {/* Alternative: manual entry */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-xs">{L('Manual entry', 'إدخال يدوي')}</h3>
              <input className="input input-bordered input-sm w-full bg-base-200" placeholder={L('Full name', 'الاسم الكامل')} value={liForm.fullName} onChange={(e) => setLiForm({ ...liForm, fullName: e.target.value })} />
              <input className="input input-bordered input-sm w-full bg-base-200" placeholder={L('Headline', 'العنوان المهني')} value={liForm.headline} onChange={(e) => setLiForm({ ...liForm, headline: e.target.value })} />
              <textarea className="textarea textarea-bordered textarea-sm w-full bg-base-200 h-20" placeholder={L('About summary', 'نبذة تعريفية')} value={liForm.about} onChange={(e) => setLiForm({ ...liForm, about: e.target.value })} />
              <input className="input input-bordered input-sm w-full bg-base-200" placeholder={L('Skills (comma separated)', 'المهارات (مفصولة بفاصلة)')} value={liForm.skills} onChange={(e) => setLiForm({ ...liForm, skills: e.target.value })} />
              <input className="input input-bordered input-sm w-full bg-base-200" placeholder={L('Languages (comma separated)', 'اللغات (مفصولة بفاصلة)')} value={liForm.languages} onChange={(e) => setLiForm({ ...liForm, languages: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setLiForm({ ...liForm, experience: [...liForm.experience, { title: '', company: '', startDate: '', endDate: '', description: '' }] })} className="btn btn-xs btn-outline border-base-300">+ {L('Experience', 'خبرة')}</button>
                <button onClick={() => setLiForm({ ...liForm, education: [...liForm.education, { school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }] })} className="btn btn-xs btn-outline border-base-300">+ {L('Education', 'تعليم')}</button>
                <button onClick={() => setLiForm({ ...liForm, certifications: [...liForm.certifications, { name: '', authority: '', issueDate: '', expirationDate: '', credentialId: '', credentialUrl: '' }] })} className="btn btn-xs btn-outline border-base-300">+ {L('Certification', 'شهادة')}</button>
              </div>
              {liForm.experience.map((x, i) => (
                <div key={`exp-${i}`} className="grid grid-cols-2 gap-2">
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('Role', 'الوظيفة')} value={x.title} onChange={(e) => { const v = [...liForm.experience]; v[i].title = e.target.value; setLiForm({ ...liForm, experience: v }); }} />
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('Company', 'الشركة')} value={x.company} onChange={(e) => { const v = [...liForm.experience]; v[i].company = e.target.value; setLiForm({ ...liForm, experience: v }); }} />
                </div>
              ))}
              {liForm.education.map((x, i) => (
                <div key={`edu-${i}`} className="grid grid-cols-2 gap-2">
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('School', 'المدرسة')} value={x.school} onChange={(e) => { const v = [...liForm.education]; v[i].school = e.target.value; setLiForm({ ...liForm, education: v }); }} />
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('Degree', 'الدرجة')} value={x.degree} onChange={(e) => { const v = [...liForm.education]; v[i].degree = e.target.value; setLiForm({ ...liForm, education: v }); }} />
                </div>
              ))}
              {liForm.certifications.map((x, i) => (
                <div key={`cert-${i}`} className="grid grid-cols-2 gap-2">
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('Certification name', 'اسم الشهادة')} value={x.name} onChange={(e) => { const v = [...liForm.certifications]; v[i].name = e.target.value; setLiForm({ ...liForm, certifications: v }); }} />
                  <input className="input input-bordered input-xs bg-base-200" placeholder={L('Authority', 'الجهة المانحة')} value={x.authority} onChange={(e) => { const v = [...liForm.certifications]; v[i].authority = e.target.value; setLiForm({ ...liForm, certifications: v }); }} />
                </div>
              ))}
              <button onClick={importLinkedIn} disabled={liBusy} className={PRIMARY + ' btn-sm rounded-xl w-full'}>
                {liBusy ? <Spinner /> : L('Import Profile', 'استيراد الملف')}
              </button>
            </div>

            {/* Alternative: PDF upload */}
            <div className="bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-xs">{L('Upload LinkedIn PDF', 'رفع ملف LinkedIn PDF')}</h3>
              <p className="text-[11px] text-base-content/55">{L('Export your LinkedIn profile as PDF and upload it. We extract the text so you can complete the fields above.', 'صدّر ملف LinkedIn كـ PDF وارفعه. نستخرج النص لإكمال الحقول أعلاه.')}</p>
              <input
                type="file"
                accept="application/pdf"
                id="linkedin-pdf"
                className="file-input file-input-bordered file-input-sm w-full bg-base-200"
                onChange={(e) => e.target.files?.[0] && onLinkedInPdf(e.target.files[0])}
              />
              {liForm && (
                <div className="text-[11px] text-base-content/55">
                  {liAccount?.importMethod === 'pdf' && L('PDF imported — review the manual fields and save.', 'تم استيراد الـ PDF — راجع الحقول اليدوية واحفظ.')}
                </div>
              )}
            </div>
          </div>

          {liAccount?.profile && (
            <div className="mt-4 bg-base-100 border border-base-300 rounded-xl p-4 text-xs space-y-2 text-start">
              <h3 className="font-bold">{L('Imported profile preview', 'معاينة الملف المستورد')}</h3>
              {liAccount.profile.headline && <p className="text-base-content/70">{liAccount.profile.headline}</p>}
              {liAccount.profile.about && <p className="text-base-content/60">{liAccount.profile.about}</p>}
              {liAccount.profile.skills && liAccount.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {liAccount.profile.skills.map((s) => (
                    <span key={s} className="badge badge-sm bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ───────────────── Certificates ───────────────── */}
        <section className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center text-[#7c3aed]">
              <UploadIcon />
            </span>
            <div>
              <h2 className="font-extrabold text-sm">{L('Certificates', 'الشهادات')}</h2>
              <p className="text-[11px] text-base-content/50">{L('Upload and manage your professional certifications.', 'ارفع وأدر شهاداتك المهنية.')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload form / Drag & Drop area */}
            <div className="lg:col-span-1 space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-[#7c3aed] bg-[#7c3aed]/5'
                    : certFile
                    ? 'border-success/50 bg-success/5'
                    : 'border-base-300 hover:border-base-400 bg-base-100/50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) onCertFileChange(file);
                }}
                onClick={() => document.getElementById('cert-file-input')?.click()}
              >
                <input
                  type="file"
                  id="cert-file-input"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && onCertFileChange(e.target.files[0])}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className={`w-8 h-8 rounded-full bg-base-100 flex items-center justify-center border border-base-300 ${certFile ? 'text-success' : 'text-base-content/40'}`}>
                    {certFile ? <CheckIcon /> : <UploadIcon />}
                  </span>
                  {certFile ? (
                    <div className="text-xs">
                      <p className="font-bold truncate max-w-[200px]">{certFile.name}</p>
                      <p className="text-[10px] text-base-content/50">{(certFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-base-content/60">
                      <p className="font-bold">{L('Drag & drop your certificate', 'اسحب وأفلت شهادتك هنا')}</p>
                      <p className="text-[10px] text-base-content/40 mt-1">{L('Supports PDF, JPG, JPEG, PNG up to 5MB', 'يدعم صيغ PDF, JPG, JPEG, PNG حتى 5 ميجابايت')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  placeholder={L('Certificate Name *', 'اسم الشهادة *')}
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                />

                <button
                  onClick={uploadCert}
                  disabled={certBusy}
                  className={PRIMARY + ' w-full btn-sm rounded-xl'}
                >
                  {certBusy ? <Spinner /> : L('Upload Certificate', 'رفع الشهادة')}
                </button>
              </div>
            </div>

            {/* Certificate Gallery */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-xs text-start">{L('Certificate Gallery', 'معرض الشهادات')}</h3>
              
              {certs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-base-100/50 border border-base-300 rounded-xl text-center">
                  <p className="text-xs text-base-content/40">{L('No certificates uploaded yet.', 'لم يتم رفع أي شهادات بعد.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certs.map((c) => (
                    <div key={c._id} className="card card-compact bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="card-body p-4 space-y-3 text-start">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-base-content line-clamp-1">{c.title}</h4>
                            {c.organization && <p className="text-[10px] text-base-content/60 font-semibold">{c.organization}</p>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEditingCert(c)}
                              className="btn btn-ghost btn-xs text-info p-1 hover:bg-info/10"
                              title={L('Edit', 'تعديل')}
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => removeCert(c._id)}
                              className="btn btn-ghost btn-xs text-error p-1 hover:bg-error/10"
                              title={L('Delete', 'حذف')}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-base-content/50 space-y-1 bg-base-200/50 rounded-lg p-2">
                          <p>
                            <span className="font-bold">{L('Issue Date: ', 'تاريخ الإصدار: ')}</span>
                            {formatDate(c.issueDate)}
                          </p>
                          {c.expirationDate && (
                            <p>
                              <span className="font-bold">{L('Expires: ', 'ينتهي في: ')}</span>
                              {formatDate(c.expirationDate)}
                            </p>
                          )}
                          {c.credentialId && (
                            <p className="truncate">
                              <span className="font-bold">{L('Credential ID: ', 'معرّف الشهادة: ')}</span>
                              {c.credentialId}
                            </p>
                          )}
                        </div>

                        <div className="card-actions justify-end border-t border-base-300 pt-2 gap-2 mt-auto">
                          <button
                            onClick={() => openCertificate(c, 'view')}
                            className="btn btn-ghost btn-xs text-xs font-bold gap-1 p-1"
                          >
                            <EyeIcon /> {L('View', 'عرض')}
                          </button>
                          <button
                            onClick={() => openCertificate(c, 'download')}
                            className="btn btn-ghost btn-xs text-xs font-bold gap-1 p-1"
                          >
                            <DownloadIcon /> {L('Download', 'تحميل')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ───────────────── Portfolio Projects (Imported) ───────────────── */}
        <section className="bg-base-200 border border-base-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center text-[#7c3aed]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              <div>
                <h2 className="font-extrabold text-sm">{L('Imported Projects', 'المشاريع المستوردة')}</h2>
                <p className="text-[11px] text-base-content/50">{L('Manage the projects that have been imported into your profile.', 'أدر المشاريع التي تم استيرادها إلى ملفك الشخصي.')}</p>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-base-100/50 border border-base-300 rounded-xl text-center">
              <p className="text-xs text-base-content/40">{L('No portfolio projects imported yet.', 'لم يتم استيراد أي مشاريع في معرض الأعمال بعد.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p._id} className="card card-compact bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="card-body p-4 space-y-2 text-start">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs text-base-content line-clamp-1">{p.name}</h4>
                          <span className={`badge badge-xs capitalize font-bold ${p.source === 'github' ? 'badge-neutral' : 'badge-primary'}`}>
                            {p.source}
                          </span>
                        </div>
                        {p.lastUpdated && <p className="text-[9px] text-base-content/40 mt-0.5">{L('Updated: ', 'تحديث: ')}{formatDate(p.lastUpdated)}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingProject(p)}
                          className="btn btn-ghost btn-xs text-info p-1 hover:bg-info/10"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => removeProject(p._id)}
                          className="btn btn-ghost btn-xs text-error p-1 hover:bg-error/10"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {p.description && <p className="text-[11px] text-base-content/60 line-clamp-2 leading-relaxed">{p.description}</p>}
                    
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.technologies.map((t) => (
                          <span key={t} className="badge badge-sm font-semibold bg-base-200 border-none text-base-content/70 text-[9px] px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="card-actions justify-end border-t border-base-300 pt-2 gap-2 mt-auto text-xs">
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link btn-xs text-xs text-[#7c3aed] font-bold p-0 min-h-0 h-auto">
                          GitHub
                        </a>
                      )}
                      {p.demoLink && (
                        <a href={p.demoLink} target="_blank" rel="noopener noreferrer" className="btn btn-link btn-xs text-xs text-primary font-bold p-0 min-h-0 h-auto">
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Edit Certificate Modal ── */}
      {editingCert && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 border border-base-300 rounded-2xl max-w-md p-6">
            <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-base-content">{L('Edit Certificate', 'تعديل الشهادة')}</h3>
              <button onClick={() => setEditingCert(null)} className="btn btn-ghost btn-circle btn-xs text-base-content/60">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-3 text-start">
              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Title *', 'العنوان *')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingCert.title || ''}
                  onChange={(e) => setEditingCert(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Issuing Organization', 'الجهة المانحة')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingCert.organization || ''}
                  onChange={(e) => setEditingCert(prev => prev ? { ...prev, organization: e.target.value } : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Issue Date', 'تاريخ الإصدار')}</label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                    value={editingCert.issueDate ? editingCert.issueDate.substring(0, 10) : ''}
                    onChange={(e) => setEditingCert(prev => prev ? { ...prev, issueDate: e.target.value } : null)}
                  />
                </div>
                <div className="form-control">
                  <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Expiration Date', 'تاريخ الانتهاء')}</label>
                  <input
                    type="date"
                    className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                    value={editingCert.expirationDate ? editingCert.expirationDate.substring(0, 10) : ''}
                    onChange={(e) => setEditingCert(prev => prev ? { ...prev, expirationDate: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Credential ID', 'معرّف الشهادة')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingCert.credentialId || ''}
                  onChange={(e) => setEditingCert(prev => prev ? { ...prev, credentialId: e.target.value } : null)}
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Credential URL', 'رابط الشهادة')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingCert.credentialUrl || ''}
                  onChange={(e) => setEditingCert(prev => prev ? { ...prev, credentialUrl: e.target.value } : null)}
                />
              </div>
            </div>

            <div className="modal-action border-t border-base-300 pt-3 mt-4 gap-2">
              <button onClick={() => setEditingCert(null)} className={OUTLINE + ' btn-xs rounded-xl px-4 py-2'}>
                {L('Cancel', 'إلغاء')}
              </button>
              <button onClick={saveCertEdit} className={PRIMARY + ' btn-xs rounded-xl px-4 py-2'}>
                {L('Save', 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Project Modal ── */}
      {editingProject && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 border border-base-300 rounded-2xl max-w-md p-6">
            <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-base-content">{L('Edit Project', 'تعديل المشروع')}</h3>
              <button onClick={() => setEditingProject(null)} className="btn btn-ghost btn-circle btn-xs text-base-content/60">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-3 text-start">
              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Name *', 'الاسم *')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingProject.name || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Description', 'الوصف')}</label>
                <textarea
                  className="textarea textarea-bordered textarea-sm w-full bg-base-100 text-xs rounded-xl h-20 resize-none"
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Demo Link', 'رابط الديمو')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingProject.demoLink || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, demoLink: e.target.value } : null)}
                />
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono block mb-1">{L('Technologies (comma separated)', 'التقنيات (مفصولة بفاصلة)')}</label>
                <input
                  className="input input-bordered input-sm w-full bg-base-100 text-xs rounded-xl"
                  value={editingProject.technologies ? editingProject.technologies.join(', ') : ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : null)}
                />
              </div>
            </div>

            <div className="modal-action border-t border-base-300 pt-3 mt-4 gap-2">
              <button onClick={() => setEditingProject(null)} className={OUTLINE + ' btn-xs rounded-xl px-4 py-2'}>
                {L('Cancel', 'إلغاء')}
              </button>
              <button onClick={saveProjectEdit} className={PRIMARY + ' btn-xs rounded-xl px-4 py-2'}>
                {L('Save', 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


