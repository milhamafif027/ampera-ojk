"use client";

import React, { useRef, memo, useMemo } from "react";
import {
  Building2,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Variants } from "framer-motion";

interface LandingRoomsProps {
  rooms: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

function LandingRooms({ rooms, isLoading }: LandingRoomsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollRefRapat = useRef<HTMLDivElement>(null);

  const scroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.75;
      ref.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 1. Kelompokkan ruangan berdasarkan tipe / nama (Sama persis seperti RuanganPage)
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

  // Helper untuk merender kartu ruangan agar kodenya tidak duplikat
  const renderRoomCard = (room: any) => {
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
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80";

    return (
      <div
        key={room.id}
        className="group bg-slate-50/60 hover:bg-white border border-slate-200/90 hover:border-[#9f1521]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row lg:flex-col min-w-[300px] sm:min-w-[480px] lg:min-w-0 max-w-[520px] lg:max-w-none shrink-0 lg:shrink snap-start transform-gpu"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "auto 350px",
        }}
      >
        <div className="sm:w-2/5 lg:w-full h-48 sm:h-auto lg:h-48 relative overflow-hidden bg-slate-200 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={roomThumb}
            alt={room.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-md shadow-md uppercase tracking-wider">
              {room.type || "Rapat"}
            </span>
          </div>
        </div>

        <div className="sm:w-3/5 lg:w-full p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row lg:flex-col sm:justify-between sm:items-start lg:items-stretch gap-2">
              <h4
                className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-[#9f1521] transition-colors leading-snug truncate"
                title={room.name}
              >
                {room.name}
              </h4>
              <span className="px-3 py-1 bg-rose-50 text-[#9f1521] border border-rose-100 rounded-lg text-xs font-extrabold shrink-0 flex items-center gap-1 w-fit">
                <Users size={13} className="shrink-0" />{" "}
                {room.capacity || "Fleksibel"} Orang
              </span>
            </div>

            <div className="h-[45px] overflow-y-auto custom-scrollbar pr-1 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-2 leading-relaxed font-medium">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span>{room.description || "Fasilitas rapat standar OJK."}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="truncate">Gedung Kantor OJK Sumsel</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="fasilitas"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full space-y-12 sm:space-y-16 overflow-hidden"
    >
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Katalog Ruang Pertemuan & Rapat
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Pratinjau inventaris fasilitas ruang rapat dan ballroom modern yang
          terintegrasi langsung dengan database sistem reservasi.
        </p>
      </div>

      {/* ================= SECTION 1: RUANGAN PERTEMUAN / BALLROOM ================= */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 sm:pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Ruangan Pertemuan ({conferenceRooms.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ballroom utama dan ruang pertemuan berkapasitas besar.
              </p>
            </div>
          </div>

          {!isLoading && conferenceRooms.length > 0 && (
            <div className="hidden sm:flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll(scrollRef, "left")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Geser Kiri"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll(scrollRef, "right")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Geser Kanan"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-x-visible custom-scrollbar pb-4 lg:pb-0 snap-x lg:snap-none snap-mandatory"
          style={{ scrollbarWidth: "thin", contentVisibility: "auto" }}
        >
          {isLoading ? (
            [1, 2].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-slate-100 animate-pulse h-64 min-w-[300px] sm:min-w-[420px] lg:min-w-0 shrink-0"
              />
            ))
          ) : conferenceRooms.length > 0 ? (
            conferenceRooms.map(renderRoomCard)
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada data ruangan pertemuan.
            </div>
          )}
        </div>
      </div>

      {/* ================= SECTION 2: RUANGAN RAPAT ================= */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 sm:pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Ruangan Rapat ({meetingRooms.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ruang rapat koordinasi satker dan pimpinan.
              </p>
            </div>
          </div>

          {!isLoading && meetingRooms.length > 0 && (
            <div className="hidden sm:flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll(scrollRefRapat, "left")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Geser Kiri"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll(scrollRefRapat, "right")}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Geser Kanan"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollRefRapat}
          className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-x-visible custom-scrollbar pb-4 lg:pb-0 snap-x lg:snap-none snap-mandatory"
          style={{ scrollbarWidth: "thin", contentVisibility: "auto" }}
        >
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-slate-100 animate-pulse h-64 min-w-[300px] sm:min-w-[420px] lg:min-w-0 shrink-0"
              />
            ))
          ) : meetingRooms.length > 0 ? (
            meetingRooms.map(renderRoomCard)
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada data ruangan rapat.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(LandingRooms);
