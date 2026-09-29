"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  Building2,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from "lucide-react";
import { Variants, motion, AnimatePresence } from "framer-motion";

interface LandingRoomsProps {
  rooms: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

/* =========================================================
   KOMPONEN KARTU RUANGAN (DISAMAKAN DENGAN STYLE PARTNER CARD)
========================================================= */
const RoomCard = ({
  room,
  index,
  onEnlarge,
}: {
  room: any;
  index: number;
  onEnlarge: (imgs: string[], index: number, roomName: string) => void;
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Kartu pertama pada kategori pertemuan/ballroom dibuat besar menonjol (Featured)
  const isFeatured = index === 0;

  // Parse Images
  const defaultImage =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
  let roomImages: string[] = [defaultImage];
  try {
    if (room.imgs) {
      const parsed =
        typeof room.imgs === "string" ? JSON.parse(room.imgs) : room.imgs;
      if (Array.isArray(parsed) && parsed.length > 0) {
        roomImages = parsed.filter(Boolean);
      }
    }
  } catch {
    roomImages = [defaultImage];
  }

  // Format Kapasitas
  let displayCapacity = room.capacity ? String(room.capacity).trim() : "50";
  if (
    room.name.toLowerCase().includes("sriwidjaya") &&
    !displayCapacity.includes("-")
  ) {
    displayCapacity = "80 - 500";
  }
  displayCapacity = displayCapacity.replace(/orang/gi, "").trim() + " Orang";

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      if (idx !== activeIdx) setActiveIdx(idx);
    }
  };

