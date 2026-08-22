'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useGetCompanyOverviewQuery,
  useUpdateCompanyProfileMutation,
  useUploadCompanyLogoMutation,
  useUploadCompanyCoverMutation,
} from '@/store/api/companyApi';

export function ProfileEditor() {
  const { data: overview, isLoading } = useGetCompanyOverviewQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateCompanyProfileMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadCompanyLogoMutation();
  const [uploadCover, { isLoading: isUploadingCover }] = useUploadCompanyCoverMutation();

  const [name, setName] = useState('TechCorp Inc.');
  const [website, setWebsite] = useState('https://techcorp.example.com');
  const [industry, setIndustry] = useState('Software & Cloud Architecture');
  const [size, setSize] = useState('11-50');
  const [about, setAbout] = useState('Building next-generation cloud solutions and AI-driven platforms.');
  const [logoUrl, setLogoUrl] = useState<string>('/logo-placeholder.png');
  const [coverUrl, setCoverUrl] = useState<string>('/cover-placeholder.png');

  useEffect(() => {
    if (overview) {
      if (overview.name) setName(overview.name);
      if (overview.website) setWebsite(overview.website);
      if (overview.industry) setIndustry(overview.industry);
      if (overview.size) setSize(overview.size);
      if (overview.about) setAbout(overview.about);
      if (overview.logoUrl) setLogoUrl(overview.logoUrl);
      if (overview.coverImageUrl) setCoverUrl(overview.coverImageUrl);
    }
  }, [overview]);

  const companyId = (overview as any)?.companyId || 'me';
  const slug = (overview as any)?.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadLogo({ id: companyId, formData }).unwrap();
      if (res?.url) {
        setLogoUrl(res.url);
      } else {
        setLogoUrl(URL.createObjectURL(file));
      }
      toast.success('Company logo uploaded and saved to MongoDB!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload company logo');
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadCover({ id: companyId, formData }).unwrap();
      if (res?.url) {
        setCoverUrl(res.url);
      } else {
        setCoverUrl(URL.createObjectURL(file));
      }
      toast.success('Company cover image uploaded and saved to MongoDB!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload company cover image');
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.info('Company profile initialized.');
      return;
    }
    try {
      await updateProfile({
        id: companyId,
        body: { name, website, industry, size, about },
      }).unwrap();
      toast.success('Company profile updated and saved to MongoDB!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update company profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-base-100 rounded-3xl border border-base-300">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Loading company profile...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Section (7 cols) */}
      <div className="lg:col-span-7 bg-base-100 p-6 rounded-3xl border border-base-300 shadow-xs flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-base-200 pb-3">
          <h3 className="font-extrabold text-base text-base-content font-heading">
            Company Profile & Trust Information
          </h3>
          <span className="badge badge-primary text-xs font-mono font-bold">
            Scale Plan Verified
          </span>
        </div>

        {/* Cover & Logo Upload Area */}
        <div className="relative rounded-2xl overflow-hidden border border-base-300 bg-base-200 h-40 group">
          {coverUrl && coverUrl !== '/cover-placeholder.png' ? (
            <img src={coverUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center text-stone-600 dark:text-stone-400 font-medium text-xs font-mono">
              21:9 Cover Banner Image
            </div>
          )}

          <label className="absolute top-3 right-3 bg-base-100/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-base-300 text-xs font-bold text-base-content cursor-pointer hover:bg-base-100 flex items-center gap-1.5 shadow-xs">
            {isUploadingCover ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span>{isUploadingCover ? 'Uploading...' : 'Change Cover'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={isUploadingCover} />
          </label>

          {/* Logo Badge Overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-2xl bg-base-100 border-2 border-base-100 shadow-md overflow-hidden flex items-center justify-center">
              {logoUrl && logoUrl !== '/logo-placeholder.png' ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-lg text-primary">TC</span>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                {isUploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={isUploadingLogo} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-sm input-bordered text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Public Profile Slug</label>
          <div className="bg-base-200 px-3 py-2 rounded-xl text-xs font-mono text-primary border border-base-300">
            https://smartroadmap.app/companies/{slug}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input input-sm input-bordered text-xs rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input input-sm input-bordered text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 font-medium">Company Bio / Overview</label>
          <textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="textarea textarea-bordered text-xs rounded-xl"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary btn-sm rounded-xl font-bold self-start mt-2 flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Profile Changes</span>
        </button>
      </div>

      {/* Live Preview Card (5 cols) */}
      <div className="lg:col-span-5 bg-base-100 p-6 rounded-3xl border border-base-300 shadow-xs flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-base-200 pb-2">
          <h3 className="font-bold text-sm text-base-content">
            Learner & Public View Preview
          </h3>
          <Link
            href={`/companies/${slug}`}
            className="text-xs text-primary font-bold hover:underline"
          >
            Open Public Page →
          </Link>
        </div>

        <div className="border border-base-300 rounded-2xl overflow-hidden bg-base-200">
          <div className="h-28 bg-gradient-to-r from-primary/30 to-secondary/30 relative">
            {coverUrl && coverUrl !== '/cover-placeholder.png' && (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4 pt-0 relative">
            <div className="w-14 h-14 rounded-2xl bg-base-100 border-2 border-base-100 shadow-md -mt-7 mb-3 overflow-hidden flex items-center justify-center">
              {logoUrl && logoUrl !== '/logo-placeholder.png' ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-base text-primary">TC</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base text-base-content font-heading">
                {name}
              </h4>
              <span className="badge badge-primary text-[10px] font-bold font-mono">
                Verified Partner
              </span>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-1 line-clamp-2">
              {about}
            </p>

            <div className="mt-4 pt-3 border-t border-base-300 flex justify-between text-xs text-stone-700 dark:text-stone-300 font-medium">
              <span>{industry}</span>
              <span className="font-mono">{size} employees</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
