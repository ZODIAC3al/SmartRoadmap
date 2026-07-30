import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume & CV Builder | SmartRoadmap",
  description:
    "Create, edit, and export your professional resume with SmartRoadmap. Present verified technical skills and connect with hiring teams.",
  keywords: [
    "Resume Builder",
    "AI CV Parser",
    "PDF CV Export",
    "Developer Resume",
    "JobsSpark resume",
    "Skill Verification Passport",
    "SmartRoadmap",
  ],
};

export default function CvLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
