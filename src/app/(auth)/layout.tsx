"use client";

import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#9f1521]/30">
      {/* Container utama untuk children (Login & Panduan) */}
      <div className="w-full min-h-screen animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}
