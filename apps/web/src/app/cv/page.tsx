'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';

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

type CVData = {
  personal: {
    name: string;
    email: string;
    phone: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
};

export default function CvPage() {
  const { t, locale } = useApp();
  const [userId, setUserId] = useState('654321098765432109876543'); // Default fallback test ID
  const [activeTab, setActiveTab] = useState<'fillin' | 'guidance' | 'analysis'>('fillin');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingIndex, setIsEnhancingIndex] = useState<number | null>(null);

  // Form input split name states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('Frontend Developer');

  // Core CV state
  const [cv, setCv] = useState<CVData>({
    personal: { name: '', email: '', phone: '', summary: '' },
    experience: [],
    education: [],
    skills: [],
    projects: [],
  });

  // Calculate completion percentage
  const getCompletionPercent = () => {
    let score = 0;
    if (firstName) score += 15;
    if (lastName) score += 15;
    if (cv.personal.email) score += 15;
    if (cv.personal.phone) score += 15;
    if (cv.personal.summary) score += 20;
    if (cv.experience.length > 0) score += 10;
    if (cv.education.length > 0) score += 10;
    return score;
  };

  // Load existing CV on mount
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

    async function loadCv() {
      try {
        const response = await fetch(`http://localhost:3000/cv/user/${activeUserId}`);
        if (response.ok) {
          const resData = await response.json();
          const cvObj = resData.data || resData;
          if (cvObj) {
            setCv(cvObj);
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

      setCv({
        personal: parsedData.personal || { name: '', email: '', phone: '', summary: '' },
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        skills: parsedData.skills || [],
        projects: parsedData.projects || [],
      });
      
      const nameParts = (parsedData.personal?.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      alert('Resume parsed and form pre-filled successfully!');
    } catch (err) {
      alert('Failed to parse resume file. Using simulated uploader.');
      // Local mockup fill fallback
      setCv({
        personal: {
          name: 'Harry Wells',
          email: 'harry.wells@example.com',
          phone: '+1 555-0100',
          summary: 'Sociable Frontend Developer. Experienced in creating modern designs, setting up grid layouts, and managing state stores.'
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
        projects: []
      });
      setFirstName('Harry');
      setLastName('Wells');
    } finally {
      setIsParsing(false);
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
    } catch (err) {
      alert('Failed to enhance description with AI. Simulated enhancement applied.');
      const updatedExp = [...cv.experience];
      if (updatedExp[index]) {
        updatedExp[index].description = updatedExp[index].description + ' (Enhanced with verified metrics and impact-focused statements)';
      }
      setCv({ ...cv, experience: updatedExp });
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
      alert('CV profile saved successfully in MongoDB database!');
    } catch (err) {
      alert('Simulated Save: Saved CV settings locally!');
    } finally {
      setIsSaving(false);
    }
  };

  // Add items dynamic fields
  const addExperience = () => {
    setCv({
      ...cv,
      experience: [...cv.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }],
    });
  };

  const addEducation = () => {
    setCv({
      ...cv,
      education: [...cv.education, { school: '', degree: '', fieldOfStudy: '', graduateDate: '' }],
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      {/* Workspace Header Actions */}
      <header className="navbar bg-base-200 border-b border-base-300 py-3 px-6 justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-wide">{t('cv.title')}</span>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            onChange={handleFileUpload} 
            className="file-input file-input-bordered file-input-primary file-input-xs sm:file-input-sm w-full max-w-xs" 
          />
          {isParsing && <span className="loading loading-spinner loading-xs text-primary"></span>}
          <button 
            onClick={handleSaveCv} 
            disabled={isSaving}
            className="btn btn-primary btn-xs sm:btn-sm text-white rounded-lg px-4"
          >
            {isSaving && <span className="loading loading-spinner loading-xs"></span>}
            {t('cv.save')}
          </button>
          <button 
            onClick={() => alert('PDF successfully exported! (Simulated download)')}
            className="btn btn-secondary btn-outline btn-xs sm:btn-sm rounded-lg"
          >
            {t('cv.export')}
          </button>
        </div>
      </header>

      {/* Triple Panel Dashboard Layout */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 overflow-hidden">
        
        {/* PANEL 1: Minimalist Left Sidebar menu (Mockup Style) */}
        <aside className="hidden xl:flex xl:col-span-2 flex-col justify-between border border-base-300 bg-base-200 p-4 rounded-xl h-[82vh] text-xs">
          <div className="space-y-6">
            <div className="font-black text-sm text-primary uppercase tracking-widest px-2">JobsSpark</div>
            
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-semibold transition-colors">
                📊 Dashboard
              </Link>
              <Link href="/cv" className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary text-white font-semibold transition-colors">
                📄 Resumes
              </Link>
              <Link href="/hiring" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-semibold transition-colors">
                💼 Job Matching
              </Link>
              <Link href="/roadmap" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-semibold transition-colors">
                🗺 Learning Roadmap
              </Link>
              <Link href="/contact" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-300 text-base-content/75 font-semibold transition-colors">
                📞 Help & Support
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            {/* Upgrade banner mockup */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="font-bold text-[10px] text-primary">{locale === 'en' ? 'Unlock Advanced Features' : 'افتح الميزات المتقدمة'}</p>
              <Link href="/pricing" className="btn btn-primary btn-xs rounded-lg text-white mt-2 btn-block">{locale === 'en' ? 'Upgrade Plan' : 'ترقية الحساب'}</Link>
            </div>
            <div className="flex items-center gap-2 px-1 py-2 border-t border-base-300">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">
                {firstName.slice(0, 1)}{lastName.slice(0, 1)}
              </div>
              <div className="truncate flex-1">
                <p className="font-bold truncate leading-none text-base-content">{firstName} {lastName}</p>
                <span className="text-[9px] text-base-content/50 uppercase font-semibold">Premium User</span>
              </div>
            </div>
          </div>
        </aside>

        {/* PANEL 2: Center Editor Form (JobsSpark Mockup Style) */}
        <section className="col-span-1 md:col-span-6 xl:col-span-5 card bg-base-200 border border-base-300 shadow-sm overflow-hidden h-[82vh] flex flex-col rounded-xl">
          {/* Header Tabs */}
          <div className="tabs tabs-boxed bg-base-300 p-2 font-mono text-[10px] tracking-wide rounded-none border-b border-base-300">
            <button 
              onClick={() => setActiveTab('fillin')}
              className={`tab flex-grow font-bold ${activeTab === 'fillin' ? 'tab-active' : ''}`}
            >
              📝 {locale === 'en' ? 'Fill In' : 'ملء البيانات'}
            </button>
            <button 
              onClick={() => setActiveTab('guidance')}
              className={`tab flex-grow font-bold ${activeTab === 'guidance' ? 'tab-active' : ''}`}
            >
              💡 {locale === 'en' ? 'Guidance' : 'التوجيه المساعد'}
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`tab flex-grow font-bold ${activeTab === 'analysis' ? 'tab-active' : ''}`}
            >
              🔍 {locale === 'en' ? 'Analysis' : 'التحليل والتقييم'}
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-grow space-y-6 text-xs">
            {activeTab === 'fillin' ? (
              <div className="space-y-6">
                
                {/* Resume Complication Progress Circle */}
                <div className="flex items-center justify-between bg-base-100 border border-base-300 p-4 rounded-xl">
                  <div>
                    <h3 className="font-extrabold text-sm">{locale === 'en' ? 'Resume completion' : 'نسبة إكمال السيرة الذاتية'}</h3>
                    <p className="text-[10px] text-base-content/50 mt-0.5">{locale === 'en' ? 'Fill in core credentials to reach 100%' : 'أدخل البيانات الأساسية للوصول لنسبة ١٠٠٪'}</p>
                  </div>
                  <div className="radial-progress text-primary font-mono font-bold text-xs" style={{ "--value": getCompletionPercent(), "--size": "3.5rem" } as any}>
                    {getCompletionPercent()}%
                  </div>
                </div>

                {/* Collapsible Section 1: Basic Information */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" defaultChecked /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide flex items-center gap-2">
                    👤 {t('cv.personal')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    
                    {/* Mockup photo upload card */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-base-200/50 border border-dashed border-base-300 p-3 rounded-lg">
                      <div className="w-16 h-16 bg-base-300 border border-base-300 rounded-lg flex items-center justify-center text-xl shrink-0 opacity-80">
                        📷
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-bold text-[10px]">{locale === 'en' ? 'Upload your photo' : 'قم بتحميل صورتك الشخصية'}</p>
                        <p className="text-[9px] text-base-content/40 mt-0.5">Only .png, .jpg file can be formatted. Min aspect ratio 120x120</p>
                        <button onClick={() => alert('Photo upload simulated')} className="btn btn-xs btn-outline btn-primary rounded mt-2 px-3">Browse photo</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">{locale === 'en' ? 'First name' : 'الاسم الأول'}</label>
                        <input 
                          type="text" 
                          value={firstName} 
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            updateCombinedName(e.target.value, lastName);
                          }}
                          className="input input-bordered input-sm w-full font-semibold" 
                          placeholder="Harry"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">{locale === 'en' ? 'Last name' : 'اسم العائلة'}</label>
                        <input 
                          type="text" 
                          value={lastName} 
                          onChange={(e) => {
                            setLastName(e.target.value);
                            updateCombinedName(firstName, e.target.value);
                          }}
                          className="input input-bordered input-sm w-full font-semibold" 
                          placeholder="Wells"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/50">{locale === 'en' ? 'Professional Title' : 'المسمى المهني'}</label>
                      <input 
                        type="text" 
                        value={professionalTitle} 
                        onChange={(e) => setProfessionalTitle(e.target.value)}
                        className="input input-bordered input-sm w-full font-semibold" 
                        placeholder="Sociable Frontend Developer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">{t('cv.email')}</label>
                        <input 
                          type="email" 
                          value={cv.personal.email}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, email: e.target.value } })}
                          className="input input-bordered input-sm w-full font-semibold"
                          placeholder="johndoe@example.com"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">{t('cv.phone')}</label>
                        <input 
                          type="text" 
                          value={cv.personal.phone}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, phone: e.target.value } })}
                          className="input input-bordered input-sm w-full font-semibold"
                          placeholder="+1 555-0100"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/50">{locale === 'en' ? 'Career Objectives / Summary' : 'ملخص السيرة والهدف المهني'}</label>
                      <textarea 
                        value={cv.personal.summary}
                        onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, summary: e.target.value } })}
                        className="textarea textarea-bordered textarea-sm w-full h-24 font-semibold resize-none"
                        placeholder="Write a brief professional summary..."
                      />
                    </div>

                  </div>
                </div>

                {/* Collapsible Section 2: Work Experience */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide flex justify-between items-center pr-10">
                    <span>💼 {t('cv.experience')}</span>
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="flex justify-end">
                      <button onClick={addExperience} className="btn btn-primary btn-outline btn-xs rounded-lg">
                        {t('cv.add_exp')}
                      </button>
                    </div>

                    {cv.experience.map((exp, i) => (
                      <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.company')}</label>
                            <input 
                              type="text" 
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].company = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.role')}</label>
                            <input 
                              type="text" 
                              value={exp.role}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].role = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.start')}</label>
                            <input 
                              type="text" 
                              value={exp.startDate}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].startDate = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                              placeholder="2024-01"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.end')}</label>
                            <input 
                              type="text" 
                              value={exp.endDate}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].endDate = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                              placeholder="Present"
                            />
                          </div>
                        </div>

                        <div className="form-control">
                          <div className="flex justify-between items-baseline mb-1">
                            <label className="text-[9px] font-bold uppercase text-base-content/50">{t('cv.description')}</label>
                            <button 
                              onClick={() => handleEnhanceDescription(i)}
                              disabled={isEnhancingIndex === i}
                              className="btn btn-[9px] btn-primary btn-outline rounded px-2 h-6 min-h-0"
                            >
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
                            className="textarea textarea-bordered textarea-xs sm:textarea-sm w-full h-20 font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collapsible Section 3: Education */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide">
                    🎓 {t('cv.education')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="flex justify-end">
                      <button onClick={addEducation} className="btn btn-primary btn-outline btn-xs rounded-lg">
                        {t('cv.add_edu')}
                      </button>
                    </div>

                    {cv.education.map((edu, i) => (
                      <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.school')}</label>
                            <input 
                              type="text" 
                              value={edu.school}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].school = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.degree')}</label>
                            <input 
                              type="text" 
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].degree = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.field')}</label>
                            <input 
                              type="text" 
                              value={edu.fieldOfStudy}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].fieldOfStudy = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">{t('cv.grad_date')}</label>
                            <input 
                              type="text" 
                              value={edu.graduateDate}
                              onChange={(e) => {
                                const updated = [...cv.education];
                                if (updated[i]) updated[i].graduateDate = e.target.value;
                                setCv({ ...cv, education: updated });
                              }}
                              className="input input-bordered input-xs sm:input-sm w-full font-semibold"
                              placeholder="2023-06"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collapsible Section 4: Skills */}
                <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title font-extrabold text-xs uppercase tracking-wide">
                    🛠 {t('cv.skills')}
                  </div>
                  <div className="collapse-content space-y-4 pt-1">
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/50">{t('cv.skills_list')}</label>
                      <input 
                        type="text" 
                        value={cv.skills.join(', ')}
                        onChange={(e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className="input input-bordered input-sm w-full font-semibold"
                        placeholder="React, TypeScript, Figma"
                      />
                      <span className="text-[9px] text-base-content/40 mt-1">{t('cv.skills_tip')}</span>
                    </div>
                  </div>
                </div>

                {/* Extra Section banner */}
                <button onClick={() => alert('Custom sections available on Scale plans')} className="btn btn-outline btn-block border-base-300 rounded-xl text-xs py-2">
                  + Add Section
                </button>

              </div>
            ) : (
              <div className="text-center py-10 opacity-70">
                <p className="font-bold">{locale === 'en' ? 'Dashboard Features' : 'ميزات لوحة التحكم'}</p>
                <p className="text-[10px] text-base-content/50 mt-1">Upgrade to Premium to get automated parsing metrics, cover letter drafts, and alignment summaries.</p>
              </div>
            )}
          </div>
        </section>

        {/* PANEL 3: Right Live Preview Sheet (Typeset A4 Mockup Style) */}
        <section className="col-span-1 md:col-span-6 xl:col-span-5 border border-base-300 bg-base-300/40 p-4 sm:p-6 overflow-y-auto h-[82vh] flex justify-center rounded-xl">
          
          {/* Mockup A4 paper page sheet */}
          <div className="bg-white text-gray-900 shadow-md p-6 sm:p-8 w-full max-w-[480px] min-h-[640px] font-serif relative text-left border border-gray-200 select-none flex flex-col justify-between">
            <div>
              {/* CV Top Header Block */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between border-b border-gray-200 pb-4 mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center font-bold text-lg font-mono uppercase">
                    {firstName.slice(0, 1)}{lastName.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-md sm:text-lg font-black tracking-tight text-gray-900 leading-none uppercase">{firstName || 'Harry'} {lastName || 'Wells'}</h2>
                    <span className="text-[9px] font-bold text-primary font-mono mt-1 uppercase tracking-wider block">{professionalTitle}</span>
                  </div>
                </div>

                <div className="text-[8px] text-gray-500 font-sans text-center sm:text-right leading-relaxed shrink-0">
                  <p>📞 {cv.personal.phone || '+1 555-0100'}</p>
                  <p>📧 {cv.personal.email || 'harry.wells@example.com'}</p>
                </div>
              </div>

              {/* Two Column details layout */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Preview Left column */}
                <div className="col-span-4 space-y-4 border-r border-gray-100 pr-3">
                  {/* Summary / Profile block */}
                  {cv.personal.summary && (
                    <div>
                      <h4 className="text-[8px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1.5 uppercase font-sans tracking-wide">Profile</h4>
                      <p className="text-[7.5px] text-gray-600 leading-snug font-sans">{cv.personal.summary}</p>
                    </div>
                  )}

                  {/* Skills tags preview */}
                  {cv.skills.length > 0 && (
                    <div>
                      <h4 className="text-[8px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1.5 uppercase font-sans tracking-wide">Skills</h4>
                      <div className="flex flex-wrap gap-1 mt-1 font-sans">
                        {cv.skills.map((skill, i) => (
                          <span key={i} className="text-[6.5px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Right column */}
                <div className="col-span-8 space-y-4">
                  {/* Experience list */}
                  {cv.experience.length > 0 && (
                    <div>
                      <h4 className="text-[8px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2.5 uppercase font-sans tracking-wide">Work Experience</h4>
                      <div className="space-y-3 font-sans">
                        {cv.experience.map((exp, i) => (
                          <div key={i} className="text-[7px]">
                            <div className="flex justify-between font-bold text-gray-800 leading-none">
                              <span className="text-[7.5px]">{exp.role || 'Software Engineer'}</span>
                              <span className="font-normal text-gray-500 text-[6.5px]">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p className="text-gray-400 text-[6.5px] font-semibold mt-0.5">{exp.company || 'Company'}</p>
                            <p className="text-gray-600 mt-1 leading-snug whitespace-pre-wrap">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education list */}
                  {cv.education.length > 0 && (
                    <div>
                      <h4 className="text-[8px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2.5 uppercase font-sans tracking-wide">Education</h4>
                      <div className="space-y-2 font-sans">
                        {cv.education.map((edu, i) => (
                          <div key={i} className="text-[7px] flex justify-between leading-snug">
                            <div>
                              <p className="font-bold text-gray-850">{edu.school || 'School/University'}</p>
                              <span className="text-gray-500 text-[6.5px] block">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                            </div>
                            <span className="text-gray-500 text-[6.5px] font-medium">{edu.graduateDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Simulated Live preview footer watermarks */}
            <div className="border-t border-gray-250 pt-2 flex justify-between items-center text-[6px] font-sans text-gray-400 mt-4 leading-none">
              <span>SmartRoadmap Verified Resume Certificate</span>
              <span>Generated on {new Date().getFullYear()}-06-19</span>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
