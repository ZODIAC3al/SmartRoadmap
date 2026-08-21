"use client";

import React from "react";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CompanyPendingScreenProps {
  status: "pending" | "rejected";
  rejectionReason?: string;
  companyName?: string;
}

/**
 * Shown in place of the Company Dashboard when the authenticated company
 * account has not yet been approved (or was rejected) by an admin.
 *
 * This is the frontend reflection of the backend CompanyApprovalGuard.
 * The real security enforcement happens on the server; this screen is UX.
 */
export default function CompanyPendingScreen({
  status,
  rejectionReason,
  companyName,
}: CompanyPendingScreenProps) {
  const router = useRouter();

  const isPending = status === "pending";

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-6 bg-base-100">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg ${
            isPending
              ? "bg-amber-100 text-amber-500 border-2 border-amber-200"
              : "bg-red-100 text-red-500 border-2 border-red-200"
          }`}
        >
          {isPending ? "⏳" : "🚫"}
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black tracking-tight text-base-content">
            {isPending
              ? "Account Pending Approval"
              : "Account Registration Rejected"}
          </h1>

          {companyName && (
            <p className="text-sm font-semibold text-base-content/60">
              {companyName}
            </p>
          )}

          <p className="text-sm text-base-content/60 leading-relaxed max-w-sm mx-auto">
            {isPending
              ? "Your company account is currently under review by our team. You will receive access once an administrator approves your registration."
              : "Your company account registration was not approved."}
          </p>

          {!isPending && rejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-left text-sm">
              <span className="text-red-600 font-bold block mb-1">
                Rejection Reason:
              </span>
              <p className="text-red-700">{rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPending
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPending ? "bg-amber-500 animate-pulse" : "bg-red-500"
              }`}
            />
            {isPending ? "Awaiting Admin Approval" : "Registration Rejected"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {isPending && (
            <button
              onClick={() => router.refresh()}
              className="btn bg-amber-500 hover:bg-amber-600 text-white border-none rounded-xl h-12 font-semibold transition-all"
            >
              Refresh Status
            </button>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn btn-outline border-base-300 text-base-content rounded-xl h-12"
          >
            Sign Out
          </button>
          {!isPending && (
            <a
              href="mailto:support@smartroadmap.dev"
              className="text-xs text-base-content/50 hover:text-base-content transition-colors"
            >
              Contact support →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