  const scrollToImg = (targetIdx: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * targetIdx,
        behavior: "smooth",
      });
    }
    setActiveIdx(targetIdx);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = activeIdx === roomImages.length - 1 ? 0 : activeIdx + 1;
    scrollToImg(newIdx);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = activeIdx === 0 ? roomImages.length - 1 : activeIdx - 1;
    scrollToImg(newIdx);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-950 group shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer transform-gpu shrink-0 w-[280px] sm:w-auto border border-slate-200/40 dark:border-slate-800 ${
        isFeatured
          ? "sm:md:col-span-2 sm:md:row-span-2 h-[320px] sm:md:h-[620px]" // Kartu Utama Besar Utama
          : "col-span-1 h-[320px]" // Kartu Standar
      }`}
      onClick={() => onEnlarge(roomImages, activeIdx, room.name)}
    >
      {/* Slider Gambar (Full Cover & Smooth Zoom) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {roomImages.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative w-full h-full shrink-0 snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgError ? defaultImage : imgUrl}
              alt={`${room.name} - ${idx + 1}`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        ))}
      </div>

      {/* Overlay Gradien Gelap Elegan dari Bawah */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Badge Kapasitas di Pojok Kanan Atas */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-md">
        <Users size={13} className="text-rose-400" />
        <span>{displayCapacity}</span>
      </div>

      {/* Tombol Navigasi Slider Internal (Jika gambar lebih dari 1) */}
      {roomImages.length > 1 && (
        <>
          <button
            onClick={prevImg}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextImg}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
          >
            <ChevronRight size={16} />
          </button>

          {/* Titik Indikator Slider */}
          <div className="absolute top-4 left-4 z-20 flex gap-1.5 pointer-events-none">
            {roomImages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  activeIdx === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Konten Titlebar Overlay di Bagian Bawah */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex items-end justify-between z-20 pointer-events-none">
        <div className="flex flex-col text-white min-w-0 pr-4 space-y-1">
          <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest block drop-shadow-sm">
            Fasilitas Ruangan OJK
          </span>
          <h4
            className={`font-black leading-tight truncate drop-shadow-md text-white ${
              isFeatured ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
            }`}
          >
            {room.name}
          </h4>
          <span
            className={`text-white/80 flex items-center gap-1.5 drop-shadow-md font-medium truncate ${
              isFeatured ? "text-sm" : "text-[11px]"
            }`}
          >
            <Building2
              size={isFeatured ? 16 : 13}
              className="shrink-0 text-slate-300"
            />
            {room.type ? `Kategori: ${room.type}` : "Ruangan Rapat & Pertemuan"}
          </span>
        </div>

        {/* Tombol Perbesar Detail */}
        <button
          className="text-white/70 hover:text-white p-2 bg-white/10 hover:bg-[#9f1521] rounded-xl backdrop-blur-md transition-all duration-300 shrink-0 pointer-events-auto shadow-lg border border-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge(roomImages, activeIdx, room.name);
          }}
          title="Perbesar & Lihat Detail"
        >
          <Info size={isFeatured ? 26 : 20} />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   KOMPONEN UTAMA LANDING ROOMS (RESPONSIF & SMOOTH)
========================================================= */
export default function LandingRooms({
  rooms,
  isLoading,
  itemVariants,
}: LandingRoomsProps) {
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
    title: string;
  }>({ isOpen: false, images: [], index: 0, title: "" });

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

  const handleEnlarge = (imgs: string[], idx: number, title: string) => {
    setLightbox({ isOpen: true, images: imgs, index: idx, title });
  };

  const nextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox((p) => ({
      ...p,
      index: p.index === p.images.length - 1 ? 0 : p.index + 1,
    }));
  };

  const prevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox((p) => ({
      ...p,
      index: p.index === 0 ? p.images.length - 1 : p.index - 1,
    }));
  };

  return (
    <motion.section
      id="fasilitas"
      variants={itemVariants}
      className="bg-white border-y border-slate-200 py-16 sm:py-24 overflow-hidden"
    >
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(159, 21, 33, 0.25);
          border-radius: 10px;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#9f1521] uppercase tracking-widest">
            Katalog Fasilitas Utama
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Ruang Pertemuan & Rapat Modern
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
            Pratinjau inventaris fasilitas ruang rapat dan ballroom yang
            terintegrasi langsung dengan database sistem reservasi OJK Sumsel.
          </p>
        </div>

        {/* ================= SECTION 1: RUANGAN PERTEMUAN ================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#9f1521] flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Ruangan Pertemuan & Ballroom
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ballroom utama dan ruang pertemuan berkapasitas besar.
              </p>
            </div>
          </div>

          {/* MOBILE: HORIZONTAL SCROLL | DESKTOP: GRID */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-x-visible custom-scrollbar pb-4 sm:pb-0 snap-x sm:snap-none">
            {isLoading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`rounded-2xl bg-slate-200 animate-pulse shrink-0 w-[280px] sm:w-auto ${
                    n === 1
                      ? "sm:md:col-span-2 sm:md:row-span-2 h-[320px] sm:md:h-[620px]"
                      : "col-span-1 h-[320px]"
                  }`}
                />
              ))
            ) : conferenceRooms.length > 0 ? (
              conferenceRooms.map((room: any, index: number) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={index}
                  onEnlarge={handleEnlarge}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
                Tidak ada data ruangan pertemuan.
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 2: RUANGAN RAPAT ================= */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Ruangan Rapat Koordinasi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ruang rapat satker dan pimpinan berkapasitas standar.
              </p>
            </div>
          </div>

          {/* MOBILE: HORIZONTAL SCROLL | DESKTOP: GRID */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-x-visible custom-scrollbar pb-4 sm:pb-0 snap-x sm:snap-none">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`rounded-2xl bg-slate-200 animate-pulse shrink-0 w-[280px] sm:w-auto ${
                    n === 1
                      ? "sm:md:col-span-2 sm:md:row-span-2 h-[320px] sm:md:h-[620px]"
                      : "col-span-1 h-[320px]"
                  }`}
                />
              ))
            ) : meetingRooms.length > 0 ? (
              meetingRooms.map((room: any, index: number) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={index}
                  onEnlarge={handleEnlarge}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-slate-200">
                Tidak ada data ruangan rapat.
              </div>
            )}
          </div>
        </div>

        {/* ================= MODAL LIGHTBOX / ZOOM ================= */}
        <AnimatePresence>
          {lightbox.isOpen && (
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setLightbox({ ...lightbox, isOpen: false })}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center transform-gpu"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="absolute -top-10 left-0 text-white font-bold tracking-wide text-xs sm:text-sm">
                  {lightbox.title} ({lightbox.index + 1} /{" "}
                  {lightbox.images.length})
                </span>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightbox.images[lightbox.index]}
                  alt="Enlarged Room"
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
                />

                {lightbox.images.length > 1 && (
                  <>
                    <button
                      onClick={prevLightbox}
                      className="absolute left-2 sm:-left-12 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors shadow-lg cursor-pointer"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextLightbox}
                      className="absolute right-2 sm:-right-12 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors shadow-lg cursor-pointer"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setLightbox({ ...lightbox, isOpen: false })}
                  className="absolute top-2 right-2 sm:-top-10 sm:-right-6 p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X size={24} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
