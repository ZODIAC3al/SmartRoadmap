import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";
import { StoreProvider } from "@/store/provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#080B12",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Devotopia — AI-Powered Personalized Learning & Hiring Platform",
  description:
    "Verify your tech skills. Devotopia designs adaptive, AI-generated curriculum roadmaps, verified achievement badges, community mentoring, and matches pre-vetted candidates directly with top hiring teams.",
  keywords: [
    "Devotopia",
    "SmartRoadmap",
    "AI Roadmap",
    "Career assessment",
    "Skill verification",
    "Technical learning",
    "SaaS recruitment",
    "Software engineer jobs",
    "Verified talent ecosystem",
    "Community Mentoring",
  ],
  authors: [{ name: "Devotopia Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Devotopia — AI-Powered Personalized Learning & Hiring Platform",
    description:
      "Verify your tech skills. Devotopia designs adaptive, AI-generated curriculum roadmaps, verified achievement badges, community mentoring, and matches pre-vetted candidates directly with top hiring teams.",
    url: "https://devotopia.dev",
    siteName: "Devotopia",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Devotopia — AI-Powered Personalized Learning & Hiring Platform",
    description:
      "Verify your tech skills. Devotopia designs adaptive, AI-generated curriculum roadmaps, verified achievement badges, community mentoring, and matches pre-vetted candidates directly with top hiring teams.",
  },
};

import { AppContextProvider } from "@/components/AppContext";
import Footer from "@/components/Footer";
import BottomNav from "./Bottomnav";
import ChatSidebar from "@/components/ChatSidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "lineicons/dist/lineicons.css";
import { QuotaExceededModal } from "@/components/common/QuotaExceededModal";
import AnimatedBackground from "@/components/AnimatedBackground";
import MotionProvider from "@/components/MotionProvider";

import TopProgressBar from "@/components/TopProgressBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="smartdark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base-100 text-base-content min-h-screen font-sans antialiased flex flex-col relative selection:bg-[#E1251B] selection:text-white transition-colors duration-200">
        <StoreProvider>
          <AppContextProvider>
            <MotionProvider>
              <TopProgressBar />
              <AnimatedBackground />
              <Navbar />
              <main className="flex-grow pt-24 pb-16 md:pb-0">{children}</main>
            <AnimatedBackground />
            <Navbar />
            <main className="flex-grow pt-24 pb-16 md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              theme="colored"
              limit={3}
              closeOnClick
              draggable
            />
            <ChatSidebar />
            <QuotaExceededModal />
          </AppContextProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
