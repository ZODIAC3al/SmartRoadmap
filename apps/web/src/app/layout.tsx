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
  themeColor: "#080B12",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SmartRoadmap — Verified Learning & Talent Platform",
  description:
    "Build a structured learning path, verify practical skills, learn with experienced mentors, and connect verified talent with hiring teams.",
  keywords: [
    "Learning roadmap",
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
    title: "SmartRoadmap — Verified Learning & Talent Platform",
    description:
      "Build a structured learning path, verify practical skills, learn with experienced mentors, and connect verified talent with hiring teams.",
    url: "https://smartroadmap.dev",
    siteName: "SmartRoadmap",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartRoadmap — Verified Learning & Talent Platform",
    description:
      "Build a structured learning path, verify practical skills, learn with experienced mentors, and connect verified talent with hiring teams.",
  },
};

import { AppContextProvider } from "@/components/AppContext";
import Footer from "@/components/Footer";
import BottomNav from "./Bottomnav";
import ChatSidebar from "@/components/ChatSidebar";
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
          <ChatSidebar />
        </AppContextProvider>
      </body>
    </html>
  );
}
