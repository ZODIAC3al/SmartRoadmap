'use client';

import React from 'react';
import { ProfileEditor } from '@/components/company/ProfileEditor';

export default function CompanyProfileEditorPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#181B23]">
          Company Profile Settings
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Customize your company&apos;s public profile and live branding.
        </p>
      </div>

      <ProfileEditor />
    </div>
  );
}
