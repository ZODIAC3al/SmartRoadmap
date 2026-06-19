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

export const metadata: Metadata = {
  title: "SmartRoadmap — AI-Powered Personalized Learning & Hiring Platform",
  description: "AI-generated adaptive learning roadmaps, mastery verification quizzes, and pre-vetted candidate matching for tech jobs.",
};

import { AppContextProvider } from "@/components/AppContext";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-theme="smartlight" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-base-100 text-base-content min-h-screen font-sans antialiased flex flex-col">
        <AppContextProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppContextProvider>
      </body>
    </html>
  );
}
