'use client';

import React from 'react';
import Link from 'next/link';
import {
  DashboardIcon,
  FileIcon,
  BriefcaseIcon,
  MessageIcon,
  NotificationIcon,
  UserIcon,
  UploadIcon,
  PlusIcon,
  EditIcon,
  EyeIcon,
  CameraIcon,
  PhoneIcon,
  EmailIcon,
  MapPinIcon,
  LinkIcon,
  SparklesIcon,
  CloseIcon,
  TrashIcon,
} from './_components/icons';
import { useCvEditor } from './useCvEditor';
import { CvRenderer } from './_components/CvRenderer';
import { GitHubRepoImportModal } from './_components/GitHubRepoImportModal';
import { AtsOptimizerModal } from './_components/AtsOptimizerModal';
import { AdvancedAiCvModal } from './_components/AdvancedAiCvModal';
import { Bot, Globe } from 'lucide-react';

export default function CvPage() {
  const {
    cvList,
    currentView,
    setCurrentView,
    handleCreateNewCv,
    handleSelectCv,
    handleDuplicateCv,
    handleDeleteCv,
    handleMakeDefault,
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
    addEducation,
    addExperience,
    addProject,
    addReference,
    atsAnalysis,
    cv,
    filteredSkills,
    firstName,
    getCompletionPercent,
    handleCancel,
    handleEnhanceDescription,
    handleExportPDF,
    handleFileUpload,
    handleGenerateFromProfile,
    handlePhotoUpload,
    handleSaveCv,
    isParsing,
    isSaving,
    isTailoring,
    lastName,
    locale,
    mobileView,
    phoneCountry,
    professionalTitle,
    removeEducation,
    removeExperience,
    removeProject,
    removeReference,
    selectedTemplate,
    setActiveTab,
    setCv,
    setFirstName,
    setLastName,
    setMobileView,
    setPhoneCountry,
    setProfessionalTitle,
    setSelectedTemplate,
    t,
    targetJobTitle,
    updateCombinedName,
    showTailorModal,
    setShowTailorModal,
    handleGenerateTailoredCv,
  } = useCvEditor();

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content text-start select-none print:pt-0">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-base-100/90 backdrop-blur-md border-b border-base-300 py-3 px-4 sm:px-8 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            📄
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none">CV Studio</h1>
            <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
              Professional Resume Builder & ATS Optimizer
            </p>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2">
          {currentView !== 'dashboard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="btn btn-outline border-base-300 btn-xs sm:btn-sm rounded-2xl font-bold"
            >
              ← My CVs
            </button>
          )}

          {currentView === 'editor' && (
            <>
              <button
                onClick={() => setIsAtsOptimizerOpen(true)}
                className="btn btn-outline border-primary text-primary hover:bg-primary/10 btn-xs sm:btn-sm rounded-2xl font-bold flex items-center gap-1 transition-all duration-300 ease-in-out"
              >
                <SparklesIcon />
                ATS Optimizer
              </button>

              <button
                type="button"
                onClick={() => document.getElementById('resumeFileUploadTrigger')?.click()}
                className="btn btn-outline border-base-300 text-base-content btn-xs sm:btn-sm rounded-2xl flex items-center gap-1"
              >
                <UploadIcon />
                Upload PDF
              </button>
              <input
                type="file"
                id="resumeFileUploadTrigger"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={handleSaveCv}
                disabled={isSaving}
                className="btn bg-primary hover:bg-[#701111] text-white btn-xs sm:btn-sm rounded-2xl border-none font-bold px-4 transition-all duration-300 ease-in-out"
              >
                {isSaving && <span className="loading loading-spinner loading-xs mr-1"></span>}
                Save CV
              </button>
            </>
          )}

          <button
            onClick={handleCreateNewCv}
            className="btn bg-primary hover:bg-[#701111] text-white btn-xs sm:btn-sm rounded-2xl border-none font-bold flex items-center gap-1 transition-all duration-300 ease-in-out"
          >
            <PlusIcon />
            New CV
          </button>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="bg-[#E8C999]/20 border border-[#E8C999]/40 rounded-[2rem] p-8 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm select-none">
            {/* Left Side */}
            <div className="space-y-4 text-start flex-1 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                NEXT-GEN CAREER ENGINE
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content leading-tight">
                Role-Specific AI Resume Studio & ATS Calibration
              </h1>
              <p className="text-sm font-semibold text-base-content/60 leading-relaxed max-w-md">
                Automatically organize and format your verified technical skills, GitHub repositories, online courses, and track certificates into multi-section ATS-friendly resumes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setShowTailorModal(true)}
                  className="btn bg-primary hover:bg-[#701111] text-white btn-sm rounded-xl font-bold border-none shadow transition-all duration-300 ease-in-out"
                >
                  <SparklesIcon /> Launch AI CV Generator
                </button>
                <button
                  onClick={handleCreateNewCv}
                  className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-sm rounded-xl font-bold transition-all duration-300 ease-in-out"
                >
                  + Blank Resume
                </button>
                <Link
                  href="/portfolio/builder"
                  className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-sm rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" /> Portfolio Builder
                </Link>
              </div>
            </div>

            {/* Right Side: AI Assistant Graphic */}
            <div className="hidden md:flex flex-col items-center justify-center relative w-64 shrink-0">
              <div className="absolute -top-4 -left-4 bg-base-100 border border-base-300 shadow-sm rounded-full px-4 py-2 text-[10px] font-bold text-base-content whitespace-nowrap z-10">
                Targeting a new role? Let&apos;s calibrate your CV!
              </div>
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center relative bg-base-100 shadow-sm">
                <Bot className="w-14 h-14 text-primary" />
                <div className="absolute -left-3 top-12 w-6 h-6 rounded-full bg-[#F8EEDF] border border-base-300 shadow-sm flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                </div>
                <div className="absolute -right-3 top-12 w-6 h-6 rounded-full bg-[#F8EEDF] border border-base-300 shadow-sm flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                </div>
              </div>
              <span className="mt-4 px-3 py-1 bg-base-100 border border-[#8E1616]/30 text-[#8E1616] text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-[#8E1616] rounded-full"></span>
                ATS Ready
              </span>
            </div>
          </div>

          {/* My CVs Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-base-content uppercase tracking-wider font-mono">
                My CVs ({cvList.length})
              </h3>
            </div>

            {cvList.length === 0 ? (
              <div className="bg-base-200/50 border-2 border-dashed border-base-300 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                  📝
                </div>
                <h4 className="font-extrabold text-base">You don&apos;t have any saved CVs yet.</h4>
                <p className="text-xs text-base-content/60 max-w-md mx-auto">
                  Create your first CV in minutes with tailored ATS analysis and GitHub repository imports.
                </p>
                <button
                  onClick={handleCreateNewCv}
                  className="btn bg-primary hover:bg-[#701111] text-white btn-sm rounded-xl font-bold border-none mt-2 transition-all duration-300 ease-in-out"
                >
                  Create Your First CV
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cvList.map((item) => (
                  <div
                    key={item._id || item.id}
                    onClick={() => handleSelectCv(item)}
                    className="group bg-base-100 border border-base-300 hover:border-primary rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="badge badge-primary badge-outline text-[10px] font-mono font-bold uppercase">
                          {item.template || 'Modern'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleMakeDefault(item._id || item.id || '', e)}
                            className={`btn btn-ghost btn-xs btn-square transition-all duration-300 ease-in-out ${item.isDefault ? 'text-warning' : 'text-base-content/30 hover:text-warning'}`}
                            title={item.isDefault ? "Main CV" : "Mark as Main CV"}
                          >
                            {item.isDefault ? '⭐' : '☆'}
                          </button>
                          <button
                            onClick={(e) => handleDuplicateCv(item._id || item.id || '', e)}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary transition-all duration-300 ease-in-out"
                            title="Duplicate CV"
                          >
                            📋
                          </button>
                          <button
                            onClick={(e) => handleDeleteCv(item._id || item.id || '', e)}
                            className="btn btn-ghost btn-xs btn-square text-error"
                            title="Delete CV"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-base text-base-content group-hover:text-primary transition-colors">
                        {item.title || 'Untitled Resume'}
                      </h4>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        {item.personal?.title || 'Software Engineer'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-base-content/50 font-mono">
                        Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'recently'}
                      </span>
                      <div className="flex gap-2">
                        <button className="btn btn-xs bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-bold rounded-2xl transition-all duration-300 ease-in-out">
                          Edit →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CV Tools Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <div className="bg-base-200 border border-base-300 p-5 rounded-2xl space-y-2">
              <span className="text-xl">📊</span>
              <h4 className="font-extrabold text-sm">ATS Optimizer</h4>
              <p className="text-xs text-base-content/70">
                Paste job description text to calculate keyword match scores and actionable missing skill recommendations.
              </p>
            </div>
            <div className="bg-base-200 border border-base-300 p-5 rounded-2xl space-y-2">
              <span className="text-xl">🎨</span>
              <h4 className="font-extrabold text-sm">4 Distinct Templates</h4>
              <p className="text-xs text-base-content/70">
                Choose between Classic Professional, Modern Developer, Minimal ATS, and Creative Modern layouts.
              </p>
            </div>
            <div className="bg-base-200 border border-base-300 p-5 rounded-2xl space-y-2">
              <span className="text-xl">🌐</span>
              <h4 className="font-extrabold text-sm">Portfolio Builder</h4>
              <p className="text-xs text-base-content/70">
                Convert your profile & GitHub repositories into a published personal portfolio website at /portfolio/[username].
              </p>
              <Link href="/portfolio/builder" className="text-xs text-primary font-bold hover:underline block pt-1 transition-all duration-300 ease-in-out">
                Open Portfolio Builder →
              </Link>
            </div>
          </div>
        </main>
      )}

      {/* EDITOR VIEW */}
      {currentView === 'editor' && (
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 items-stretch">
          {/* EDITOR FORM PANEL (7 cols on lg) */}
          <section className="col-span-1 lg:col-span-6 xl:col-span-7 flex flex-col bg-base-200 border border-base-300 rounded-xl overflow-hidden min-h-[650px]">
            {/* Title & Navigation Tabs */}
            <div className="p-4 bg-base-100 border-b border-base-300 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={cv.title || 'My Resume'}
                  onChange={(e) => setCv({ ...cv, title: e.target.value })}
                  className="input input-sm font-extrabold text-sm bg-base-200 text-base-content focus:border-primary border-base-300 rounded-2xl flex-grow"
                  placeholder="Resume Title (e.g. Frontend Developer CV)"
                />
              </div>

              <div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTab('fillin')}
                  className={`tab font-bold ${activeTab === 'fillin' ? 'tab-active bg-primary text-white' : ''}`}
                >
                  Form Editor
                </button>
                <button
                  onClick={() => setActiveTab('guidance')}
                  className={`tab font-bold ${activeTab === 'guidance' ? 'tab-active bg-primary text-white' : ''}`}
                >
                  Section Order
                </button>
                <button
                  onClick={() => setActiveTab('matching')}
                  className={`tab font-bold ${activeTab === 'matching' ? 'tab-active bg-primary text-white' : ''}`}
                >
                  Templates ({cv.template || 'modern'})
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-grow space-y-6 text-xs text-left">
              {/* TAB 1: FORM EDITOR */}
              {activeTab === 'fillin' && (
                <div className="space-y-6">
                  {/* Basic Information section */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <UserIcon />
                      Personal Contact Information
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      {/* Photo upload card */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-base-200 border border-dashed border-base-300 p-3 rounded-2xl w-full">
                        {cv.personal?.photoUrl ? (
                          <img
                            src={cv.personal.photoUrl}
                            alt="Avatar"
                            className="w-14 h-14 rounded-2xl object-cover border border-base-300 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-base-300 rounded-2xl flex items-center justify-center text-base-content/50 shrink-0">
                            <CameraIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="text-center sm:text-left flex-1 space-y-1">
                          <p className="font-bold text-[10px] text-base-content">Profile Picture</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('cvPhotoFileInput')?.click()}
                            className="btn btn-xs bg-primary hover:bg-[#701111] border-none text-white rounded mt-1 px-3 font-bold transition-all duration-300 ease-in-out"
                          >
                            Upload Photo
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
                          <label className="label text-[10px] font-bold uppercase text-base-content/50">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              updateCombinedName(e.target.value, lastName);
                            }}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="Harry"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-base-content/50">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              updateCombinedName(firstName, e.target.value);
                            }}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="Wells"
                          />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">Professional Title</label>
                        <input
                          type="text"
                          value={professionalTitle}
                          onChange={(e) => setProfessionalTitle(e.target.value)}
                          className="input input-bordered input-sm bg-base-200 font-semibold"
                          placeholder="Senior Software Engineer"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label text-[10px] font-bold uppercase text-base-content/50">Professional Summary</label>
                        <textarea
                          value={cv.personal?.summary || ''}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, summary: e.target.value } })}
                          className="textarea textarea-bordered textarea-sm h-24 bg-base-200 font-semibold resize-none"
                          placeholder="Passionate engineer with experience in NestJS and Next.js..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-base-content/50">Email</label>
                          <input
                            type="email"
                            value={cv.personal?.email || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, email: e.target.value } })}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="harry@example.com"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-base-content/50">Phone</label>
                          <input
                            type="text"
                            value={cv.personal?.phone || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, phone: e.target.value } })}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="+1 234 567 890"
                          />
                        </div>
                      </div>

                      {/* GitHub & LinkedIn Connected Links */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-base-content/50 flex justify-between">
                            <span>GitHub Profile URL</span>
                            {cv.personal?.gitHub && <span className="text-[9px] text-primary font-mono">Connected</span>}
                          </label>
                          <input
                            type="text"
                            value={cv.personal?.gitHub || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, gitHub: e.target.value } })}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-base-content/50 flex justify-between">
                            <span>LinkedIn Profile URL</span>
                            {cv.personal?.linkedIn && <span className="text-[9px] text-primary font-mono">Connected</span>}
                          </label>
                          <input
                            type="text"
                            value={cv.personal?.linkedIn || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, linkedIn: e.target.value } })}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects Section with GitHub Import Button */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <FileIcon />
                      Key Projects ({cv.projects?.length || 0})
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setIsGitHubImportOpen(true)}
                          className="btn btn-xs btn-outline border-primary text-primary hover:bg-primary/10 rounded-2xl font-bold flex items-center gap-1 transition-all duration-300 ease-in-out"
                        >
                          💻 Import from GitHub
                        </button>
                        <button type="button" onClick={addProject} className="btn bg-primary hover:bg-[#701111] text-white border-none btn-xs rounded-2xl font-bold transition-all duration-300 ease-in-out">
                          + Add Project
                        </button>
                      </div>

                      {cv.projects && cv.projects.map((proj, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeProject(i)}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          >
                            <CloseIcon />
                          </button>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/50">Project Name</label>
                              <input
                                type="text"
                                value={proj.name}
                                onChange={(e) => {
                                  const updated = [...cv.projects];
                                  if (updated[i]) updated[i].name = e.target.value;
                                  setCv({ ...cv, projects: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/50">Project URL / GitHub</label>
                              <input
                                type="text"
                                value={proj.url || proj.githubUrl || ''}
                                onChange={(e) => {
                                  const updated = [...cv.projects];
                                  if (updated[i]) {
                                    updated[i].url = e.target.value;
                                    updated[i].githubUrl = e.target.value;
                                  }
                                  setCv({ ...cv, projects: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">Description</label>
                            <textarea
                              value={proj.description}
                              onChange={(e) => {
                                const updated = [...cv.projects];
                                if (updated[i]) updated[i].description = e.target.value;
                                setCv({ ...cv, projects: updated });
                              }}
                              className="textarea textarea-bordered textarea-xs h-16 bg-base-100 font-semibold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience section */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <BriefcaseIcon />
                      Work Experience ({cv.experience?.length || 0})
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-end">
                        <button type="button" onClick={addExperience} className="btn bg-primary hover:bg-[#701111] text-white border-none btn-xs rounded-2xl font-bold transition-all duration-300 ease-in-out">
                          + Add Experience
                        </button>
                      </div>

                      {cv.experience && cv.experience.map((exp, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeExperience(i)}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          >
                            <CloseIcon />
                          </button>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/50">Company</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const updated = [...cv.experience];
                                  if (updated[i]) updated[i].company = e.target.value;
                                  setCv({ ...cv, experience: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-base-content/50">Role</label>
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) => {
                                  const updated = [...cv.experience];
                                  if (updated[i]) updated[i].role = e.target.value;
                                  setCv({ ...cv, experience: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="form-control">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => {
                                const updated = [...cv.experience];
                                if (updated[i]) updated[i].description = e.target.value;
                                setCv({ ...cv, experience: updated });
                              }}
                              className="textarea textarea-bordered textarea-xs h-20 bg-base-100 font-semibold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unlimited Custom Sections */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <SparklesIcon />
                      Custom Sections ({cv.customSections?.length || 0})
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-base-content/50 font-medium">Add free-form sections like Hackathons, Research, or Volunteering.</p>
                        <button type="button" onClick={addCustomSection} className="btn bg-primary hover:bg-[#701111] text-white border-none btn-xs rounded-2xl font-bold transition-all duration-300 ease-in-out">
                          + Add Section
                        </button>
                      </div>

                      {cv.customSections && cv.customSections.map((sec) => (
                        <div key={sec.id} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeCustomSection(sec.id)}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          >
                            <CloseIcon />
                          </button>
                          <div className="form-control pt-1">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">Section Title</label>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => updateCustomSectionTitle(sec.id, e.target.value)}
                              className="input input-bordered input-xs bg-base-100 font-extrabold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="label text-[9px] font-bold uppercase text-base-content/50">Bullet Points</label>
                            {sec.items.map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateCustomSectionItem(sec.id, idx, e.target.value)}
                                  className="input input-bordered input-xs bg-base-100 font-medium flex-grow"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomSectionItem(sec.id, idx)}
                                  className="btn btn-xs btn-circle btn-ghost text-error"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addCustomSectionItem(sec.id)}
                              className="btn btn-xs btn-ghost text-primary font-bold"
                            >
                              + Add Bullet Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SECTION ORDERING */}
              {activeTab === 'guidance' && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-base-content">
                    Reorder Sections
                  </h3>
                  <p className="text-[11px] text-base-content/60">
                    Use Up and Down controls to change the sequence in which sections are rendered on your final CV.
                  </p>

                  <div className="space-y-2">
                    {(cv.sectionOrder || []).map((sectionKey, index) => (
                      <div key={sectionKey} className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-xl">
                        <span className="font-bold text-xs capitalize text-base-content">
                          {sectionKey}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                            className="btn btn-xs btn-outline border-base-300 font-bold"
                          >
                            ▲ Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSectionDown(index)}
                            disabled={index === (cv.sectionOrder || []).length - 1}
                            className="btn btn-xs btn-outline border-base-300 font-bold"
                          >
                            ▼ Down
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: TEMPLATES GALLERY */}
              {activeTab === 'matching' && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-base-content">
                    Choose Template Design
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'classic', title: 'Classic Professional', desc: 'Clean traditional single-column executive resume' },
                      { id: 'modern', title: 'Modern Developer', desc: 'Technical resume with top pill badges & 2-column sidebar' },
                      { id: 'minimal', title: 'Minimal ATS', desc: 'Ultra-clean ATS safe single-column layout' },
                      { id: 'creative', title: 'Creative Modern', desc: 'Stylish modern header banner with gradient accent' },
                    ].map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplate(tpl.id as any);
                          setCv({ ...cv, template: tpl.id as any });
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${(cv.template || 'modern') === tpl.id
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                            : 'bg-base-100 border-base-300 hover:border-base-400'
                          }`}
                      >
                        <h4 className="font-extrabold text-xs text-base-content">{tpl.title}</h4>
                        <p className="text-[10px] text-base-content/60 leading-normal">{tpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* LIVE PREVIEW SHEET (5 cols on lg) */}
          <section id="cv-preview-wrapper" className="col-span-1 lg:col-span-6 xl:col-span-5 h-[80vh] flex flex-col items-center bg-[#525659] border border-base-300 rounded-xl p-4 shadow-inner overflow-hidden">
            <div className="w-full flex justify-between items-center mb-3 print:hidden">
              <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">
                Live A4 Preview ({cv.template || 'modern'})
              </span>
              <button
                onClick={handleExportPDF}
                className="btn btn-xs bg-primary hover:bg-[#701111] text-white rounded font-bold transition-all duration-300 ease-in-out"
              >
                Export PDF
              </button>
            </div>

            <div id="cv-preview-sheet" className="flex-grow w-full max-w-[595px] bg-base-100 text-base-content shadow-2xl rounded border border-base-300 overflow-y-auto relative flex flex-col select-text">
              <CvRenderer cv={cv} />
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      <GitHubRepoImportModal
        isOpen={isGitHubImportOpen}
        onClose={() => setIsGitHubImportOpen(false)}
        onImportProjects={handleImportGitHubRepos}
      />

      <AtsOptimizerModal
        isOpen={isAtsOptimizerOpen}
        onClose={() => setIsAtsOptimizerOpen(false)}
        cv={cv}
        onApplyAtsAnalysis={(analysis) => setCv({ ...cv, atsAnalysis: analysis })}
      />

      <AdvancedAiCvModal
        isOpen={showTailorModal}
        onClose={() => setShowTailorModal(false)}
        onGenerate={(params) => handleGenerateTailoredCv(params.targetRole, params.jobDescription)}
        isGenerating={isTailoring}
        initialRole={targetJobTitle}
      />
    </div>
  );
}