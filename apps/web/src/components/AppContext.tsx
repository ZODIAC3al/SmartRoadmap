"use client";

import React, { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setTheme, setLocale } from "@/store/slices/uiSlice";
import { connectSocket } from "@/store/socket/socketMiddleware";

type Theme = "smartlight" | "smartdark";
type Locale = "en" | "ar";

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  // Load configuration on mount & connect socket
  useEffect(() => {
    const savedTheme = localStorage.getItem("smart_theme") as Theme;
    const savedLocale = localStorage.getItem("smart_locale") as Locale;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;
    dispatch(connectSocket({ token }));

    if (savedTheme) {
      dispatch(setTheme(savedTheme));
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "smartlight");
    }

    if (savedLocale) {
      dispatch(setLocale(savedLocale));
      document.documentElement.setAttribute("lang", savedLocale);
      document.documentElement.setAttribute(
        "dir",
        savedLocale === "ar" ? "rtl" : "ltr",
      );
    } else {
      document.documentElement.setAttribute("lang", "en");
      document.documentElement.setAttribute("dir", "ltr");
    }

    // Load OneSignal Web SDK dynamically on client side
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.onload = () => {
        const OneSignal = (window as any).OneSignal || [];
        OneSignal.push(() => {
          OneSignal.init({
            appId: "9f79abe9-4b9c-46b2-b381-5a434cc909e3",
            allowLocalhostAsSecureOrigin: true,
          });
        });
      };
      document.body.appendChild(script);
    }

    // Register PWA service worker in production, or unregister in development
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("Service Worker unregistered in development mode");
              }
            });
          }
        });
        if (window.caches) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) =>
            console.log("PWA ServiceWorker registered with scope:", reg.scope),
          )
          .catch((err) =>
            console.error("PWA ServiceWorker registration failed:", err),
          );
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}
