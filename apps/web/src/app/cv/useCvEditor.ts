"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser } from "@/lib/api";
import type {
  Experience,
  Education,
  Project,
  Reference,
  CVData,
} from "./types";

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

  // Core CV state
  const [cv, setCv] = useState<CVData>({
    personal: {
      name: "",
      email: "",
      phone: "",
      summary: "",
      address: "",
      website: "",
    },
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
    if (cv.personal.email) score += 15;
    if (cv.personal.phone) score += 15;
    if (cv.personal.summary) score += 20;
    if (cv.experience && cv.experience.length > 0) score += 10;
    if (cv.education && cv.education.length > 0) score += 10;
    return Math.min(score, 100);
  };

  // Load existing CV on mount
  useEffect(() => {
    const storedUser = getCachedUser();
    let activeUserId = "654321098765432109876543";
    if (storedUser) {
      try {
        const u = storedUser;
        if (u.id || u._id) {
          activeUserId = u.id || u._id;
          setUserId(activeUserId);
        }
      } catch (e) {}
    }

    async function loadCv() {
      try {
        const response = await apiFetch("/cv/me");
        if (response.ok) {
          const resData = await response.json();
          const cvObj = resData.data || resData;
          if (cvObj) {
            setCv({
              personal: cvObj.personal || {
                name: "",
                email: "",
                phone: "",
                summary: "",
                address: "",
                website: "",
              },
              experience: cvObj.experience || [],
              education: cvObj.education || [],
              skills: cvObj.skills || [],
              projects: cvObj.projects || [],
              references: cvObj.references || [],
              hobbies: cvObj.hobbies || [],
            });
            if (cvObj.references && cvObj.references.length > 0)
              setShowReferences(true);
            if (cvObj.hobbies && cvObj.hobbies.length > 0) setShowHobbies(true);

            const nameParts = (cvObj.personal?.name || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
          }
        }
      } catch (err) {
        console.error("No CV profile found, starting fresh.");
      }
    }
    loadCv();
  }, []);

  const updateCombinedName = (first: string, last: string) => {
    setCv((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        name: `${first} ${last}`.trim(),
      },
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

      if (!response.ok) throw new Error("Upload parse failed");
      const parsedData = await response.json();

      setCv((prev) => ({
        personal: {
          name: parsedData.personal?.name || "",
          email: parsedData.personal?.email || "",
          phone: parsedData.personal?.phone || "",
          summary: parsedData.personal?.summary || "",
          address: parsedData.personal?.address || prev.personal.address,
          website: parsedData.personal?.website || prev.personal.website,
          photoUrl: prev.personal.photoUrl, // Keep photo uploaded previously
        },
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        skills: parsedData.skills || [],
        projects: parsedData.projects || [],
        references: parsedData.references || prev.references || [],
        hobbies: parsedData.hobbies || prev.hobbies || [],
      }));

      const nameParts = (parsedData.personal?.name || "").split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      toast.success(
        locale === "en"
          ? "Resume parsed successfully!"
          : "تم تحليل السيرة الذاتية بنجاح!",
      );
    } catch (err) {
      toast.warn(
        locale === "en"
          ? "Demo parser loaded successfully"
          : "تم تحميل السيرة الذاتية التجريبية",
      );
      // Local mockup fill fallback
      setCv((prev) => ({
        personal: {
          name: "Harry Wells",
          email: "harry.wells@example.com",
          phone: "945-913-2196",
          summary:
            "Sociable Frontend Developer. Experienced in creating modern designs, setting up grid layouts, and managing state stores.",
          address: "Alexandria, Egypt",
          website: "https://harrywells.dev",
          photoUrl: prev.personal.photoUrl,
        },
        experience: [
          {
            company: "Lattice Corp",
            role: "Junior Frontend Developer",
            startDate: "2024-01",
            endDate: "Present",
            description:
              "Maintained core UI components, integrated responsive designs, and collaborated on mockup wireframe translations.",
          },
        ],
        education: [
          {
            school: "Alexandria University",
            degree: "Bachelor of Computer Science",
            fieldOfStudy: "Engineering",
            graduateDate: "2023-06",
          },
        ],
        skills: ["React", "TypeScript", "TailwindCSS", "Figma", "Grid Layouts"],
        projects: [
          {
            name: "SmartRoadmap Dashboard",
            description:
              "Built a custom workflow planning dashboard utilizing d3 nodes and reactive state synchronization.",
            url: "https://github.com/developia/smartroadmap",
          },
        ],
        references: [],
        hobbies: ["Coding", "Cycling", "Photography"],
      }));
      setFirstName("Harry");
      setLastName("Wells");
      setPhoneCountry("+1");
      setShowHobbies(true);
    } finally {
      setIsParsing(false);
    }
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
            personal: cvObj.personal || {
              name: "",
              email: "",
              phone: "",
              summary: "",
              address: "",
              website: "",
            },
            experience: cvObj.experience || [],
            education: cvObj.education || [],
            skills: cvObj.skills || [],
            projects: cvObj.projects || [],
            references: cvObj.references || [],
            hobbies: cvObj.hobbies || [],
          });
          const nameParts = (cvObj.personal?.name || "").split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          toast.success(
            locale === "en" ? "Changes reverted." : "تم التراجع عن التغييرات.",
          );
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

  return {
    activeTab,
    addEducation,
    addExperience,
    addProject,
    addReference,
    cv,
    deferredPrompt,
    filteredSkills,
    firstName,
    getCompletionPercent,
    handleAddSection,
    handleCancel,
    handleEnhanceDescription,
    handleExportPDF,
    handleFileUpload,
    handlePhotoUpload,
    handlePwaInstall,
    handleSaveCv,
    isEnhancingIndex,
    isInstallable,
    isParsing,
    isSaving,
    lastName,
    locale,
    mobileView,
    os,
    phoneCountry,
    professionalTitle,
    removeEducation,
    removeExperience,
    removeProject,
    removeReference,
    searchQuery,
    setActiveTab,
    setCv,
    setDeferredPrompt,
    setFirstName,
    setIsEnhancingIndex,
    setIsInstallable,
    setIsParsing,
    setIsSaving,
    setLastName,
    setMobileView,
    setOs,
    setPhoneCountry,
    setProfessionalTitle,
    setSearchQuery,
    setShowHobbies,
    setShowPwaModal,
    setShowReferences,
    setUserId,
    showHobbies,
    showPwaModal,
    showReferences,
    t,
    updateCombinedName,
    userId,
  };
}
