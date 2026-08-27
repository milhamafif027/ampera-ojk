"use client";

import React, { useRef } from "react";
import {
  Building2,
  Users,
  Info,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.section
      id="fasilitas"
      variants={itemVariants}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full space-y-8 sm:space-y-12 overflow-hidden"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#9f1521] text-[10px] sm:text-xs font-extrabold tracking-wider shadow-sm">
          FASILITAS UNGGULAN KANTOR OJK SUMSEL
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Katalog Ruang Pertemuan & Rapat
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Pratinjau inventaris fasilitas ruang rapat dan ballroom modern yang
          terintegrasi langsung dengan database sistem reservasi.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 sm:pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#9f1521]/10 text-[#9f1521] flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Daftar Ruangan & Ballroom
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Informasi kapasitas dan fasilitas pendukung tiap ruangan.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold w-fit">
              <Database size={13} className="animate-pulse shrink-0" /> LIVE
              DATABASE SYNC
            </div>

            {/* Tombol Navigasi Geser Kiri / Kanan */}
            {!isLoading && rooms.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => scroll("left")}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Geser Kiri"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Geser Kanan"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wadah Scroll Horizontal */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "thin" }}
        >
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-slate-100 animate-pulse h-64 min-w-[300px] sm:min-w-[420px] shrink-0"
              />
            ))
          ) : rooms.length > 0 ? (
            rooms.map((room) => {
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

              return (
                <div
                  key={room.id}
                  className="group bg-slate-50/60 hover:bg-white border border-slate-200/90 hover:border-[#9f1521]/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row min-w-[300px] sm:min-w-[480px] max-w-[520px] shrink-0 snap-start"
                >
                  <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden bg-slate-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={roomThumb}
                      alt={room.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-md uppercase tracking-wider">
                        {room.type || "Rapat"}
                      </span>
                    </div>
                  </div>

                  <div className="sm:w-3/5 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <h4
                          className="font-black text-slate-900 text-base md:text-lg group-hover:text-[#9f1521] transition-colors leading-snug truncate"
                          title={room.name}
                        >
                          {room.name}
                        </h4>
                        <span className="px-3 py-1 bg-rose-50 text-[#9f1521] border border-rose-100 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-xs w-fit">
                          <Users size={13} className="shrink-0" />{" "}
                          {room.capacity || "Fleksibel"} Orang
                        </span>
                      </div>

                      <div className="h-[45px] overflow-y-auto custom-scrollbar pr-1 text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 flex items-start gap-2 leading-relaxed font-medium">
                        <Info
                          size={14}
                          className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <span>
                          {room.description || "Fasilitas rapat standar OJK."}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-500">
                      <span className="truncate">Gedung Kantor OJK Sumsel</span>
                      <span className="text-[#9f1521] group-hover:underline shrink-0">
                        Reservasi →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full py-16 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-3xl border border-slate-200">
              Belum ada data ruangan yang tersedia di database.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
