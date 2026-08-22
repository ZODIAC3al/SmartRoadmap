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
import AiAssistantFigure from '@/components/illustrations/AiAssistantFigure';
import ResumeStudioIllustration from '@/components/illustrations/ResumeStudioIllustration';

export default function CvPage() {
  const {
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
    isAiModalOpen,
    setIsAiModalOpen,
    handleAdvancedAiGenerate,
    handleRegenerateSection,
    isRegeneratingSection,
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
            <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-mono mt-0.5">
              Professional AI Resume Generator & ATS Optimizer
            </p>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2">
          {currentView !== 'dashboard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="btn btn-outline border-base-300 btn-xs sm:btn-sm rounded-lg font-bold"
            >
              ← My CVs
            </button>
          )}

          {currentView === 'editor' && (
            <>
              <button
                onClick={() => setIsAtsOptimizerOpen(true)}
                className="btn btn-outline border-[#8E1616] text-[#8E1616] hover:bg-[#8E1616]/10 btn-xs sm:btn-sm rounded-lg font-bold flex items-center gap-1"
              >
                <SparklesIcon />
                ATS Optimizer
              </button>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                disabled={isTailoring || isParsing}
                className="btn bg-gradient-to-r from-[#8E1616] to-[#B32424] text-white hover:from-[#701111] hover:to-[#701111] btn-xs sm:btn-sm rounded-lg font-bold flex items-center gap-1 border-none shadow-sm"
              >
                {isTailoring || isParsing ? <span className="loading loading-spinner loading-xs mr-1"></span> : <SparklesIcon />}
                Generate with AI
              </button>

              <button
                onClick={handleSaveCv}
                disabled={isSaving}
                className="btn bg-[#8E1616] hover:bg-[#701111] text-white btn-xs sm:btn-sm rounded-lg border-none font-bold px-4"
              >
                {isSaving && <span className="loading loading-spinner loading-xs mr-1"></span>}
                Save CV
              </button>
            </>
          )}

          <button
            onClick={handleCreateNewCv}
            className="btn bg-[#8E1616] hover:bg-[#701111] text-white btn-xs sm:btn-sm rounded-lg border-none font-bold flex items-center gap-1"
          >
            <PlusIcon />
            New CV
          </button>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
          {/* Welcome Banner with Visual Figures */}
          <div className="bg-gradient-to-r from-[#8E1616]/10 via-[#E8C999]/15 to-[#8E1616]/5 border border-[#8E1616]/20 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="space-y-3 max-w-xl text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E1616]/10 text-[#8E1616] font-mono text-[10px] font-bold uppercase">
                <span>● Next-Gen Career Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
                Role-Specific AI Resume Studio & ATS Calibration
              </h2>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                Automatically organize and format your verified technical skills, GitHub repositories, online courses, and track certificates into multi-section ATS-friendly resumes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  disabled={isTailoring}
                  className="btn bg-[#8E1616] hover:bg-[#701111] text-white btn-sm rounded-xl font-bold border-none shadow flex items-center gap-2"
                >
                  <SparklesIcon />
                  Launch AI CV Generator
                </button>
                <button
                  onClick={handleCreateNewCv}
                  className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-sm rounded-xl font-bold"
                >
                  + Blank Resume
                </button>
                <Link
                  href="/portfolio/builder"
                  className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-sm rounded-xl font-bold"
                >
                  🌐 Portfolio Builder
                </Link>
              </div>
            </div>

            {/* Visual Figure Showcase */}
            <div className="flex items-center gap-4 shrink-0">
              <AiAssistantFigure
                size="md"
                speechText="Targeting a new role? Let's calibrate your CV!"
                statusText="ATS Ready"
              />
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
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium max-w-md mx-auto">
                  Create your first CV in minutes with tailored ATS analysis and GitHub repository imports.
                </p>
                <button
                  onClick={handleCreateNewCv}
                  className="btn bg-primary hover:bg-[#8E1616] text-white btn-sm rounded-xl font-bold border-none mt-2"
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
                            onClick={(e) => handleDuplicateCv(item._id || item.id || '', e)}
                            className="btn btn-ghost btn-xs btn-square text-stone-700 dark:text-stone-300 font-medium hover:text-primary"
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
                      <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-0.5">
                        {item.personal?.title || 'Software Engineer'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-mono">
                        Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'recently'}
                      </span>
                      <div className="flex gap-2">
                        <button className="btn btn-xs bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-bold rounded-lg">
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
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                Paste job description text to calculate keyword match scores and actionable missing skill recommendations.
              </p>
            </div>
            <div className="bg-base-200 border border-base-300 p-5 rounded-2xl space-y-2">
              <span className="text-xl">🎨</span>
              <h4 className="font-extrabold text-sm">4 Distinct Templates</h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                Choose between Classic Professional, Modern Developer, Minimal ATS, and Creative Modern layouts.
              </p>
            </div>
            <div className="bg-base-200 border border-base-300 p-5 rounded-2xl space-y-2">
              <span className="text-xl">🌐</span>
              <h4 className="font-extrabold text-sm">Portfolio Builder</h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                Convert your profile & GitHub repositories into a published personal portfolio website at /portfolio/[username].
              </p>
              <Link href="/portfolio/builder" className="text-xs text-primary font-bold hover:underline block pt-1">
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
                  className="input input-sm font-extrabold text-sm bg-base-200 text-base-content focus:border-primary border-base-300 rounded-lg flex-grow"
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
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-base-200 border border-dashed border-base-300 p-3 rounded-lg w-full">
                        {cv.personal?.photoUrl ? (
                          <img
                            src={cv.personal.photoUrl}
                            alt="Avatar"
                            className="w-14 h-14 rounded-lg object-cover border border-base-300 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-base-300 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-300 font-medium shrink-0">
                            <CameraIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="text-center sm:text-left flex-1 space-y-1">
                          <p className="font-bold text-[10px] text-base-content">Profile Picture</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('cvPhotoFileInput')?.click()}
                            className="btn btn-xs bg-primary hover:bg-[#8E1616] border-none text-white rounded mt-1 px-3 font-bold"
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
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">First Name</label>
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
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Last Name</label>
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
                        <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Professional Title</label>
                        <input
                          type="text"
                          value={professionalTitle}
                          onChange={(e) => setProfessionalTitle(e.target.value)}
                          className="input input-bordered input-sm bg-base-200 font-semibold"
                          placeholder="Senior Software Engineer"
                        />
                      </div>

                      <div className="form-control">
                        <div className="flex justify-between items-center mb-1">
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium p-0">
                            Professional Summary
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRegenerateSection('summary')}
                            disabled={isRegeneratingSection['summary']}
                            className="btn btn-xs bg-[#8E1616]/10 text-[#8E1616] hover:bg-[#8E1616] hover:text-white border-none font-bold rounded-md flex items-center gap-1"
                          >
                            {isRegeneratingSection['summary'] ? <span className="loading loading-spinner loading-xs" /> : <span>⚡</span>}
                            <span>Regenerate Summary</span>
                          </button>
                        </div>
                        <textarea
                          value={cv.personal?.summary || ''}
                          onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, summary: e.target.value } })}
                          className="textarea textarea-bordered textarea-sm h-24 bg-base-200 font-semibold resize-none focus:border-[#8E1616]"
                          placeholder="Passionate engineer with experience in NestJS and Next.js..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Email</label>
                          <input
                            type="email"
                            value={cv.personal?.email || ''}
                            onChange={(e) => setCv({ ...cv, personal: { ...cv.personal, email: e.target.value } })}
                            className="input input-bordered input-sm bg-base-200 font-semibold"
                            placeholder="harry@example.com"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Phone</label>
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
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium flex justify-between">
                            <span>GitHub Profile URL</span>
                            {cv.personal?.gitHub && <span className="text-[9px] text-[#8E1616] font-mono font-bold">Connected</span>}
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
                          <label className="label text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium flex justify-between">
                            <span>LinkedIn Profile URL</span>
                            {cv.personal?.linkedIn && <span className="text-[9px] text-[#8E1616] font-mono font-bold">Connected</span>}
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

                  {/* Skills Section */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>Categorized Skills ({cv.skills?.length || 0})</span>
                      </div>
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-stone-700 dark:text-stone-300 font-medium">Add, remove, or auto-organize skills for ATS scans</span>
                        <button
                          type="button"
                          onClick={() => handleRegenerateSection('skills')}
                          disabled={isRegeneratingSection['skills']}
                          className="btn btn-xs bg-[#8E1616]/10 text-[#8E1616] hover:bg-[#8E1616] hover:text-white border-none font-bold rounded-md flex items-center gap-1"
                        >
                          {isRegeneratingSection['skills'] ? <span className="loading loading-spinner loading-xs" /> : <span>✨</span>}
                          <span>Reorganize with AI</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-base-200 border border-base-300 min-h-[60px]">
                        {(cv.skills || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="badge bg-base-100 border border-base-300 text-stone-800 dark:text-stone-200 text-xs font-bold gap-1.5 py-2.5 px-3 rounded-lg shadow-sm"
                          >
                            <span>{s}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSkills = [...cv.skills];
                                newSkills.splice(idx, 1);
                                setCv({ ...cv, skills: newSkills });
                              }}
                              className="text-stone-600 hover:text-error font-extrabold ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="newSkillInput"
                          placeholder="Add new skill (e.g. Next.js, Docker, GraphQL)..."
                          className="input input-bordered input-xs bg-base-200 font-semibold flex-grow rounded-lg"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !cv.skills?.includes(val)) {
                                setCv({ ...cv, skills: [...(cv.skills || []), val] });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('newSkillInput') as HTMLInputElement;
                            if (input && input.value.trim() && !cv.skills?.includes(input.value.trim())) {
                              setCv({ ...cv, skills: [...(cv.skills || []), input.value.trim()] });
                              input.value = '';
                            }
                          }}
                          className="btn bg-[#8E1616] hover:bg-[#701111] text-white btn-xs rounded-lg font-bold border-none"
                        >
                          + Add Skill
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Projects Section with GitHub Import & AI Actions */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileIcon />
                        <span>Key Projects ({cv.projects?.length || 0})</span>
                      </div>
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsGitHubImportOpen(true)}
                            className="btn btn-xs btn-outline border-[#8E1616] text-[#8E1616] hover:bg-[#8E1616]/10 rounded-lg font-bold flex items-center gap-1"
                          >
                            💻 Import from GitHub
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateSection('projects')}
                            disabled={isRegeneratingSection['projects'] || !cv.projects?.length}
                            className="btn btn-xs bg-[#8E1616]/10 text-[#8E1616] hover:bg-[#8E1616] hover:text-white border-none font-bold rounded-lg flex items-center gap-1"
                          >
                            {isRegeneratingSection['projects'] ? <span className="loading loading-spinner loading-xs" /> : <span>✨</span>}
                            <span>Format with AI</span>
                          </button>
                        </div>
                        <button type="button" onClick={addProject} className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs rounded-lg font-bold">
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
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Project Name</label>
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
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Project URL / GitHub</label>
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
                            <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Description</label>
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

                  {/* Work Experience section with AI Actions */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon />
                        <span>Work Experience ({cv.experience?.length || 0})</span>
                      </div>
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRegenerateSection('experience')}
                          disabled={isRegeneratingSection['experience'] || !cv.experience?.length}
                          className="btn btn-xs bg-[#8E1616]/10 text-[#8E1616] hover:bg-[#8E1616] hover:text-white border-none font-bold rounded-lg flex items-center gap-1"
                        >
                          {isRegeneratingSection['experience'] ? <span className="loading loading-spinner loading-xs" /> : <span>⚡</span>}
                          <span>Enhance Bullets with AI</span>
                        </button>
                        <button type="button" onClick={addExperience} className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs rounded-lg font-bold">
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
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Company</label>
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
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Role</label>
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
                            <div className="flex justify-between items-center mb-1">
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium p-0">Description & Bullets</label>
                              <button
                                type="button"
                                onClick={() => handleEnhanceDescription(i)}
                                className="text-[9px] text-[#8E1616] font-bold hover:underline"
                              >
                                ⚡ Improve single bullet
                              </button>
                            </div>
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

                  {/* Education Section */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <span>🎓</span>
                      <span>Education ({cv.education?.length || 0})</span>
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-end">
                        <button type="button" onClick={addEducation} className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs rounded-lg font-bold">
                          + Add Education
                        </button>
                      </div>

                      {cv.education && cv.education.map((edu, i) => (
                        <div key={i} className="bg-base-200 border border-base-300 p-4 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeEducation(i)}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost text-error"
                          >
                            <CloseIcon />
                          </button>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">School / University</label>
                              <input
                                type="text"
                                value={edu.school}
                                onChange={(e) => {
                                  const updated = [...cv.education];
                                  if (updated[i]) updated[i].school = e.target.value;
                                  setCv({ ...cv, education: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                            <div className="form-control">
                              <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Degree & Major</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => {
                                  const updated = [...cv.education];
                                  if (updated[i]) updated[i].degree = e.target.value;
                                  setCv({ ...cv, education: updated });
                                }}
                                className="input input-bordered input-xs bg-base-100 font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unlimited Custom Sections */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                    <input type="checkbox" />
                    <div className="collapse-title font-extrabold text-xs uppercase tracking-wide text-base-content flex items-center gap-2">
                      <SparklesIcon />
                      <span>Custom Sections ({cv.customSections?.length || 0})</span>
                    </div>
                    <div className="collapse-content space-y-4 pt-1">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium">Add free-form sections like Hackathons, Research, or Volunteering.</p>
                        <button type="button" onClick={addCustomSection} className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none btn-xs rounded-lg font-bold">
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
                            <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Section Title</label>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => updateCustomSectionTitle(sec.id, e.target.value)}
                              className="input input-bordered input-xs bg-base-100 font-extrabold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="label text-[9px] font-bold uppercase text-stone-700 dark:text-stone-300 font-medium">Bullet Points</label>
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
                              className="btn btn-xs btn-ghost text-[#8E1616] font-bold"
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
                  <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium">
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
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                          (cv.template || 'modern') === tpl.id
                            ? 'bg-[#8E1616]/10 border-[#8E1616] ring-2 ring-[#8E1616]/20'
                            : 'bg-base-100 border-base-300 hover:border-base-400'
                        }`}
                      >
                        <h4 className="font-extrabold text-xs text-base-content">{tpl.title}</h4>
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium leading-normal">{tpl.desc}</p>
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
                className="btn btn-xs bg-[#8E1616] hover:bg-[#701111] text-white rounded font-bold"
              >
                Export PDF
              </button>
            </div>

            <div id="cv-preview-sheet" className="flex-grow w-full max-w-[595px] bg-white text-gray-800 shadow-2xl rounded border border-gray-300 overflow-y-auto relative flex flex-col select-text">
              <CvRenderer cv={cv} />
            </div>
          </section>
        </div>
      )}

      {/* Advanced AI CV Generator Modal */}
      <AdvancedAiCvModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={handleAdvancedAiGenerate}
        isGenerating={isTailoring}
        initialRole={targetJobTitle || 'Frontend Developer'}
      />

      {/* Other Modals */}
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
    </div>
  );
}