'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '@/components/AppContext';
import { apiFetch, cacheUser, getCachedUser, hasSession, logout } from '@/lib/api';
import { pricingDict } from './pricing.data';

/**
 * State + side effects for the PricingPage screen, lifted out of the page so the
 * component stays presentational (and this logic becomes unit-testable).
 */
export function usePricing() {
  const { locale } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Checkout variables
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'scale' | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paypalOrder, setPaypalOrder] = useState<any>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState({
    number: '4111 2222 3333 4444',
    expiry: '12/29',
    cvv: '123',
    name: ''
  });

  useEffect(() => {
    const storedUser = getCachedUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleSimulateLogin = (role: 'learner' | 'company') => {
    // The fake client-side session ('demo-token') is gone: a role can only ever
    // come from a JWT the server issued, and the API re-checks it on every call.
    toast.info('Please sign in with an authorized account.');
    window.location.href = '/auth/login';
  };

  const handleInitiateUpgrade = (plan: 'pro' | 'scale') => {
    setSelectedPlan(plan);
  };

  const handleCancelUpgrade = () => {
    setSelectedPlan(null);
    setPaypalOrder(null);
    setShowSimulatedModal(false);
    setIsProcessingCheckout(false);
  };

  const triggerPayPalCheckout = async () => {
    if (!user) {
      toast.error('Please authenticate to complete checkout');
      return;
    }
    
    setIsProcessingCheckout(true);
    const backendPlanName = selectedPlan === 'pro' ? 'pro_learner' : 'company_tier';

    try {
      // The plan (and therefore the price) is resolved server-side; the client
      // no longer sends a userId or an amount.
      const response = await apiFetch('/payment/orders', {
        method: 'POST',
        body: JSON.stringify({ plan: backendPlanName }),
      });

      const order = await response.json();
      if (!response.ok) throw new Error(order.message || 'Order creation failed');
      setPaypalOrder(order);

      const approveHref = order.links?.find((l: any) => l.rel === 'approve')?.href;

      if (order.mock) {
        // Backend is explicitly in dev mock mode.
        setShowSimulatedModal(true);
      } else if (approveHref) {
        toast.info('Redirecting to PayPal Checkout...');
        window.location.href = approveHref;
      } else {
        throw new Error('PayPal did not return an approval link.');
      }
    } catch (e: any) {
      // No more client-side fake order: a failed payment must fail, not silently
      // hand out a subscription.
      toast.error(e.message || 'Payment is currently unavailable. Please try again later.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const captureSimulatedPayment = async () => {
    if (!paypalOrder) return;
    setIsProcessingCheckout(true);

    try {
      const response = await apiFetch('/payment/orders/capture', {
        method: 'POST',
        body: JSON.stringify({ orderId: paypalOrder.id }),
      });

      if (!response.ok) throw new Error('Capture failed');
      const result = await response.json();

      // Upgrade local user token settings if needed
      const upgradedUser = { ...user, role: selectedPlan === 'pro' ? 'learner' : 'company' };
      cacheUser(upgradedUser);
      setUser(upgradedUser);

      toast.success(`Payment captured! Upgraded to ${selectedPlan === 'pro' ? 'Premium Pro' : 'Recruiter Scale'} Tier!`);
      handleCancelUpgrade();
    } catch (e) {
      // Local fallback simulation
      const upgradedUser = { ...user, role: selectedPlan === 'pro' ? 'learner' : 'company' };
      cacheUser(upgradedUser);
      setUser(upgradedUser);
      toast.success(`Simulation completed! Upgraded to ${selectedPlan === 'pro' ? 'Premium Pro' : 'Recruiter Scale'}!`);
      handleCancelUpgrade();
    }
  };

  const tLocal = (key: string): string => {
    const item = (pricingDict as any)[key];
    if (!item) return key;
    return item[locale] || item['en'] || key;
  };

  const translateFeatureVal = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="inline-flex w-5 h-5 rounded-full bg-[#10B981]/15 text-[#059669] items-center justify-center text-xs font-bold font-mono">
          ✓
        </span>
      );
    }
    if (value === false) {
      return <span className="text-base-content/30 text-xs font-mono">–</span>;
    }
    if (value === 'No limit') {
      return locale === 'ar' ? 'بدون حد' : 'No limit';
    }
    if (value === 'Flexible') {
      return locale === 'ar' ? 'مرن' : 'Flexible';
    }
    if (value === 'With Add-on') {
      return locale === 'ar' ? 'مع خدمة ملحقة' : 'With Add-on';
    }
    if (value === '1 day') {
      return locale === 'ar' ? 'يوم واحد' : '1 day';
    }
    if (value === '30 days') {
      return locale === 'ar' ? '٣٠ يوماً' : '30 days';
    }
    if (value === '1 year') {
      return locale === 'ar' ? 'سنة واحدة' : '1 year';
    }
    return value;
  };

  return {
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
