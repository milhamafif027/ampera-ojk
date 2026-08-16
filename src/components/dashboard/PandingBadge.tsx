"use client";

import React from "react";
import { StatusPengajuan } from "@/types";

interface PandingBadgeProps {
  status: StatusPengajuan | string;
}

export default function PandingBadge({ status }: PandingBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "Disetujui":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
      case "Sedang Berlangsung":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50";
      case "Pending":
      case "Menunggu":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
      case "Ditolak":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50";
      case "Selesai":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] border inline-flex items-center justify-center shrink-0 ${getBadgeStyle()}`}
    >
      {status || "Selesai"}
    </span>
  );
}
