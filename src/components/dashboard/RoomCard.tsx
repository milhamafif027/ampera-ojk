"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Clock, CheckCircle2, Edit3 } from "lucide-react";
import { Room } from "@/types";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

interface RoomCardProps {
  room: Room;
  isAdmin: boolean;
  user: LocalUser | null;
  getRoomLiveStatus: (name: string) => any;
  handleOpenBooking: (room: Room) => void;
  handleOpenEditModal: (room: any) => void;
  cardVariants: Variants;
}

export default function RoomCard({
  room,
  isAdmin,
  user,
  getRoomLiveStatus,
  handleOpenBooking,
  handleOpenEditModal,
  cardVariants,
}: RoomCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const liveStatus = getRoomLiveStatus(room.name);
  const roomDesc =
    (room as any).description || "Perlengkapan: Proyektor | Sound System";

  // Ambil gambar murni dari data room (disaring agar tidak ada nilai kosong)
  const roomImages: string[] =
    (room as any).imgs && Array.isArray((room as any).imgs)
      ? (room as any).imgs.filter(Boolean)
      : [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveImageIndex(index);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md max-w-sm w-full mx-auto"
    >
      <div>
        {/* Banner Galeri Foto Bisa Di-scroll Horizontal */}
        <div className="relative h-36 w-full bg-slate-950 group overflow-hidden">
          <div
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth custom-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {roomImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative h-full w-full flex-shrink-0 snap-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`${room.name} - ${idx + 1}`}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <h3 className="text-white font-black text-xs tracking-wide truncate">
                    {room.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 bg-slate-900/80 text-white rounded-full text-[10px] font-extrabold border border-white/20">
            {room.capacity}
          </span>

          {/* Indikator Titik Slider (Dots) hanya muncul jika foto lebih dari 1 */}
          {roomImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              {roomImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIndex === idx
                      ? "w-3 bg-white"
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Informasi Isi Card */}
        <div className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border flex items-center gap-1 ${
                liveStatus.isUsed
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}
            >
              {liveStatus.isUsed ? (
                <Clock size={11} />
              ) : (
                <CheckCircle2 size={11} />
              )}
              {liveStatus.isUsed ? "TERPAKAI" : "TERSEDIA"}
            </span>

            {isAdmin && (
              <button
                onClick={() => handleOpenEditModal(room)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={11} /> Edit
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-snug">
            {roomDesc}
          </p>

          {liveStatus.isUsed && liveStatus.agenda && (
            <div className="p-2 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-0.5">
              <p className="text-[9px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                Sedang Berlangsung:
              </p>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                {liveStatus.agenda.title}
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                {liveStatus.agenda.time}{" "}
                {user?.role !== "eksternal" && `• ${liveStatus.agenda.pic}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Reservasi Bawah */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => handleOpenBooking(room)}
          className="w-full py-2 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
        >
          Reservasi Ruangan
        </button>
      </div>
    </motion.div>
  );
}
