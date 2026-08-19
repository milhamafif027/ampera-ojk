"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Pencil, Info, Users } from "lucide-react";
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
  cardVariants?: Variants;
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
    (room as any).description || "Perlengkapan: Proyektor | Sound System | AC";
  const roomType = (room as any).type || "rapat";

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

  const cardContent = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md w-full">
      <div>
        {/* Banner Galeri Foto Bisa Di-scroll Horizontal */}
        <div className="relative h-40 w-full bg-slate-950 group overflow-hidden">
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
                  width={600}
                  height={160}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            {liveStatus.isUsed ? (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-md">
                Sedang Digunakan
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-md">
                Tersedia
              </span>
            )}
          </div>

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
        <div className="p-5 flex flex-col space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {room.name}
            </h3>

            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEditModal(room)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Edit Ruangan"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Users size={13} className="text-[#9f1521]" /> Kapasitas:{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {room.capacity}
            </strong>
          </p>

          {/* Kotak Deskripsi dengan Tinggi Tetap & Area Scroll Internal */}
          <div className="h-[45px] overflow-y-auto custom-scrollbar pr-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-1.5 leading-relaxed">
            <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
            <span>{roomDesc}</span>
          </div>
        </div>
      </div>

      {/* Tombol Reservasi Bawah */}
      <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 mt-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {roomType === "pertemuan" ? "Ruang Pertemuan" : "Ruang Rapat"}
        </span>
        <button
          onClick={() => handleOpenBooking(room)}
          className="px-3 py-1.5 bg-[#9f1521]/10 hover:bg-[#9f1521] text-[#9f1521] hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Pesan Ruangan
        </button>
      </div>
    </div>
  );

  if (cardVariants) {
    return <motion.div variants={cardVariants}>{cardContent}</motion.div>;
  }

  return cardContent;
}
