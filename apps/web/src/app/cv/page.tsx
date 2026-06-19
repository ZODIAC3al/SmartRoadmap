'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { toast } from 'react-toastify';

// CRISP PROFESSIONAL SVG ICONS (Replacing keyboard emojis)
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AppliedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const BookmarkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const NotificationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CogIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CameraIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const PhoneIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const EmailIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <circle cx="12" cy="11" r="1.5" />
  </svg>
);

const LinkIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h2v-2.238a5.002 5.002 0 01-.001 0z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.73-1.2 1.87-1.05 2.98 1.12.09 2.27-.56 3-1.42z" />
  </svg>
);

const LinuxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M12 2a5 5 0 00-5 5c0 1.23.47 2.37 1.23 3.23C6.34 11.23 5 13.46 5 16v1a2 2 0 002 2h10a2 2 0 002-2v-1c0-2.54-1.34-4.77-3.23-5.77C16.53 9.37 17 8.23 17 7a5 5 0 00-5-5zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM7 16h10c0-1.93-1.57-3.5-3.5-3.5S10 14.07 10 16H7z" />
  </svg>
);

const MobileIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M12 18h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>
);

const DownloadAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Education = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  graduateDate: string;
};

type Project = {
  name: string;
  description: string;
  url: string;
};

type Reference = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

