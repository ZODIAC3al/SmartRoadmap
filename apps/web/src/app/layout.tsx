import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";

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
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SmartRoadmap — AI-Powered Personalized Learning & Hiring Platform",
  description:
    "Verify your tech skills. SmartRoadmap designs adaptive, AI-generated curriculum roadmaps and matches pre-vetted candidates directly with top hiring teams.",
  keywords: [
    "AI Roadmap",
    "Career assessment",
    "Skill verification",
    "Technical learning",
    "SaaS recruitment",
    "Software engineer jobs",
    "Verified talent ecosystem",
  ],
  authors: [{ name: "Developia Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "SmartRoadmap — AI-Powered Personalized Learning & Hiring Platform",
    description:
      "Verify your tech skills. SmartRoadmap designs adaptive, AI-generated curriculum roadmaps and matches pre-vetted candidates directly with top hiring teams.",
    url: "https://smartroadmap.dev",
    siteName: "SmartRoadmap",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartRoadmap — AI-Powered Personalized Learning & Hiring Platform",
    description:
      "Verify your tech skills. SmartRoadmap designs adaptive, AI-generated curriculum roadmaps and matches pre-vetted candidates directly with top hiring teams.",
  },
};

import { AppContextProvider } from "@/components/AppContext";
import Footer from "@/components/Footer";
import BottomNav from "./Bottomnav";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="smartlight"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base-100 text-base-content min-h-screen font-sans antialiased flex flex-col">
        <AppContextProvider>
          <Navbar />
          <main className="flex-grow pt-24 pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            theme="colored"
          />
        </AppContextProvider>
      </body>
    </html>
  );
}
