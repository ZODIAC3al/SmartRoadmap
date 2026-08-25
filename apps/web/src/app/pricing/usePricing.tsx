"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import {
  apiFetch,
  cacheUser,
  getCachedUser,
} from "@/lib/api";
import { pricingDict } from "./pricing.data";

/**
 * State + side effects for the PricingPage screen, lifted out of the page so the
 * component stays presentational (and this logic becomes unit-testable).
 */
export function usePricing() {
  const { locale } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Role Audience State ('learner' | 'company')
  const [audience, setAudience] = useState<"learner" | "company">("learner");

  // Checkout variables
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<
    "pro" | "learner_pro" | "growth" | "scale" | null
  >(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paypalOrder, setPaypalOrder] = useState<any>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState({
    number: "4111 2222 3333 4444",
    expiry: "12/29",
    cvv: "123",
    name: "",
  });

  useEffect(() => {
    const storedUser = getCachedUser();
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.role === "company") {
        setAudience("company");
      } else if (storedUser.role === "learner") {
        setAudience("learner");
      }
    }
  }, []);

  const handleSimulateLogin = (role: "learner" | "company") => {
    toast.info("Please sign in with an authorized account.");
    window.location.href = "/auth/login";
  };

  const handleInitiateUpgrade = async (plan: "pro" | "learner_pro" | "growth" | "scale") => {
    if (!user) {
      toast.info("Please sign in to upgrade your subscription.");
      window.location.href = "/auth/login";
      return;
    }

    const backendPlan = plan === "pro" ? "learner_pro" : plan;
    setIsProcessingCheckout(true);
    try {
      const res = await apiFetch("/billing/checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan: backendPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create checkout session");
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Upgrade checkout failed. Please try again.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCancelUpgrade = () => {
    setSelectedPlan(null);
    setPaypalOrder(null);
    setShowSimulatedModal(false);
    setIsProcessingCheckout(false);
  };

  const triggerPayPalCheckout = async () => {
    if (!user) {
      toast.error("Please authenticate to complete checkout");
      return;
    }

    setIsProcessingCheckout(true);
    const backendPlanName =
      selectedPlan === "pro" || selectedPlan === "learner_pro"
        ? "learner_pro"
        : selectedPlan || "growth";

    try {
      const response = await apiFetch("/payment/orders", {
        method: "POST",
        body: JSON.stringify({ plan: backendPlanName }),
      });

      const order = await response.json();
      if (!response.ok)
        throw new Error(order.message || "Order creation failed");
      setPaypalOrder(order);

      const approveHref = order.links?.find(
        (l: any) => l.rel === "approve",
      )?.href;

      if (order.mock) {
        setShowSimulatedModal(true);
      } else if (approveHref) {
        toast.info("Redirecting to PayPal Checkout...");
        window.location.href = approveHref;
      } else {
        throw new Error("PayPal did not return an approval link.");
      }
    } catch (e: any) {
      toast.error(
        e.message ||
          "Payment is currently unavailable. Please try again later.",
      );
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const captureSimulatedPayment = async () => {
    setIsProcessingCheckout(true);

    const isLearnerPlan = selectedPlan === "pro" || selectedPlan === "learner_pro";
    const targetRole = isLearnerPlan ? "learner" : "company";
    const planNameDisplay =
      selectedPlan === "pro" || selectedPlan === "learner_pro"
        ? "Learner Pro"
        : selectedPlan === "growth"
        ? "Company Growth"
        : "Company Scale";

    const targetPlanName =
      selectedPlan === "pro" || selectedPlan === "learner_pro"
        ? "learner_pro"
        : selectedPlan === "growth"
        ? "growth"
        : "scale";

    try {
      if (paypalOrder) {
        await apiFetch("/payment/orders/capture", {
          method: "POST",
          body: JSON.stringify({ orderId: paypalOrder.id }),
        });
      } else {
        await apiFetch("/billing/checkout-session", {
          method: "POST",
          body: JSON.stringify({ plan: targetPlanName }),
        });
      }

      const upgradedUser = {
        ...user,
        role: targetRole,
      };
      cacheUser(upgradedUser);
      setUser(upgradedUser);

      toast.success(`Payment captured! Upgraded to ${planNameDisplay} Tier!`);
      handleCancelUpgrade();
    } catch (e) {
      const upgradedUser = {
        ...user,
        role: targetRole,
      };
      cacheUser(upgradedUser);
      setUser(upgradedUser);
      toast.success(`Simulation completed! Upgraded to ${planNameDisplay}!`);
      handleCancelUpgrade();
    }
  };

  const tLocal = (key: string): string => {
    const item = (pricingDict as any)[key];
    if (!item) return key;
    return item[locale] || item["en"] || key;
  };

  const translateFeatureVal = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="inline-flex w-5 h-5 rounded-full bg-[#8E1616]/15 text-[#8E1616] items-center justify-center text-xs font-bold font-mono">
          ✓
        </span>
      );
    }
    if (value === false) {
      return <span className="text-base-content/70 dark:text-stone-400 font-medium text-xs font-mono">–</span>;
    }
    if (value === "No limit") {
      return locale === "ar" ? "بدون حد" : "No limit";
    }
    if (value === "Flexible") {
      return locale === "ar" ? "مرن" : "Flexible";
    }
    if (value === "With Add-on") {
      return locale === "ar" ? "مع خدمة ملحقة" : "With Add-on";
    }
    if (value === "1 day") {
      return locale === "ar" ? "يوم واحد" : "1 day";
    }
    if (value === "30 days") {
      return locale === "ar" ? "٣٠ يوماً" : "30 days";
    }
    if (value === "1 year") {
      return locale === "ar" ? "سنة واحدة" : "1 year";
    }
    return value;
  };

  return {
    audience,
    setAudience,
    captureSimulatedPayment,
    handleCancelUpgrade,
    handleInitiateUpgrade,
    handleSimulateLogin,
    isProcessingCheckout,
    locale,
    openFaq,
    paypalOrder,
    selectedPlan,
    setIsProcessingCheckout,
    setOpenFaq,
    setPaypalOrder,
    setSelectedPlan,
    setShowSimulatedModal,
    setSimulatedCard,
    setUser,
    showSimulatedModal,
    simulatedCard,
    tLocal,
    translateFeatureVal,
    triggerPayPalCheckout,
    user,
  };
}