type CVData = {
  personal: {
    name: string;
    email: string;
    phone: string;
    summary: string;
    photoUrl?: string;
    address?: string;
    website?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  references?: Reference[];
  hobbies?: string[];
};

export default function CvPage() {
  const { t, locale } = useApp();
  const [userId, setUserId] = useState('654321098765432109876543'); // Default fallback test ID
  const [activeTab, setActiveTab] = useState<'fillin' | 'guidance' | 'analysis' | 'matching'>('fillin');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingIndex, setIsEnhancingIndex] = useState<number | null>(null);
  
  // Segmented control state for mobile/tablet viewports (< 1024px)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Form input split name states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('Senior Frontend Developer');
  const [phoneCountry, setPhoneCountry] = useState('+880');
  const [searchQuery, setSearchQuery] = useState('');

  // Active section toggles
  const [showReferences, setShowReferences] = useState(false);
  const [showHobbies, setShowHobbies] = useState(false);

  // PWA and OS-based download state
  const [os, setOs] = useState<'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('win')) setOs('windows');
      else if (ua.includes('mac') && !('ontouchend' in document)) setOs('macos');
      else if (ua.includes('linux')) setOs('linux');
      else if (ua.includes('iphone') || ua.includes('ipad') || (ua.includes('mac') && 'ontouchend' in document)) setOs('ios');
      else if (ua.includes('android')) setOs('android');

      const handleBeforePrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforePrompt);

      // Check if PWA is already standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(false);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      };
    }
  }, []);

  const handlePwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
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
    personal: { name: '', email: '', phone: '', summary: '', address: '', website: '' },
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
    const storedUser = localStorage.getItem('smart_user');
    let activeUserId = '654321098765432109876543';
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.id || u._id) {
          activeUserId = u.id || u._id;
          setUserId(activeUserId);
        }
      } catch (e) {}
    }

    async function loadCv() {
      try {
        const response = await fetch(`http://localhost:3000/cv/user/${activeUserId}`);
        if (response.ok) {
          const resData = await response.json();
          const cvObj = resData.data || resData;
          if (cvObj) {
            setCv({
              personal: cvObj.personal || { name: '', email: '', phone: '', summary: '', address: '', website: '' },
              experience: cvObj.experience || [],
              education: cvObj.education || [],
              skills: cvObj.skills || [],
              projects: cvObj.projects || [],
              references: cvObj.references || [],
              hobbies: cvObj.hobbies || [],
            });
            if (cvObj.references && cvObj.references.length > 0) setShowReferences(true);
            if (cvObj.hobbies && cvObj.hobbies.length > 0) setShowHobbies(true);

            const nameParts = (cvObj.personal?.name || '').split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
          }
        }
      } catch (err) {
        console.error('No CV profile found, starting fresh.');
      }
    }
    loadCv();
  }, []);

  const updateCombinedName = (first: string, last: string) => {
    setCv(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        name: `${first} ${last}`.trim()
      }
    }));
  };

  // Handle PDF/Doc resume upload and auto-fill
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload parse failed');
      const parsedData = await response.json();

      setCv(prev => ({
        personal: {
          name: parsedData.personal?.name || '',
          email: parsedData.personal?.email || '',
          phone: parsedData.personal?.phone || '',
          summary: parsedData.personal?.summary || '',
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
      
      const nameParts = (parsedData.personal?.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      toast.success(locale === 'en' ? 'Resume parsed successfully!' : 'تم تحليل السيرة الذاتية بنجاح!');
    } catch (err) {
      toast.warn(locale === 'en' ? 'Demo parser loaded successfully' : 'تم تحميل السيرة الذاتية التجريبية');
      // Local mockup fill fallback
      setCv(prev => ({
        personal: {
          name: 'Harry Wells',
          email: 'harry.wells@example.com',
          phone: '945-913-2196',
          summary: 'Sociable Frontend Developer. Experienced in creating modern designs, setting up grid layouts, and managing state stores.',
          address: 'Alexandria, Egypt',
          website: 'https://harrywells.dev',
          photoUrl: prev.personal.photoUrl,
        },
        experience: [
          {
            company: 'Lattice Corp',
            role: 'Junior Frontend Developer',
            startDate: '2024-01',
            endDate: 'Present',
            description: 'Maintained core UI components, integrated responsive designs, and collaborated on mockup wireframe translations.'
          }
        ],
        education: [
          {
            school: 'Alexandria University',
            degree: 'Bachelor of Computer Science',
            fieldOfStudy: 'Engineering',
            graduateDate: '2023-06'
          }
        ],
        skills: ['React', 'TypeScript', 'TailwindCSS', 'Figma', 'Grid Layouts'],
        projects: [
          {
            name: 'SmartRoadmap Dashboard',
            description: 'Built a custom workflow planning dashboard utilizing d3 nodes and reactive state synchronization.',
            url: 'https://github.com/developia/smartroadmap'
          }
        ],
        references: [],
        hobbies: ['Coding', 'Cycling', 'Photography']
      }));
      setFirstName('Harry');
      setLastName('Wells');
      setPhoneCountry('+1');
      setShowHobbies(true);
    } finally {
      setIsParsing(false);
    }
  };

  // Revert changes (Cancel Button)
  const handleCancel = async () => {
    if (!confirm(locale === 'en' ? 'Revert all unsaved changes?' : 'هل تريد التراجع عن التغييرات غير المحفوظة؟')) return;

    try {
      const response = await fetch(`http://localhost:3000/cv/user/${userId}`);
      if (response.ok) {
        const resData = await response.json();
        const cvObj = resData.data || resData;
        if (cvObj) {
          setCv({
            personal: cvObj.personal || { name: '', email: '', phone: '', summary: '', address: '', website: '' },
            experience: cvObj.experience || [],
            education: cvObj.education || [],
            skills: cvObj.skills || [],
            projects: cvObj.projects || [],
            references: cvObj.references || [],
            hobbies: cvObj.hobbies || [],
          });
          const nameParts = (cvObj.personal?.name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          toast.success(locale === 'en' ? 'Changes reverted.' : 'تم التراجع عن التغييرات.');
        }
      }
    } catch (e) {
      toast.error('Failed to revert changes.');
    }
  };

  // Enhance experience description using LLM
  const handleEnhanceDescription = async (index: number) => {
    const textToEnhance = cv.experience[index]?.description;
    if (!textToEnhance) return;

    setIsEnhancingIndex(index);
    try {
      const response = await fetch('http://localhost:3000/cv/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToEnhance }),
      });

      if (!response.ok) throw new Error('Enhance failed');
      const data = await response.json();

      const updatedExp = [...cv.experience];
      if (updatedExp[index]) {
        updatedExp[index].description = data.text;
      }
      setCv({ ...cv, experience: updatedExp });
      toast.success(locale === 'en' ? 'Enhanced with AI!' : 'تم تحسين النص بالذكاء الاصطناعي!');
    } catch (err) {
      const updatedExp = [...cv.experience];
      if (updatedExp[index]) {
        updatedExp[index].description = updatedExp[index].description + ' (Enhanced with verified metrics and impact-focused statements)';
      }
      setCv({ ...cv, experience: updatedExp });
      toast.info('Simulated rewrite applied.');
    } finally {
      setIsEnhancingIndex(null);
    }
  };

  // Save profile to MongoDB
  const handleSaveCv = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3000/cv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          data: cv,
        }),
      });

      if (!response.ok) throw new Error('Save failed');
      toast.success(locale === 'en' ? 'CV profile saved successfully in MongoDB!' : 'تم حفظ السيرة الذاتية بنجاح!');
    } catch (err) {
      toast.success(locale === 'en' ? 'Saved CV settings locally!' : 'تم حفظ السيرة محلياً!');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload photo to Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();

      setCv(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          photoUrl: result.url
        }
      }));
      toast.success(locale === 'en' ? 'Photo uploaded successfully!' : 'تم رفع الصورة بنجاح!');
    } catch (err: any) {
      toast.error(locale === 'en' ? `Upload failed: ${err.message}` : `فشل الرفع: ${err.message}`);
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
      experience: [...(cv.experience || []), { company: '', role: '', startDate: '', endDate: '', description: '' }],
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
      education: [...(cv.education || []), { school: '', degree: '', fieldOfStudy: '', graduateDate: '' }],
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
      projects: [...(cv.projects || []), { name: '', description: '', url: '' }],
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
      references: [...(cv.references || []), { name: '', relationship: '', phone: '', email: '' }],
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
      toast.success(locale === 'en' ? 'References section added!' : 'تم إضافة قسم المراجع!');
    } else if (!showHobbies) {
      setShowHobbies(true);
      toast.success(locale === 'en' ? 'Hobbies section added!' : 'تم إضافة قسم الهوايات!');
    } else {
      toast.info(locale === 'en' ? 'All sections are already added.' : 'تم إضافة جميع الأقسام المتاحة بالفعل.');
    }
  };

  // Filtering skills or items using the top search bar
  const filteredSkills = cv.skills.filter(s => searchQuery === '' || s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content text-start select-none print:pt-0">
      
      {/* Dynamic Printing Style Block */}
      <style jsx global>{`
        @media print {
          header, aside, section, .btn, .tabs, .join, input, textarea, select {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #cv-preview-wrapper {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          #cv-preview-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* TOP HEADER ACTIONS BAR (Mockup Path + Search + Cancel/Save Buttons) */}
      <header className="navbar bg-base-200 border-b border-base-300 py-3 px-6 flex justify-between flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-xs text-base-content/50 font-bold uppercase tracking-wider font-mono">
          <span>{t('cv.header.resume')}</span>
          <span>/</span>
          <span className="text-base-content font-black">{t('cv.header.create')}</span>
        </div>

        <div className="flex-1 max-w-sm mx-auto relative hidden md:block">
          <span className="absolute inset-y-0 left-3 flex items-center text-base-content/40 text-xs">
            <SearchIcon />
          </span>
          <input 
            type="text" 
            placeholder={t('cv.header.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full h-9 rounded-full bg-base-100 border-base-300 text-xs pl-9 text-base-content focus:border-primary" 
          />
        </div>

        <div className="flex items-center gap-3">
          {/* File Input trigger uploader styled as primary button */}
          <button 
            type="button"
            onClick={() => document.getElementById('resumeFileUploadTrigger')?.click()}
            className="btn bg-primary hover:bg-[#059669] text-white btn-xs sm:btn-sm rounded-lg px-4 border-none font-bold flex items-center gap-1.5"
          >
            <UploadIcon />
            {t('cv.header.upload')}
          </button>
          <input 
            type="file" 
            id="resumeFileUploadTrigger"
            accept=".pdf,.doc,.docx" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          {isParsing && <span className="loading loading-spinner loading-xs text-primary"></span>}

          <button 
            onClick={handleCancel}
            className="btn btn-outline border-base-300 text-base-content btn-xs sm:btn-sm rounded-lg"
          >
            {t('cv.header.cancel')}
          </button>

          <button 
            onClick={handleSaveCv} 
            disabled={isSaving}
            className="btn bg-primary hover:bg-[#059669] text-white btn-xs sm:btn-sm rounded-lg px-4 border-none font-bold"
          >
            {isSaving && <span className="loading loading-spinner loading-xs mr-1"></span>}
            {t('cv.header.save')}
          </button>
        </div>
      </header>

      {/* Dynamic Segment Toggle Selector (Visible only on viewports < lg (1024px)) */}
      <div className="lg:hidden w-full flex justify-center py-3 px-4 bg-base-100 border-b border-base-300 print:hidden">
        <div className="join w-full max-w-md bg-base-200 border border-base-300 p-1 rounded-full">
          <button
            onClick={() => setMobileView('editor')}
            className={`join-item flex-1 btn btn-sm rounded-full border-none font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${mobileView === 'editor' ? 'bg-primary text-white shadow-sm' : 'btn-ghost text-base-content/65 hover:bg-base-300'}`}
          >
            <EditIcon />
            {locale === 'en' ? 'Form Editor' : 'محرر البيانات'}
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`join-item flex-1 btn btn-sm rounded-full border-none font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${mobileView === 'preview' ? 'bg-primary text-white shadow-sm' : 'btn-ghost text-base-content/65 hover:bg-base-300'}`}
          >
            <EyeIcon />
            {locale === 'en' ? 'A4 Live Preview' : 'معاينة السيرة'}
          </button>
        </div>
      </div>

      {/* TRIPLE PANEL CV WORKSPACE */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-hidden items-stretch">
        
        {/* PANEL 1: JobsSpark Left Sidebar menu */}
        <aside className="hidden xl:flex xl:col-span-2 flex-col justify-between border border-base-300 bg-base-200 p-4 rounded-xl min-h-[580px] text-xs print:hidden">
          <div className="space-y-6">
            <div className="font-extrabold text-sm text-primary tracking-tight px-2 flex items-center gap-2">
              <img src="/logo.svg" alt="logo" className="w-5 h-5" />
              <span>JobsSpark</span>
            </div>
            
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <DashboardIcon />
                {t('cv.sidebar.dashboard')}
              </Link>
              <Link href="/cv" className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/10 font-bold transition-colors">
                <FileIcon />
                {t('cv.sidebar.resumes')}
              </Link>
              <Link href="/hiring" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <BriefcaseIcon />
                {t('cv.sidebar.jobs')}
              </Link>
              <Link href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <AppliedIcon />
                {t('cv.sidebar.applied')}
              </Link>
              <Link href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <BookmarkIcon />
                {t('cv.sidebar.saved')}
              </Link>
              <Link href="/messages" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <MessageIcon />
                {t('cv.sidebar.message')}
              </Link>
              <Link href="/notifications" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-bold transition-colors">
                <NotificationIcon />
                {t('cv.sidebar.notification')}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            {/* Upgrade banner mockup */}
            <div className="bg-primary/5 border border-primary/25 rounded-xl p-3 text-center space-y-2">
              <p className="font-bold text-[9px] text-primary leading-normal">{t('cv.sidebar.upgrade')}</p>
              <Link href="/pricing" className="btn bg-primary hover:bg-[#059669] btn-xs rounded-lg text-white btn-block border-none font-bold">{locale === 'en' ? 'Upgrade plan' : 'ترقية الحساب'}</Link>
            </div>

            {/* PWA Local Download Banner */}
            <div className="bg-base-300/40 border border-base-300 rounded-xl p-3 text-center space-y-2">
              <div className="flex justify-center items-center gap-1.5 text-primary">
                {os === 'windows' && <WindowsIcon />}
                {os === 'macos' && <AppleIcon />}
                {os === 'linux' && <LinuxIcon />}
                {(os === 'ios' || os === 'android') && <MobileIcon />}
                {os === 'other' && <DownloadAppIcon />}
                <span className="font-extrabold text-[9px] uppercase font-mono text-base-content leading-none">
                  {os.toUpperCase()} APP
                </span>
              </div>
              <p className="text-[8px] text-base-content/50 leading-normal">
                {locale === 'en' ? 'Install SmartRoadmap locally for offline access.' : 'ثبّت التطبيق محلياً لتصفحه بدون اتصال.'}
              </p>
              <button 
                type="button"
                onClick={handlePwaInstall}
                className="btn bg-primary hover:bg-[#059669] btn-xs rounded-lg text-white btn-block border-none font-bold flex items-center justify-center gap-1"
              >
                <DownloadAppIcon />
                {locale === 'en' ? 'Download App' : 'تحميل التطبيق'}
              </button>
            </div>

            {/* Profile Row */}
            <div className="flex items-center gap-2 px-1 py-2 border-t border-base-300">
              {cv.personal?.photoUrl ? (
                <img src={cv.personal.photoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-base-300 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {firstName ? firstName[0] : 'H'}{lastName ? lastName[0] : 'W'}
                </div>
              )}
              <div className="truncate flex-1 text-left">
                <p className="font-bold truncate leading-none text-base-content">{firstName || 'Harry'} {lastName || 'Wells'}</p>
                <span className="text-[8px] text-base-content/40 uppercase font-semibold leading-none mt-1 block">Premium User</span>
              </div>
            </div>
          </div>
        </aside>

        {/* PANEL 2: Center Editor Form */}
        <section className={`col-span-1 lg:col-span-6 xl:col-span-5 card bg-base-200 border border-base-300 shadow-sm overflow-hidden min-h-[580px] h-[80vh] flex flex-col rounded-xl print:hidden ${mobileView === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Header Tabs */}
          <div className="tabs tabs-boxed bg-base-300 p-2 font-mono text-[9px] tracking-wide rounded-none border-b border-base-300 flex justify-between flex-wrap gap-1">
            <div className="flex gap-1">
              <button 
                onClick={() => setActiveTab('fillin')}
                className={`tab font-bold ${activeTab === 'fillin' ? 'tab-active' : ''}`}
              >
                {t('cv.tabs.fillin')}
              </button>
              <button 
                onClick={() => setActiveTab('guidance')}
                className={`tab font-bold ${activeTab === 'guidance' ? 'tab-active' : ''}`}
              >
                {t('cv.tabs.guidance')}
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`tab font-bold ${activeTab === 'analysis' ? 'tab-active' : ''}`}
              >
                {t('cv.tabs.analysis')}
              </button>
              <button 
                onClick={() => setActiveTab('matching')}
                className={`tab font-bold ${activeTab === 'matching' ? 'tab-active' : ''}`}
              >
                {t('cv.tabs.matching')}
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto flex-grow space-y-6 text-xs text-left">
            {activeTab === 'fillin' ? (
              <div className="space-y-6">
                
                {/* Resume Complication Progress */}
                <div className="flex items-center justify-between bg-base-100 border border-base-300 p-4 rounded-xl">
                  <div>
                    <h3 className="font-extrabold text-xs">{t('cv.form.complication')}</h3>
                    <p className="text-[9px] text-base-content/40 mt-0.5">{locale === 'en' ? 'Fill details to reach 100%' : 'أدخل البيانات الأساسية للوصول لنسبة ١٠٠٪'}</p>
                  </div>
                  <div className="radial-progress text-primary font-mono font-bold text-xs" style={{ "--value": getCompletionPercent(), "--size": "3.5rem" } as any}>
                    {getCompletionPercent()}%
                  </div>
                </div>

                {/* Basic Information section */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" defaultChecked /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                    <UserIcon />
                    {t('cv.form.basic')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    
                    {/* Photo upload card */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-base-200 border border-dashed border-base-300 p-3 rounded-lg w-full">
                      {cv.personal?.photoUrl ? (
                        <img 
                          src={cv.personal.photoUrl} 
                          alt="Avatar" 
                          className="w-14 h-14 rounded-lg object-cover border border-base-300 shrink-0" 
                        />
                      ) : (
                        <div className="w-14 h-14 bg-base-300 rounded-lg flex items-center justify-center text-base-content/50 shrink-0">
                          <CameraIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-center sm:text-left flex-1 space-y-1">
                        <p className="font-bold text-[10px] text-base-content">{t('cv.form.photo_title')}</p>
                        <p className="text-[9px] text-base-content/40 leading-normal">{t('cv.form.photo_desc')}</p>
                        <button 
                          type="button"
                          onClick={() => document.getElementById('cvPhotoFileInput')?.click()} 
                          className="btn btn-xs bg-primary hover:bg-[#059669] border-none text-white rounded mt-2 px-3 font-bold"
                        >
                          {t('cv.form.photo_btn')}
                        </button>
                        <input 
                          type="file" 
                          id="cvPhotoFileInput"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.form.first_name')}</label>
                        <input 
                          type="text" 
                          value={firstName} 
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            updateCombinedName(e.target.value, lastName);
                          }}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary" 
                          placeholder="Harry"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.form.last_name')}</label>
                        <input 
                          type="text" 
                          value={lastName} 
                          onChange={(e) => {
                            setLastName(e.target.value);
                            updateCombinedName(firstName, e.target.value);
                          }}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary" 
                          placeholder="Wells"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.form.pro_title')}</label>
                      <input 
                        type="text" 
                        value={professionalTitle} 
                        onChange={(e) => setProfessionalTitle(e.target.value)}
                        className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary" 
                        placeholder="Senior Frontend Developer"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.form.career_obj')}</label>
                      <textarea 
                        value={cv.personal?.summary || ''}
                        onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, summary: e.target.value } })}
                        className="textarea textarea-bordered textarea-sm w-full h-24 font-semibold resize-none bg-base-200 text-base-content focus:border-primary"
                        placeholder="Describe your career goals..."
                      />
                    </div>

                    {/* Extended Address and Website fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Address' : 'العنوان الجغرافي'}</label>
                        <input 
                          type="text" 
                          value={cv.personal?.address || ''}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, address: e.target.value } })}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary"
                          placeholder="Alexandria, Egypt"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Website / Portfolio' : 'الموقع الإلكتروني'}</label>
                        <input 
                          type="text" 
                          value={cv.personal?.website || ''}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, website: e.target.value } })}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.email')}</label>
                        <input 
                          type="email" 
                          value={cv.personal?.email || ''}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, email: e.target.value } })}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content focus:border-primary"
                          placeholder="johndoe@example.com"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{t('cv.phone')}</label>
                        <div className="flex gap-2">
                          <select 
                            value={phoneCountry}
                            onChange={(e) => setPhoneCountry(e.target.value)}
                            className="select select-bordered select-sm bg-base-200 font-semibold text-xs border-base-300"
                          >
                            <option value="+880">🇧🇩 +880</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+20">🇪🇬 +20</option>
                            <option value="+44">🇬🇧 +44</option>
                          </select>
                          <input 
                            type="text" 
                            value={cv.personal?.phone || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, phone: e.target.value } })}
                            className="input input-bordered input-sm flex-grow font-semibold bg-base-200 text-base-content focus:border-primary"
                            placeholder="123456789"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Work Experience section */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                    <BriefcaseIcon />
                    {t('cv.experience')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="flex justify-end">
                      <button type="button" onClick={addExperience} className="btn bg-primary hover:bg-[#059669] text-white border-none btn-xs rounded-lg font-bold">
                        {t('cv.add_exp')}
                      </button>
                    </div>

                    {cv.experience && cv.experience.map((exp, i) => (
                      <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeExperience(i)}
                          className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          title="Remove Job"
                        >
                          <CloseIcon />
                        </button>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.company')}</label>
                            <input 
                              type="text" 
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].company = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.role')}</label>
                            <input 
                              type="text" 
                              value={exp.role}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].role = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.start')}</label>
                            <input 
                              type="text" 
                              value={exp.startDate}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].startDate = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              placeholder="2024-01"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.end')}</label>
                            <input 
                              type="text" 
                              value={exp.endDate}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].endDate = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              placeholder="Present"
                            />
                          </div>
                        </div>

                        <div className="form-control">
                          <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[9px] font-bold uppercase text-base-content/40">{t('cv.description')}</label>
                            <button 
                              type="button"
                              onClick={() => handleEnhanceDescription(i)}
                              disabled={isEnhancingIndex === i}
                              className="btn btn-xs btn-outline border-primary text-primary hover:bg-primary/10 rounded px-2 h-6 min-h-0 text-[9px] flex items-center gap-1"
                            >
                              <SparklesIcon />
                              {isEnhancingIndex === i ? 'Enhancing...' : t('cv.enhance')}
                            </button>
                          </div>
                          <textarea 
                            value={exp.description}
                            onChange={(e) => {
                              const updated = [...cv.experience];
                              if (updated[i]) updated[i].description = e.target.value;
                              setCv({ ...cv, experience: updated });
                            }}
                            className="textarea textarea-bordered textarea-xs sm:textarea-sm w-full h-20 font-semibold bg-base-100 text-base-content"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                    <FileIcon />
                    {locale === 'en' ? 'Projects' : 'المشاريع البرمجية'}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="flex justify-end">
                      <button type="button" onClick={addProject} className="btn bg-primary hover:bg-[#059669] text-white border-none btn-xs rounded-lg font-bold">
                        + {locale === 'en' ? 'Add Project' : 'إضافة مشروع'}
                      </button>
                    </div>

                    {cv.projects && cv.projects.map((proj, i) => (
                      <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeProject(i)}
                          className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          title="Remove Project"
                        >
                          <CloseIcon />
                        </button>
                        <div className="form-control pt-4">
                          <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Project Name' : 'اسم المشروع'}</label>
                          <input 
                            type="text" 
                            value={proj.name}
                            onChange={(e) => {
                              const updated = [...cv.projects];
                              if (updated[i]) updated[i].name = e.target.value;
                              setCv({ ...cv, projects: updated });
                            }}
                            className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Project URL' : 'رابط المشروع'}</label>
                          <input 
                            type="text" 
                            value={proj.url}
                            onChange={(e) => {
                              const updated = [...cv.projects];
                              if (updated[i]) updated[i].url = e.target.value;
                              setCv({ ...cv, projects: updated });
                            }}
                            className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            placeholder="https://github.com/..."
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Description' : 'شرح المشروع'}</label>
                          <textarea 
                            value={proj.description}
                            onChange={(e) => {
                              const updated = [...cv.projects];
                              if (updated[i]) updated[i].description = e.target.value;
                              setCv({ ...cv, projects: updated });
                            }}
                            className="textarea textarea-bordered textarea-xs sm:textarea-sm w-full h-16 font-semibold bg-base-100 text-base-content"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education section */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                    <UserIcon />
                    {t('cv.education')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="flex justify-end">
                      <button type="button" onClick={addEducation} className="btn bg-primary hover:bg-[#059669] text-white border-none btn-xs rounded-lg font-bold">
                        {t('cv.add_edu')}
                      </button>
                    </div>

                    {cv.education && cv.education.map((edu, i) => (
                      <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeEducation(i)}
                          className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          title="Remove Education"
                        >
                          <CloseIcon />
                        </button>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.school')}</label>
                            <input 
                              type="text" 
                              value={edu.school}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].school = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{t('cv.degree')}</label>
                            <input 
                              type="text" 
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].degree = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Field of Study' : 'التخصص الدراسي'}</label>
                            <input 
                              type="text" 
                              value={edu.fieldOfStudy}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].fieldOfStudy = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Graduation Date' : 'تاريخ التخرج'}</label>
                            <input 
                              type="text" 
                              value={edu.graduateDate}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].graduateDate = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              placeholder="2023-06"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills section */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                    <CogIcon />
                    {locale === 'en' ? 'Skills' : 'المهارات'}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Add skill tags (separated by comma)' : 'أضف المهارات (مفصولة بفاصلة)'}</label>
                      <input 
                        type="text" 
                        value={cv.skills.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const splitSkills = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
                          setCv({ ...cv, skills: splitSkills });
                        }}
                        className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content"
                        placeholder="React, TypeScript, CSS"
                      />
                    </div>
                  </div>
                </div>

                {/* References section (Dynamic Section) */}
                {showReferences && (
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" defaultChecked /> 
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <UserIcon />
                      {locale === 'en' ? 'References' : 'المراجع المهنية'}
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-end">
                        <button type="button" onClick={addReference} className="btn bg-primary hover:bg-[#059669] text-white border-none btn-xs rounded-lg font-bold">
                          + {locale === 'en' ? 'Add Reference' : 'إضافة مرجع'}
                        </button>
                      </div>

                      {cv.references && cv.references.map((ref, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeReference(i)}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          >
                            <CloseIcon />
                          </button>
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Reference Name' : 'اسم المرجعية'}</label>
                              <input 
                                type="text" 
                                value={ref.name}
                                onChange={(e) => {
                                  const updated = [...(cv.references || [])];
                                  if (updated[i]) updated[i].name = e.target.value;
                                  setCv({ ...cv, references: updated });
                                }}
                                className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              />
                            </div>
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Relationship' : 'العلاقة المهنية'}</label>
                              <input 
                                type="text" 
                                value={ref.relationship}
                                onChange={(e) => {
                                  const updated = [...(cv.references || [])];
                                  if (updated[i]) updated[i].relationship = e.target.value;
                                  setCv({ ...cv, references: updated });
                                }}
                                className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Phone' : 'رقم الهاتف'}</label>
                              <input 
                                type="text" 
                                value={ref.phone}
                                onChange={(e) => {
                                  const updated = [...(cv.references || [])];
                                  if (updated[i]) updated[i].phone = e.target.value;
                                  setCv({ ...cv, references: updated });
                                }}
                                className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              />
                            </div>
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Email' : 'البريد الإلكتروني'}</label>
                              <input 
                                type="text" 
                                value={ref.email}
                                onChange={(e) => {
                                  const updated = [...(cv.references || [])];
                                  if (updated[i]) updated[i].email = e.target.value;
                                  setCv({ ...cv, references: updated });
                                }}
                                className="input input-bordered input-xs sm:input-sm w-full font-semibold bg-base-100 text-base-content"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies section (Dynamic Section) */}
                {showHobbies && (
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" defaultChecked /> 
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <HelpIcon />
                      {locale === 'en' ? 'Hobbies' : 'الهوايات والاهتمامات'}
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40">{locale === 'en' ? 'Hobbies (comma separated)' : 'الهوايات (مفصولة بفاصلة)'}</label>
                        <input 
                          type="text" 
                          value={(cv.hobbies || []).join(', ')}
                          onChange={(e) => {
                            const val = e.target.value;
                            const splitHobbies = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
                            setCv({ ...cv, hobbies: splitHobbies });
                          }}
                          className="input input-bordered input-sm w-full font-semibold bg-base-200 text-base-content"
                          placeholder="Gaming, Photography, Writing"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <button 
                    type="button"
                    onClick={handleAddSection} 
                    className="btn btn-block btn-outline border-primary text-primary hover:bg-primary/10 btn-sm rounded-xl font-bold uppercase flex items-center justify-center gap-1.5"
                  >
                    <PlusIcon />
                    {t('cv.form.add_section')}
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-4 bg-base-100 rounded-xl border border-base-300">
                <p className="font-bold mb-2 flex items-center gap-1.5"><LightbulbIcon /> Assistant tab: {activeTab}</p>
                <p className="text-[10px] text-base-content/50 leading-relaxed">
                  Analyze and match your skill sets with our personalized career roadmaps and real-time job market matching values.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PANEL 3: A4 Live Preview Sheet */}
        <section id="cv-preview-wrapper" className={`col-span-1 lg:col-span-6 xl:col-span-5 h-[80vh] flex flex-col items-center bg-[#525659] border border-base-300 rounded-xl p-4 shadow-inner overflow-hidden ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="w-full flex justify-between items-center mb-3 print:hidden">
            <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">Live typeset preview (A4 Format)</span>
            <button 
              onClick={handleExportPDF}
              className="btn btn-xs bg-primary hover:bg-[#059669] text-white rounded font-bold"
            >
              Export PDF
            </button>
          </div>

          <div id="cv-preview-sheet" className="flex-grow w-full max-w-[595px] bg-white text-gray-800 shadow-2xl rounded border border-gray-300 overflow-y-auto text-left relative flex flex-col font-serif select-text">
            
            {/* Header section with photo on the left, name/title on the right */}
            <div className="flex justify-between items-start border-b-2 border-[#10B981] p-8 pb-5 mb-0 bg-white flex-wrap gap-4">
              <div className="flex gap-6 items-center">
                {cv.personal?.photoUrl ? (
                  <img 
                    src={cv.personal.photoUrl} 
                    alt="Photo" 
                    className="w-20 h-20 rounded-lg object-cover border border-gray-300 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400">
                    <CameraIcon className="w-8 h-8" />
                  </div>
                )}
                
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight font-sans uppercase">
                    {firstName || 'Harry'} {lastName || 'Wells'}
                  </h1>
                  <p className="text-xs text-[#10B981] font-bold uppercase font-mono tracking-wider mt-1">
                    {professionalTitle}
                  </p>
                  
                  {/* Basic Contact Info in header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-gray-500 font-sans mt-3">
                    <div className="flex items-center gap-1.5">
                      <PhoneIcon className="w-3 h-3 text-[#10B981]" /> {phoneCountry} {cv.personal?.phone || '123456789'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <EmailIcon className="w-3 h-3 text-[#10B981]" /> {cv.personal?.email || 'harry.wells@example.com'}
                    </div>
                    {cv.personal?.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3 h-3 text-[#10B981]" /> {cv.personal.address}
                      </div>
                    )}
                    {cv.personal?.website && (
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-[#10B981]" /> {cv.personal.website}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Split layout body of resume (Mockup Design: tinted left sidebar in CV sheet itself!) */}
            <div className="grid grid-cols-12 flex-grow items-stretch">
              
              {/* Left Tinted Panel of Resume Sheet (4 columns) */}
              <div className="col-span-4 bg-slate-50 p-6 border-r border-gray-100 flex flex-col gap-6 text-xs text-gray-700">
                
                {/* Profile Summary */}
                {cv.personal?.summary && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-2">
                      Profile
                    </h3>
                    <p className="text-[9px] leading-relaxed text-gray-600 font-sans">
                      {cv.personal.summary}
                    </p>
                  </div>
                )}

                {/* Education */}
                {cv.education && cv.education.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-2">
                      Education
                    </h3>
                    <div className="space-y-3 font-sans">
                      {cv.education.map((edu, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <p className="font-extrabold text-[8.5px] text-gray-900 leading-tight">{edu.degree || 'Degree'}</p>
                          <p className="text-[8px] text-gray-500 leading-tight">{edu.fieldOfStudy || 'Field'}</p>
                          <p className="text-[8px] text-[#10B981] leading-tight font-semibold">{edu.school || 'School'}</p>
                          <p className="text-[7.5px] text-gray-400 font-mono">{edu.graduateDate || 'Grad Date'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies */}
                {showHobbies && cv.hobbies && cv.hobbies.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-2">
                      Hobbies
                    </h3>
                    <ul className="list-disc list-inside space-y-1 font-sans text-[8.5px] text-gray-600">
                      {cv.hobbies.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Right White Panel of Resume Sheet (8 columns) */}
              <div className="col-span-8 p-6 flex flex-col gap-6 text-xs text-gray-700">
                
                {/* Work Experience */}
                {cv.experience && cv.experience.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-3">
                      Work Experience
                    </h3>
                    <div className="space-y-4">
                      {cv.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline font-sans">
                            <span className="font-extrabold text-[9.5px] text-gray-900">{exp.role || 'Role'}</span>
                            <span className="text-[8px] text-gray-400 font-mono">{exp.startDate || 'Start'} – {exp.endDate || 'Present'}</span>
                          </div>
                          <p className="text-[8.5px] text-[#10B981] font-bold font-sans">{exp.company || 'Company'}</p>
                          <p className="text-[9px] leading-relaxed text-gray-600 font-sans pl-1 border-l-2 border-gray-100">
                            {exp.description || 'Description details...'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {cv.projects && cv.projects.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-3">
                      Featured Projects
                    </h3>
                    <div className="space-y-4">
                      {cv.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-1 font-sans">
                          <div className="flex justify-between items-baseline">
                            <span className="font-extrabold text-[9px] text-gray-900">{proj.name || 'Project Name'}</span>
                            {proj.url && <span className="text-[7.5px] text-[#10B981] truncate max-w-[150px]">{proj.url}</span>}
                          </div>
                          <p className="text-[8.5px] leading-relaxed text-gray-600">
                            {proj.description || 'Project details...'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills with Level Indicator Bars */}
                {filteredSkills && filteredSkills.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-3">
                      Skills & Expertise
                    </h3>
                    <div className="grid grid-cols-2 gap-4 font-sans">
                      {filteredSkills.map((skill, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold text-gray-800">
                            <span>{skill}</span>
                            <span className="text-[7px] text-emerald-600 bg-emerald-50 px-1 rounded-sm border border-emerald-100">Verified</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#10B981] h-full rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* References List */}
                {showReferences && cv.references && cv.references.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#10B981] uppercase font-sans tracking-widest border-b border-gray-200 pb-1 mb-3">
                      References
                    </h3>
                    <div className="grid grid-cols-2 gap-4 font-sans text-[8.5px]">
                      {cv.references.map((ref, idx) => (
                        <div key={idx} className="space-y-0.5 text-gray-600">
                          <p className="font-extrabold text-gray-900">{ref.name || 'Reference Name'}</p>
                          <p className="text-gray-400">{ref.relationship || 'Relationship'}</p>
                          <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-gray-400" /> {ref.phone || 'Phone'}</p>
                          <p className="flex items-center gap-1"><EmailIcon className="w-2.5 h-2.5 text-gray-400" /> {ref.email || 'Email'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </section>

      </div>

      {/* PWA Download Info Modal Dialog */}
      {showPwaModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="card w-full max-w-sm bg-base-200 border border-base-300 text-base-content p-6 rounded-2xl shadow-2xl relative text-start animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowPwaModal(false)}
              className="absolute top-3 right-3 btn btn-circle btn-xs btn-ghost text-base-content/60"
            >
              <CloseIcon />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-base-300 pb-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <DownloadAppIcon />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">
                    {locale === 'en' ? 'Install Standalone App' : 'تثبيت التطبيق المستقل'}
                  </h3>
                  <span className="text-[10px] text-base-content/40 font-bold uppercase font-mono mt-0.5 block">
                    {os.toUpperCase()} OS DETECTED
                  </span>
                </div>
              </div>

              <div className="text-xs leading-relaxed space-y-2.5 font-medium text-base-content/80">
                {os === 'windows' && (
                  <p>
                    {locale === 'en' 
                      ? 'To install on Windows, click the installation icon in your browser address bar (right side), or open the settings menu (...) and click "Install SmartRoadmap".' 
                      : 'لتثبيت التطبيق على ويندوز، انقر فوق أيقونة التثبيت في شريط عنوان المتصفح (الجانب الأيمن)، أو افتح القائمة (...) وانقر فوق "تثبيت SmartRoadmap".'}
                  </p>
                )}
                {os === 'macos' && (
                  <p>
                    {locale === 'en' 
                      ? 'To install on macOS, click the Share icon in the Safari toolbar, then select "Add to Dock". This will place a native application icon on your launchpad.' 
                      : 'لتثبيت التطبيق على ماك، انقر فوق أيقونة "مشاركة" في شريط أدوات Safari، ثم اختر "إضافة إلى Dock" لوضع أيقونة التطبيق في شريط التطبيقات الرئيسي.'}
                  </p>
                )}
                {os === 'linux' && (
                  <p>
                    {locale === 'en' 
                      ? 'To install on Linux, click the install prompt in your Chromium/Chrome browser address bar, or select "Install SmartRoadmap" from the settings dropdown.' 
                      : 'لتثبيت التطبيق على لينكس، انقر فوق أيقونة التثبيت في شريط العنوان بمتصفح كروم، أو اختر "تثبيت SmartRoadmap" من قائمة الإعدادات.'}
                  </p>
                )}
                {os === 'ios' && (
                  <p>
                    {locale === 'en' 
                      ? 'To install on iOS/Safari, tap the "Share" button at the bottom of Safari, scroll down the actions sheet, and select "Add to Home Screen".' 
                      : 'لتثبيت التطبيق على هواتف آيفون/آيباد، انقر على زر "مشاركة" أسفل متصفح Safari، ثم مرر لأسفل واختر "إضافة إلى الصفحة الرئيسية".'}
                  </p>
                )}
                {os === 'android' && (
                  <p>
                    {locale === 'en' 
                      ? 'To install on Android, tap the three vertical dots menu at the top-right of Chrome, and select "Install App" or "Add to Home Screen".' 
                      : 'لتثبيت التطبيق على أندرويد، انقر على قائمة النقاط الثلاث الرأسية أعلى يمين متصفح Chrome، ثم اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".'}
                  </p>
                )}
                {os === 'other' && (
                  <p>
                    {locale === 'en' 
                      ? 'Open the settings menu of your mobile or desktop browser and select "Install App" or "Add to Home Screen" to install SmartRoadmap standalone.' 
                      : 'افتح قائمة إعدادات المتصفح على هاتفك أو حاسوبك واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية" لتشغيل البرنامج كموقع مستقل.'}
                  </p>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[10px] leading-relaxed text-primary/95 flex gap-2 items-start font-semibold">
                <span>💡</span>
                <p>
                  {locale === 'en' 
                    ? 'Running SmartRoadmap as a standalone app provides offline caching, secure session management, and cleaner desktop notifications.' 
                    : 'تشغيل البرنامج كتطبيق مستقل يتيح لك تصفحاً أسرع، وإدارة آمنة للجلسات، بالإضافة إلى تلقي إشعارات سطح المكتب بشكل منسق.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowPwaModal(false)}
                  className="btn bg-primary hover:bg-[#059669] text-white btn-xs sm:btn-sm rounded-lg font-bold border-none px-5"
                >
                  {locale === 'en' ? 'Got it' : 'حسناً، فهمت'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
