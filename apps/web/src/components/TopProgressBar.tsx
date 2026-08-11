"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopProgressBar() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // Intercept clicks on links to show instant top loading bar
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.target &&
        target.pathname !== window.location.pathname
      ) {
        setNavigating(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // When pathname changes, finish the navigation bar
  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  if (!navigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div className="h-full bg-gradient-to-r from-[#E1251B] via-[#FF5A4E] to-[#FA5D29] animate-[progress_1s_ease-in-out_infinite] shadow-[0_0_10px_#E1251B]" />
    </div>
  );
}
