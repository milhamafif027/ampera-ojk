"use client";

import React, { useMemo } from "react";
import { Building2, Users, Info } from "lucide-react";
import { Variants, motion } from "framer-motion";

interface LandingRoomsProps {
  rooms: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

export default function LandingRooms({
  rooms,
  isLoading,
  itemVariants,
}: LandingRoomsProps) {
  // 1. Kelompokkan ruangan berdasarkan tipe / nama
  const conferenceRooms = useMemo(() => {
    return rooms.filter(
      (r: any) =>
        r.type === "pertemuan" ||
        r.type === "auditorium" ||
        r.name.toLowerCase() === "komunal" ||
        r.name.toLowerCase().includes("ballroom") ||
        r.name.toLowerCase().includes("auditorium"),
    );
  }, [rooms]);

  const meetingRooms = useMemo(() => {
    return rooms.filter((r: any) => !conferenceRooms.includes(r));
  }, [rooms, conferenceRooms]);

  // 2. Helper untuk merender kartu ruangan (MUI Titlebar ImageListItem Style)
  const renderMuiStyleCard = (room: any, index: number) => {
    let parsedImgs = [];
    try {
      parsedImgs = room.imgs
        ? typeof room.imgs === "string"
          ? JSON.parse(room.imgs)
          : room.imgs
        : [];
    } catch {
      parsedImgs = [];
    }
    const roomThumb =
      parsedImgs[0] ||
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";

    // Efek Featured (Quilted Masonry): Item pertama dibuat lebih besar meniru MUI rows=2 cols=2
    const isFeatured = index === 0;

    return (
      <motion.div
        variants={itemVariants}
        key={room.id}
        className={`relative overflow-hidden group rounded-xl bg-slate-900 shadow-md hover:shadow-xl transition-all cursor-pointer transform-gpu ${
          isFeatured
            ? "md:col-span-2 md:row-span-2 h-[300px] md:h-[620px]" // Featured besar
            : "col-span-1 h-[300px]" // Item standar
        }`}
      >
        {/* Gambar Full Cover */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={roomThumb}
          alt={room.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Mui ImageListItemBar (Overlay Gradien Hitam dari bawah ke atas) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Konten Title & Subtitle di atas Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between z-10">
          <div className="flex flex-col text-white min-w-0 pr-4">
            <h4
              className={`font-bold leading-tight truncate drop-shadow-md ${
                isFeatured ? "text-lg sm:text-2xl" : "text-sm sm:text-base"
              }`}
            >
              {room.name}
            </h4>
            <span
              className={`text-white/80 flex items-center gap-1.5 drop-shadow-md mt-1 font-medium ${
                isFeatured ? "text-xs sm:text-sm" : "text-[11px]"
              }`}
            >
              <Users size={isFeatured ? 16 : 12} />{" "}
              {room.capacity || "Fleksibel"} Orang
            </span>
          </div>

          {/* Action Icon (InfoIcon) */}
          <button
            className="text-white/50 hover:text-white p-1.5 transition-colors shrink-0 cursor-pointer"
            title={room.description || "Fasilitas lengkap OJK"}
          >
            <Info size={isFeatured ? 28 : 22} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <section
      id="fasilitas"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full space-y-12 sm:space-y-16"
    >
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="text-center max-w-2xl mx-auto space-y-3"
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Katalog Ruang Pertemuan & Rapat
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Pratinjau inventaris fasilitas ruang rapat dan ballroom modern yang
          terintegrasi langsung dengan database sistem reservasi.
        </p>
      </motion.div>

      {/* ================= SECTION 1: RUANGAN PERTEMUAN / BALLROOM ================= */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Ruangan Pertemuan
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ballroom utama dan ruang pertemuan berkapasitas besar.
            </p>
          </div>
        </div>

        {/* GRID LAYOUT ALA MUI IMAGE LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[300px]">
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`rounded-xl bg-slate-100 animate-pulse ${
                  n === 1
                    ? "md:col-span-2 md:row-span-2 h-[300px] md:h-[620px]"
                    : "col-span-1 h-[300px]"
                }`}
              />
            ))
          ) : conferenceRooms.length > 0 ? (
            conferenceRooms.map((room: any, index: number) =>
              renderMuiStyleCard(room, index),
            )
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada data ruangan pertemuan.
            </div>
          )}
        </div>
      </motion.div>

      {/* ================= SECTION 2: RUANGAN RAPAT ================= */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Ruangan Rapat
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ruang rapat koordinasi satker dan pimpinan.
            </p>
          </div>
        </div>

        {/* GRID LAYOUT ALA MUI IMAGE LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[300px]">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className={`rounded-xl bg-slate-100 animate-pulse ${
                  n === 1
                    ? "md:col-span-2 md:row-span-2 h-[300px] md:h-[620px]"
                    : "col-span-1 h-[300px]"
                }`}
              />
            ))
          ) : meetingRooms.length > 0 ? (
            meetingRooms.map((room: any, index: number) =>
              renderMuiStyleCard(room, index),
            )
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada data ruangan rapat.
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
