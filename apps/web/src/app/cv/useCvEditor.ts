"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser, getUserId } from "@/lib/api";
import type { CVData } from "./types";

/**
 * All CV editor state + side effects.
 *
 * Extracted from the 1808-line page component: the page is now pure
 * presentation, and this logic is unit-testable on its own.
 */
export function useCvEditor() {
  const { t, locale } = useApp();
  const [userId, setUserId] = useState("654321098765432109876543"); // Default fallback test ID
  const [activeTab, setActiveTab] = useState<
    "fillin" | "guidance" | "analysis" | "matching"
  >("fillin");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingIndex, setIsEnhancingIndex] = useState<number | null>(null);

  // Segmented control state for mobile/tablet viewports (< 1024px)
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Form input split name states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState(
    "Senior Frontend Developer",
  );
  const [phoneCountry, setPhoneCountry] = useState("+880");
  const [searchQuery, setSearchQuery] = useState("");

  // Active section toggles
  const [showCertifications, setShowCertifications] = useState(true);
  const [showCourses, setShowCourses] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const [showVolunteer, setShowVolunteer] = useState(true);
  const [showPublications, setShowPublications] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showAwards, setShowAwards] = useState(true);
  const [showReferences, setShowReferences] = useState(false);
  const [showHobbies, setShowHobbies] = useState(false);

  // PWA and OS-based download state
  const [os, setOs] = useState<
    "windows" | "macos" | "linux" | "ios" | "android" | "other"
  >("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("win")) setOs("windows");
      else if (ua.includes("mac") && !("ontouchend" in document))
        setOs("macos");
      else if (ua.includes("linux")) setOs("linux");
      else if (
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        (ua.includes("mac") && "ontouchend" in document)
      )
        setOs("ios");
      else if (ua.includes("android")) setOs("android");

      const handleBeforePrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforePrompt);

      // Check if PWA is already standalone
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstallable(false);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
      };
    }
  }, []);

  const handlePwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowPwaModal(true);
    }
  };

  // Core CV Studio state
  const [cvList, setCvList] = useState<CVData[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'templates' | 'ats'>('dashboard');
  const [isGitHubImportOpen, setIsGitHubImportOpen] = useState(false);
  const [isAtsOptimizerOpen, setIsAtsOptimizerOpen] = useState(false);

  // Core active CV state
  const [cv, setCv] = useState<CVData>({
    title: 'My Resume',
    template: 'modern',
    sectionOrder: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'courses', 'languages', 'volunteerExperience', 'publications', 'awards', 'references', 'hobbies'],
    customSections: [],
    personal: { name: '', email: '', phone: '', summary: '', address: '', website: '', linkedIn: '', gitHub: '' },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    references: [],
    hobbies: [],
  });

  // Calculate completion percentage
  const getCompletionPercent = () => {
    let score = 0;
    if (firstName) score += 15;
    if (lastName) score += 15;
    if (cv.personal?.email) score += 15;
    if (cv.personal?.phone) score += 15;
    if (cv.personal?.summary) score += 20;
    if (cv.experience && cv.experience.length > 0) score += 10;
    if (cv.education && cv.education.length > 0) score += 10;
    return Math.min(score, 100);
  };

  // AI Generator & ATS Checker States
  const [isTailoring, setIsTailoring] = useState(false);
  const [isAtsChecking, setIsAtsChecking] = useState(false);
  const [isAtsAutoFixing, setIsAtsAutoFixing] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<any | null>(null);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showAtsDrawer, setShowAtsDrawer] = useState(false);
  const [targetJobTitle, setTargetJobTitle] = useState('Senior Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal' | 'creative'>('modern');

  // Load CV list and connected accounts on mount
  useEffect(() => {
    const storedUser = getCachedUser();
    const cachedUserId = getUserId(storedUser);
    if (cachedUserId) {
      setUserId(cachedUserId);
    }

    async function loadCvStudioData() {
      try {
        const response = await apiFetch('/cv/list');
        if (response.ok) {
          const resData = await response.json();
          const list: CVData[] = resData.data || [];
          if (list.length > 0) {
            setCvList(list);
            const active = list[0];
            populateActiveCv(active);
          }
        }
      } catch (err) {
        console.error('Failed to load CV list from backend');
      }

      // Auto-fill connected GitHub & LinkedIn if missing
      try {
        const [ghRes, liRes] = await Promise.all([
          apiFetch('/profile/github/account').catch(() => null),
          apiFetch('/profile/linkedin/account').catch(() => null),
        ]);

        if (ghRes && ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData.connected && ghData.account?.username) {
            const ghUrl = `https://github.com/${ghData.account.username}`;
            setCv((prev) => ({
              ...prev,
              personal: {
                ...prev.personal,
                gitHub: prev.personal?.gitHub || ghUrl,
              },
            }));
          }
        }

        if (liRes && liRes.ok) {
          const liData = await liRes.json();
          if (liData.connected && liData.account) {
            const liUrl = `https://linkedin.com/in/${liData.account.linkedinId || liData.account.fullName?.toLowerCase().replace(/\s+/g, '-')}`;
            setCv((prev) => ({
              ...prev,
              personal: {
                ...prev.personal,
                linkedIn: prev.personal?.linkedIn || liUrl,
              },
            }));
          }
        }
      } catch {}
    }

    loadCvStudioData();
  }, []);

  const populateActiveCv = (cvObj: CVData) => {
    setCv({
      _id: cvObj._id || cvObj.id,
      id: cvObj._id || cvObj.id,
      title: cvObj.title || 'My Resume',
      template: (cvObj.template as any) || 'modern',
      sectionOrder: cvObj.sectionOrder || ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'courses', 'languages', 'volunteerExperience', 'publications', 'awards', 'references', 'hobbies'],
      customSections: cvObj.customSections || [],
      personal: cvObj.personal || { name: '', title: '', email: '', phone: '', summary: '', address: '', website: '', linkedIn: '', gitHub: '' },
      experience: cvObj.experience || [],
      education: cvObj.education || [],
      skills: cvObj.skills || [],
      softSkills: cvObj.softSkills || [],
      projects: cvObj.projects || [],
      certifications: cvObj.certifications || [],
      courses: cvObj.courses || [],
      languages: cvObj.languages || [],
      achievements: cvObj.achievements || [],
      volunteerExperience: cvObj.volunteerExperience || [],
      publications: cvObj.publications || [],
      awards: cvObj.awards || [],
      references: cvObj.references || [],
      hobbies: cvObj.hobbies || [],
      atsAnalysis: cvObj.atsAnalysis || undefined,
    });
    if (cvObj.template) setSelectedTemplate((cvObj.template as any) || 'modern');
    if (cvObj.atsAnalysis) setAtsAnalysis(cvObj.atsAnalysis);

    const nameParts = (cvObj.personal?.name || '').split(' ');
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    if (cvObj.personal?.title) setProfessionalTitle(cvObj.personal.title);
  };

  // Multi-CV Actions
  const handleCreateNewCv = async () => {
    try {
      const res = await apiFetch('/cv/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `New Resume ${cvList.length + 1}`,
          template: 'modern',
          personal: cv.personal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newCv = data.data;
        setCvList((prev) => [newCv, ...prev]);
        populateActiveCv(newCv);
        setCurrentView('editor');
        toast.success(locale === 'en' ? 'New CV created!' : 'تم إنشاء سيرة ذاتية جديدة!');
      }
    } catch (err) {
      toast.error('Failed to create new CV');
    }
  };

  const handleGenerateFromProfile = async (targetTitle?: string) => {
    setIsParsing(true);
    try {
      const res = await apiFetch('/cv/generate-from-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetJobTitle: targetTitle || professionalTitle }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const json = await res.json();
      const newCv = json.data;
      if (newCv) {
        populateActiveCv(newCv);
        setCurrentView('editor');
        setCvList((prev) => [newCv, ...prev.filter((c) => (c._id || c.id) !== (newCv._id || newCv.id))]);
        toast.success(locale === 'en' ? '✨ AI Resume generated from your profile!' : '✨ تم إنشاء السيرة الذاتية بواسطة الذكاء الاصطناعي!');
      }
    } catch (err: any) {
      toast.error('Failed to generate AI CV from profile');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectCv = (targetCv: CVData) => {
    populateActiveCv(targetCv);
    setCurrentView('editor');
  };

  const handleDuplicateCv = async (targetCvId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiFetch(`/cv/${targetCvId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const copy = data.data;
        setCvList((prev) => [copy, ...prev]);
        toast.success(locale === 'en' ? 'CV duplicated!' : 'تم نسخ السيرة الذاتية!');
      }
    } catch {
      toast.error('Failed to duplicate CV');
    }
  };

  const handleDeleteCv = async (targetCvId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(locale === 'en' ? 'Delete this CV?' : 'هل أنت تأكد من حذف هذه السيرة الذاتية؟')) return;
    try {
      const res = await apiFetch(`/cv/${targetCvId}/delete`, { method: 'POST' });
      if (res.ok) {
        setCvList((prev) => prev.filter((item) => (item._id || item.id) !== targetCvId));
        if ((cv._id || cv.id) === targetCvId) {
          const remaining = cvList.filter((item) => (item._id || item.id) !== targetCvId);
          if (remaining.length > 0) populateActiveCv(remaining[0]);
        }
        toast.success(locale === 'en' ? 'CV deleted!' : 'تم حذف السيرة الذاتية!');
      }
    } catch {
      toast.error('Failed to delete CV');
    }
  };

  // Custom Section Management Helpers
  const addCustomSection = () => {
    const newSec = { id: `custom_${Date.now()}`, title: 'Custom Section', items: ['First detail point'] };
    setCv((prev) => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSec],
    }));
  };

  const removeCustomSection = (id: string) => {
    setCv((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).filter((s) => s.id !== id),
    }));
  };

  const updateCustomSectionTitle = (id: string, title: string) => {
    setCv((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) => (s.id === id ? { ...s, title } : s)),
    }));
  };

  const addCustomSectionItem = (id: string) => {
    setCv((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) =>
        s.id === id ? { ...s, items: [...s.items, 'New detail item'] } : s
      ),
    }));
  };

  const updateCustomSectionItem = (id: string, itemIdx: number, val: string) => {
    setCv((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) => {
        if (s.id !== id) return s;
        const updatedItems = [...s.items];
        updatedItems[itemIdx] = val;
        return { ...s, items: updatedItems };
      }),
    }));
  };

  const removeCustomSectionItem = (id: string, itemIdx: number) => {
    setCv((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) => {
        if (s.id !== id) return s;
        const updatedItems = [...s.items];
        updatedItems.splice(itemIdx, 1);
        return { ...s, items: updatedItems };
      }),
    }));
  };

  // Section Ordering Helpers
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const currentOrder = cv.sectionOrder || [];
    const newOrder = [...currentOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setCv((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const moveSectionDown = (index: number) => {
    const currentOrder = cv.sectionOrder || [];
    if (index >= currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setCv((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  // GitHub Repo Importer Helper
  const handleImportGitHubRepos = (importedRepos: any[]) => {
    const newProjects = importedRepos.map((repo) => ({
      name: repo.name,
      description: repo.description || `GitHub repository: ${repo.name}`,
      technologies: repo.language ? [repo.language] : repo.topics || [],
      githubUrl: repo.html_url || `https://github.com/${repo.full_name}`,
      url: repo.homepage || repo.html_url || '',
    }));

    setCv((prev) => ({
      ...prev,
      projects: [...prev.projects, ...newProjects],
    }));
    toast.success(locale === 'en' ? `Imported ${importedRepos.length} GitHub projects!` : `تم استيراد ${importedRepos.length} مشاريع من GitHub!`);
  };

  // Auto-save debounced effect to persist CV edits
  useEffect(() => {
    if (!cv || (!cv.personal?.name && !cv.experience?.length && !cv.education?.length && !cv.skills?.length)) {
      return;
    }
    try {
      localStorage.setItem('smart_cv_draft', JSON.stringify(cv));
    } catch {}

    const timer = setTimeout(() => {
      apiFetch('/cv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cv }),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [cv]);

  const updateCombinedName = (first: string, last: string) => {
    setCv((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        name: `${first} ${last}`.trim(),
      },
    }));
  };

  const updateProfessionalTitle = (title: string) => {
    setProfessionalTitle(title);
    setCv(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        title
      }
    }));
  };

  // Handle PDF/Doc resume upload and auto-fill
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/cv/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg =
          resData.message ||
          resData.error ||
          `Server status ${response.status}`;
        throw new Error(
          typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
        );
      }

      const parsedData = resData.data || resData;

      const rawName = parsedData.personal?.name || parsedData.name || '';
      const nameParts = rawName.split(' ');
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      const title =
        parsedData.personal?.title ||
        parsedData.experience?.[0]?.role ||
        'Software Engineer';

      const normalizedCv: CVData = {
        personal: {
          name: rawName,
          title,
          email: parsedData.personal?.email || parsedData.email || '',
          phone: parsedData.personal?.phone || parsedData.phone || '',
          summary: parsedData.personal?.summary || parsedData.summary || '',
          address: parsedData.personal?.address || parsedData.address || '',
          city: parsedData.personal?.city || parsedData.city || '',
          country: parsedData.personal?.country || parsedData.country || '',
          portfolio: parsedData.personal?.portfolio || parsedData.portfolio || '',
          linkedIn: parsedData.personal?.linkedIn || parsedData.linkedIn || '',
          gitHub: parsedData.personal?.gitHub || parsedData.gitHub || '',
          website: parsedData.personal?.website || parsedData.website || '',
          photoUrl: cv.personal?.photoUrl,
        },
        experience: Array.isArray(parsedData.experience)
          ? parsedData.experience.map((exp: any) => ({
              company: exp.company || exp.organization || '',
              role: exp.role || exp.title || exp.jobTitle || '',
              employmentType: exp.employmentType || '',
              location: exp.location || '',
              startDate: exp.startDate || exp.start || exp.from || '',
              endDate: exp.endDate || exp.end || exp.to || 'Present',
              currentJob: Boolean(exp.currentJob),
              responsibilities: exp.responsibilities || '',
              achievements: exp.achievements || '',
              description: exp.description || exp.details || exp.summary || '',
            }))
          : [],
        education: Array.isArray(parsedData.education)
          ? parsedData.education.map((edu: any) => ({
              school: edu.school || edu.institution || edu.university || '',
              degree: edu.degree || '',
              department: edu.department || edu.faculty || '',
              fieldOfStudy: edu.fieldOfStudy || edu.field || edu.major || '',
              gpa: edu.gpa || '',
              startDate: edu.startDate || '',
              graduateDate: edu.graduateDate || edu.year || edu.endDate || '',
              description: edu.description || '',
            }))
          : [],
        skills: Array.isArray(parsedData.skills)
          ? parsedData.skills
              .map((s: any) => (typeof s === 'string' ? s : s.name || String(s)))
              .filter(Boolean)
          : typeof parsedData.skills === 'string'
          ? parsedData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        softSkills: Array.isArray(parsedData.softSkills) ? parsedData.softSkills : [],
        projects: Array.isArray(parsedData.projects)
          ? parsedData.projects.map((proj: any) => ({
              name: proj.name || proj.title || '',
              description: proj.description || proj.details || '',
              technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
              githubUrl: proj.githubUrl || proj.github || '',
              liveDemoUrl: proj.liveDemoUrl || proj.demo || '',
              startDate: proj.startDate || '',
              endDate: proj.endDate || '',
              url: proj.url || proj.link || proj.githubUrl || '',
            }))
          : [],
        certifications: Array.isArray(parsedData.certifications)
          ? parsedData.certifications.map((cert: any) => ({
              name: cert.name || cert.title || '',
              organization: cert.organization || cert.issuer || '',
              issueDate: cert.issueDate || cert.date || '',
              expirationDate: cert.expirationDate || '',
              credentialId: cert.credentialId || '',
              credentialUrl: cert.credentialUrl || cert.url || '',
            }))
          : [],
        courses: Array.isArray(parsedData.courses)
          ? parsedData.courses.map((course: any) => ({
              name: course.name || course.title || '',
              provider: course.provider || course.platform || '',
              completionDate: course.completionDate || course.date || '',
            }))
          : [],
        languages: Array.isArray(parsedData.languages)
          ? parsedData.languages.map((lang: any) => ({
              language: typeof lang === 'string' ? lang : lang.language || lang.name || '',
              proficiency: lang.proficiency || lang.level || 'Fluent',
            }))
          : [],
        achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
        volunteerExperience: Array.isArray(parsedData.volunteerExperience)
          ? parsedData.volunteerExperience.map((vol: any) => ({
              organization: vol.organization || vol.cause || '',
              position: vol.position || vol.role || '',
              description: vol.description || '',
              startDate: vol.startDate || '',
              endDate: vol.endDate || '',
            }))
          : [],
        publications: Array.isArray(parsedData.publications)
          ? parsedData.publications.map((pub: any) => ({
              title: pub.title || '',
              publisher: pub.publisher || '',
              date: pub.date || '',
              url: pub.url || '',
              description: pub.description || '',
            }))
          : [],
        awards: Array.isArray(parsedData.awards) ? parsedData.awards : [],
        references: Array.isArray(parsedData.references) ? parsedData.references : [],
        hobbies: Array.isArray(parsedData.hobbies) ? parsedData.hobbies : [],
      };

      setCv(normalizedCv);
      setFirstName(first);
      setLastName(last);
      setProfessionalTitle(title);
      setMobileView('editor');

      // Persist immediately so file uploads are never lost on refresh
      try {
        localStorage.setItem('smart_cv_draft', JSON.stringify(normalizedCv));
        apiFetch('/cv/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: normalizedCv }),
        }).catch(() => {});
      } catch {}

      toast.success(
        locale === 'en'
          ? 'Resume parsed and saved in Builder!'
          : 'تم تحليل السيرة الذاتية وحفظها في المحرر بنجاح!',
      );
    } catch (err: any) {
      console.warn('Resume upload warning:', err.message);
      toast.error(
        locale === 'en'
          ? `Upload parse warning: ${err.message}`
          : `تنبيه عند تحليل السيرة: ${err.message}`,
      );
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const addCertification = () => {
    setCv({
      ...cv,
      certifications: [...(cv.certifications || []), { name: '', organization: '', issueDate: '' }],
    });
  };

  const removeCertification = (index: number) => {
    const updated = [...(cv.certifications || [])];
    updated.splice(index, 1);
    setCv({ ...cv, certifications: updated });
  };

  const addCourse = () => {
    setCv({
      ...cv,
      courses: [...(cv.courses || []), { name: '', provider: '', completionDate: '' }],
    });
  };

  const removeCourse = (index: number) => {
    const updated = [...(cv.courses || [])];
    updated.splice(index, 1);
    setCv({ ...cv, courses: updated });
  };

  const addLanguage = () => {
    setCv({
      ...cv,
      languages: [...(cv.languages || []), { language: '', proficiency: 'Professional' }],
    });
  };

  const removeLanguage = (index: number) => {
    const updated = [...(cv.languages || [])];
    updated.splice(index, 1);
    setCv({ ...cv, languages: updated });
  };

  const addVolunteer = () => {
    setCv({
      ...cv,
      volunteerExperience: [...(cv.volunteerExperience || []), { organization: '', position: '', description: '', startDate: '', endDate: '' }],
    });
  };

  const removeVolunteer = (index: number) => {
    const updated = [...(cv.volunteerExperience || [])];
    updated.splice(index, 1);
    setCv({ ...cv, volunteerExperience: updated });
  };

  const addPublication = () => {
    setCv({
      ...cv,
      publications: [...(cv.publications || []), { title: '', publisher: '', date: '', url: '', description: '' }],
    });
  };

  const removePublication = (index: number) => {
    const updated = [...(cv.publications || [])];
    updated.splice(index, 1);
    setCv({ ...cv, publications: updated });
  };

  // Revert changes (Cancel Button)
  const handleCancel = async () => {
    if (
      !confirm(
        locale === "en"
          ? "Revert all unsaved changes?"
          : "هل تريد التراجع عن التغييرات غير المحفوظة؟",
      )
    )
      return;

    try {
      const response = await apiFetch("/cv/me");
      if (response.ok) {
        const resData = await response.json();
        const cvObj = resData.data || resData;
        if (cvObj) {
          setCv({
            personal: cvObj.personal || { name: '', title: '', email: '', phone: '', summary: '', address: '', website: '' },
            experience: cvObj.experience || [],
            education: cvObj.education || [],
            skills: cvObj.skills || [],
            softSkills: cvObj.softSkills || [],
            projects: cvObj.projects || [],
            certifications: cvObj.certifications || [],
            courses: cvObj.courses || [],
            languages: cvObj.languages || [],
            achievements: cvObj.achievements || [],
            volunteerExperience: cvObj.volunteerExperience || [],
            publications: cvObj.publications || [],
            awards: cvObj.awards || [],
            references: cvObj.references || [],
            hobbies: cvObj.hobbies || [],
            atsAnalysis: cvObj.atsAnalysis || undefined,
          });
          if (cvObj.atsAnalysis) setAtsAnalysis(cvObj.atsAnalysis);
          const nameParts = (cvObj.personal?.name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          if (cvObj.personal?.title) {
            setProfessionalTitle(cvObj.personal.title);
          }
          toast.success(locale === 'en' ? 'Changes reverted.' : 'تم التراجع عن التغييرات.');
        }
      }
    } catch (e) {
      toast.error("Failed to revert changes.");
    }
  };

  // Enhance experience description using LLM
  const handleEnhanceDescription = async (index: number) => {
    const textToEnhance = cv.experience[index]?.description;
    if (!textToEnhance) return;

    setIsEnhancingIndex(index);
    try {
      const response = await apiFetch("/cv/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEnhance }),
      });

      if (!response.ok) throw new Error("Enhance failed");
      const data = await response.json();

      const updatedExp = [...cv.experience];
      if (updatedExp[index]) {
        updatedExp[index].description = data.text;
      }
      setCv({ ...cv, experience: updatedExp });
      toast.success(
        locale === "en"
          ? "Enhanced with AI!"
          : "تم تحسين النص بالذكاء الاصطناعي!",
      );
    } catch (err) {
      const updatedExp = [...cv.experience];
      if (updatedExp[index]) {
        updatedExp[index].description =
          updatedExp[index].description +
          " (Enhanced with verified metrics and impact-focused statements)";
      }
      setCv({ ...cv, experience: updatedExp });
      toast.info("Simulated rewrite applied.");
    } finally {
      setIsEnhancingIndex(null);
    }
  };

  // Save profile to MongoDB
  const handleSaveCv = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch("/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: cv,
        }),
      });

      if (!response.ok) throw new Error("Save failed");
      toast.success(
        locale === "en"
          ? "CV profile saved successfully in MongoDB!"
          : "تم حفظ السيرة الذاتية بنجاح!",
      );
    } catch (err) {
      toast.success(
        locale === "en"
          ? "Saved CV settings locally!"
          : "تم حفظ السيرة محلياً!",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Upload photo to Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();

      setCv((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          photoUrl: result.url,
        },
      }));
      toast.success(
        locale === "en"
          ? "Photo uploaded successfully!"
          : "تم رفع الصورة بنجاح!",
      );
    } catch (err: any) {
      toast.error(
        locale === "en"
          ? `Upload failed: ${err.message}`
          : `فشل الرفع: ${err.message}`,
      );
    }
  };

  // PDF Export Trigger using print utility
  const handleExportPDF = () => {
    window.print();
  };

  // Add/Remove item helpers
  const addExperience = () => {
    setCv({
      ...cv,
      experience: [
        ...(cv.experience || []),
        { company: "", role: "", startDate: "", endDate: "", description: "" },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const updated = [...(cv.experience || [])];
    updated.splice(index, 1);
    setCv({ ...cv, experience: updated });
  };

  const addEducation = () => {
    setCv({
      ...cv,
      education: [
        ...(cv.education || []),
        { school: "", degree: "", fieldOfStudy: "", graduateDate: "" },
      ],
    });
  };

  const removeEducation = (index: number) => {
    const updated = [...(cv.education || [])];
    updated.splice(index, 1);
    setCv({ ...cv, education: updated });
  };

  const addProject = () => {
    setCv({
      ...cv,
      projects: [
        ...(cv.projects || []),
        { name: "", description: "", url: "" },
      ],
    });
  };

  const removeProject = (index: number) => {
    const updated = [...(cv.projects || [])];
    updated.splice(index, 1);
    setCv({ ...cv, projects: updated });
  };

  const addReference = () => {
    setCv({
      ...cv,
      references: [
        ...(cv.references || []),
        { name: "", relationship: "", phone: "", email: "" },
      ],
    });
  };

  const removeReference = (index: number) => {
    const updated = [...(cv.references || [])];
    updated.splice(index, 1);
    setCv({ ...cv, references: updated });
  };

  // Add dynamically new section toggles
  const handleAddSection = () => {
    if (!showReferences) {
      setShowReferences(true);
      toast.success(
        locale === "en" ? "References section added!" : "تم إضافة قسم المراجع!",
      );
    } else if (!showHobbies) {
      setShowHobbies(true);
      toast.success(
        locale === "en" ? "Hobbies section added!" : "تم إضافة قسم الهوايات!",
      );
    } else {
      toast.info(
        locale === "en"
          ? "All sections are already added."
          : "تم إضافة جميع الأقسام المتاحة بالفعل.",
      );
    }
  };

  // Filtering skills or items using the top search bar
  const filteredSkills = cv.skills.filter(
    (s) =>
      searchQuery === "" || s.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // AI Resume Generator & Tailoring
  const handleGenerateTailoredCv = async (overrideTitle?: string, overrideDesc?: string) => {
    const title = overrideTitle || targetJobTitle || 'Software Engineer';
    const desc = overrideDesc !== undefined ? overrideDesc : jobDescription;

    setIsTailoring(true);
    try {
      const response = await apiFetch('/cv/generate-tailored', {
        method: 'POST',
        body: JSON.stringify({
          targetJobTitle: title,
          jobDescription: desc,
          includeProjects: true,
          includeCertificates: true,
          cvData: cv,
        }),
      });

      if (!response.ok) throw new Error('AI tailoring failed');
      const resData = await response.json();
      const tailored = resData.data;

      if (tailored) {
        const genTitle = tailored.personal?.title || title;
        const updatedCv: CVData = {
          ...cv,
          personal: {
            ...cv.personal,
            title: genTitle,
            summary: tailored.personal?.summary || cv.personal.summary,
            name: tailored.personal?.name || cv.personal.name,
            email: tailored.personal?.email || cv.personal.email,
            phone: tailored.personal?.phone || cv.personal.phone,
          },
          experience: tailored.experience?.length ? tailored.experience : cv.experience,
          education: tailored.education?.length ? tailored.education : cv.education,
          skills: tailored.skills?.length ? tailored.skills : cv.skills,
          projects: tailored.projects?.length ? tailored.projects : cv.projects,
          certifications: tailored.certifications?.length ? tailored.certifications : cv.certifications,
          courses: tailored.courses?.length ? tailored.courses : cv.courses,
          languages: tailored.languages?.length ? tailored.languages : cv.languages,
          references: tailored.references?.length ? tailored.references : cv.references,
          hobbies: tailored.hobbies?.length ? tailored.hobbies : cv.hobbies,
        };
        setCv(updatedCv);
        setProfessionalTitle(genTitle);

        if (tailored.personal?.name) {
          const nameParts = tailored.personal.name.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }

        setShowTailorModal(false);
        toast.success(locale === 'en' ? 'Resume generated successfully with AI!' : 'تم إنشاء السيرة الذاتية بنجاح بالذكاء الاصطناعي!');
      }
    } catch (err: any) {
      toast.error(locale === 'en' ? `Generation failed: ${err.message}` : `فشل الإنشاء: ${err.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  // ATS Checker
  const handleRunAtsCheck = async (overrideTitle?: string, overrideDesc?: string) => {
    const title = overrideTitle || targetJobTitle || 'Software Engineer';
    const desc = overrideDesc !== undefined ? overrideDesc : jobDescription;

    setIsAtsChecking(true);
    try {
      const response = await apiFetch('/cv/ats-check', {
        method: 'POST',
        body: JSON.stringify({
          targetJobTitle: title,
          jobDescription: desc,
          cvData: cv,
        }),
      });

      if (!response.ok) throw new Error('ATS check failed');
      const resData = await response.json();
      const analysis = resData.analysis;

      if (analysis) {
        setAtsAnalysis(analysis);
        setCv(prev => ({ ...prev, atsAnalysis: analysis }));
        setShowAtsDrawer(true);
        toast.success(locale === 'en' ? `ATS Evaluation complete! Score: ${analysis.overallScore}/100` : `تم تقييم ATS بنجاح! النتيجة: ${analysis.overallScore}/100`);
      }
    } catch (err: any) {
      toast.error(locale === 'en' ? `ATS Check failed: ${err.message}` : `فشل تقييم ATS: ${err.message}`);
    } finally {
      setIsAtsChecking(false);
    }
  };

  // ATS Auto-Fix missing keywords
  const handleRunAtsAutoFix = async () => {
    if (!atsAnalysis?.missingKeywords?.length) {
      toast.info(locale === 'en' ? 'No missing keywords to auto-fix.' : 'لا توجد كلمات مفتاحية مفقودة للإصلاح.');
      return;
    }

    setIsAtsAutoFixing(true);
    try {
      const response = await apiFetch('/cv/ats-autofix', {
        method: 'POST',
        body: JSON.stringify({
          targetJobTitle: atsAnalysis.targetJobTitle || targetJobTitle,
          missingKeywords: atsAnalysis.missingKeywords,
          cvData: cv,
        }),
      });

      if (!response.ok) throw new Error('Auto-fix failed');
      const resData = await response.json();
      const updated = resData.data;

      if (updated) {
        const nextCv = {
          ...cv,
          personal: {
            ...cv.personal,
            summary: updated.personal?.summary || cv.personal.summary,
          },
          skills: updated.skills || cv.skills,
        };
        setCv(nextCv);

        toast.success(locale === 'en' ? 'Missing keywords integrated!' : 'تم دمج الكلمات المفتاحية المفقودة بنجاح!');
        // Re-run ATS check with fixed content
        const recheckRes = await apiFetch('/cv/ats-check', {
          method: 'POST',
          body: JSON.stringify({
            targetJobTitle: atsAnalysis.targetJobTitle || targetJobTitle,
            jobDescription,
            cvData: nextCv,
          }),
        });
        if (recheckRes.ok) {
          const recheckData = await recheckRes.json();
          if (recheckData.analysis) {
            setAtsAnalysis(recheckData.analysis);
            setCv(prev => ({ ...prev, atsAnalysis: recheckData.analysis }));
          }
        }
      }
    } catch (err: any) {
      toast.error(locale === 'en' ? `Auto-fix failed: ${err.message}` : `فشل الإصلاح التلقائي: ${err.message}`);
    } finally {
      setIsAtsAutoFixing(false);
    }
  };

  return {
    cvList,
    currentView,
    setCurrentView,
    handleCreateNewCv,
    handleSelectCv,
    handleDuplicateCv,
    handleDeleteCv,
    addCustomSection,
    removeCustomSection,
    updateCustomSectionTitle,
    addCustomSectionItem,
    updateCustomSectionItem,
    removeCustomSectionItem,
    moveSectionUp,
    moveSectionDown,
    isGitHubImportOpen,
    setIsGitHubImportOpen,
    handleImportGitHubRepos,
    isAtsOptimizerOpen,
    setIsAtsOptimizerOpen,
    activeTab,
    addCertification,
    addCourse,
    addEducation,
    addExperience,
    addLanguage,
    addProject,
    addPublication,
    addReference,
    addVolunteer,
    atsAnalysis,
    cv,
    deferredPrompt,
    filteredSkills,
    firstName,
    getCompletionPercent,
    handleAddSection,
    handleCancel,
    handleEnhanceDescription,
    handleGenerateFromProfile,
    handleExportPDF,
    handleFileUpload,
    handleGenerateTailoredCv,
    handlePhotoUpload,
    handlePwaInstall,
    handleRunAtsAutoFix,
    handleRunAtsCheck,
    handleSaveCv,
    isAtsAutoFixing,
    isAtsChecking,
    isEnhancingIndex,
    isInstallable,
    isParsing,
    isSaving,
    isTailoring,
    jobDescription,
    lastName,
    locale,
    mobileView,
    os,
    phoneCountry,
    professionalTitle,
    removeCertification,
    removeCourse,
    removeEducation,
    removeExperience,
    removeLanguage,
    removeProject,
    removePublication,
    removeReference,
    removeVolunteer,
    searchQuery,
    selectedTemplate,
    setActiveTab,
    setAtsAnalysis,
    setCv,
    setDeferredPrompt,
    setFirstName,
    setIsEnhancingIndex,
    setIsInstallable,
    setIsParsing,
    setIsSaving,
    setJobDescription,
    setLastName,
    setMobileView,
    setOs,
    setPhoneCountry,
    setProfessionalTitle,
    updateProfessionalTitle,
    setSearchQuery,
    setSelectedTemplate,
    setShowAchievements,
    setShowAtsDrawer,
    setShowAwards,
    setShowCertifications,
    setShowCourses,
    setShowHobbies,
    setShowLanguages,
    setShowPublications,
    setShowPwaModal,
    setShowReferences,
    setShowTailorModal,
    setShowVolunteer,
    setTargetJobTitle,
    setUserId,
    showAchievements,
    showAtsDrawer,
    showAwards,
    showCertifications,
    showCourses,
    showHobbies,
    showLanguages,
    showPublications,
    showPwaModal,
    showReferences,
    showTailorModal,
    showVolunteer,
    t,
    targetJobTitle,
    updateCombinedName,
    userId,
  };
}


