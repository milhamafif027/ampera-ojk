"use client";

import React from "react";
import { Clock, MapPin, Users } from "lucide-react";

// Interface disesuaikan dengan kolom database MySQL ampera_db
export interface Agenda {
  id: number | string;
  title: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  time?: string; // Fallback untuk format lama
  room_name?: string;
  room?: string; // Fallback untuk format lama
  pic?: string;
  status?: string;
}

interface AgendaCardProps {
  agenda: Agenda;
  variant?: "live" | "upcoming";
}

export default function AgendaCard({
  agenda,
  variant = "upcoming",
}: AgendaCardProps) {
  // Format tampilan jam (misal "09:00 - 12:00")
  const displayTime =
    agenda.time ||
    (agenda.start_time && agenda.end_time
      ? `${agenda.start_time.slice(0, 5)} - ${agenda.end_time.slice(0, 5)} WIB`
      : "Sesuai Jadwal");

  // Nama ruangan dari MySQL JOIN atau properti fallback
  const displayRoom = agenda.room_name || agenda.room || "Ruang Rapat OJK";

  if (variant === "live") {
    return (
      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {agenda.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-emerald-600 shrink-0" />{" "}
            {displayTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-emerald-600 shrink-0" />{" "}
            {displayRoom}
          </span>
          {agenda.pic && (
            <span className="flex items-center gap-1">
              <Users size={14} className="text-emerald-600 shrink-0" />{" "}
              {agenda.pic}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl space-y-2">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {agenda.title}
        </h3>
        {agenda.date && (
          <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
            {agenda.date}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Clock size={14} className="text-[#9f1521] shrink-0" /> {displayTime}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} className="text-[#9f1521] shrink-0" /> {displayRoom}
        </span>
      </div>
    </div>
  );
}
