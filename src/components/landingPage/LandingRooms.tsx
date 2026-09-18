"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  Building2,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Variants, motion, AnimatePresence } from "framer-motion";

interface LandingRoomsProps {
  rooms: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

/* =========================================================
   KOMPONEN INTERNAL KARTU RUANGAN (DENGAN LAZY HOVER RENDER)
========================================================= */
const RoomGridCard = ({
  room,
  isFeatured,
  onEnlarge,
}: {
  room: any;
  isFeatured: boolean;
  onEnlarge: (imgs: string[], index: number, roomName: string) => void;
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  // State untuk melacak apakah kartu sedang di-hover atau pernah di-hover
  const [hasHovered, setHasHovered] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

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

  // Menentukan gambar mana saja yang boleh dirender.
  // Jika belum di-hover, render HANYA gambar indeks 0.
  // Jika sudah di-hover, render semua gambar.
  const imagesToRender = hasHovered ? roomImages : [roomImages[0]];

  // Membersihkan Bug "Orang Orang"
  let displayCapacity = room.capacity ? String(room.capacity).trim() : "50";
  if (
    room.name.toLowerCase().includes("sriwidjaya") &&
    !displayCapacity.includes("-")
  ) {
    displayCapacity = "80 - 500";
  }
  displayCapacity = displayCapacity.replace(/orang/gi, "").trim() + " Orang";

  // Logika Scroll / Swipe Gambar Internal
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      if (index !== activeIdx) setActiveIdx(index);
    }
  };

  const scrollToImg = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: "smooth" });
    }
    setActiveIdx(index);
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
      className={`relative overflow-hidden rounded-2xl bg-slate-900 group shadow-md hover:shadow-xl transition-shadow cursor-pointer transform-gpu ${
        isFeatured
          ? "md:col-span-2 md:row-span-2 h-[260px] md:h-full" // Kartu Besar
          : "col-span-1 row-span-1 h-[240px] md:h-full" // Kartu Kecil
      }`}
      onClick={() => onEnlarge(roomImages, activeIdx, room.name)}
      onMouseEnter={() => setHasHovered(true)} // Memicu render sisa gambar saat hover
      onTouchStart={() => setHasHovered(true)} // Memicu render di layar sentuh
    >
      {/* Slider Gambar */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scroll-smooth transform-gpu"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {imagesToRender.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative w-full h-full shrink-0 snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgError ? defaultImage : imgUrl}
              alt={`${room.name} - ${idx + 1}`}
              loading={idx === 0 ? "lazy" : "eager"} // Gambar 1 lazy bawaan browser, sisanya eager karena baru dipanggil saat hover
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Overlay Gradient ala MUI */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Tombol Swipe Internal (Muncul saat di-hover dan sudah diload) */}
      {hasHovered && roomImages.length > 1 && (
        <>
          <button
            onClick={prevImg}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextImg}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronRight size={18} />
          </button>

          {/* Titik Indikator Gambar */}
          <div className="absolute top-3 right-3 z-10 flex gap-1 pointer-events-none">
            {roomImages.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  activeIdx === i ? "w-2.5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Teks Bawah (Titlebar) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex justify-between items-end z-20 pointer-events-none">
        <div className="text-white min-w-0 pr-2">
          <h4
            className={`font-bold drop-shadow-md truncate ${
              isFeatured ? "text-lg sm:text-2xl" : "text-sm sm:text-base"
            }`}
          >
            {room.name}
          </h4>
          <span
            className={`flex items-center gap-1.5 text-white/80 drop-shadow-md mt-1 font-medium ${
              isFeatured ? "text-xs sm:text-sm" : "text-[11px]"
            }`}
          >
            <Users size={isFeatured ? 15 : 12} /> {displayCapacity}
          </span>
        </div>
        <button
          className="text-white/60 hover:text-white pointer-events-auto p-1.5 shrink-0 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge(roomImages, activeIdx, room.name);
          }}
          title="Lihat Detail & Perbesar"
        >
          <Info size={isFeatured ? 26 : 20} />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   KOMPONEN UTAMA LANDING ROOMS
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

      {/* ================= SECTION 1: RUANGAN PERTEMUAN ================= */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[240px]">
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`rounded-2xl bg-slate-100 animate-pulse ${
                  n === 1
                    ? "md:col-span-2 md:row-span-2 h-[260px] md:h-full"
                    : "col-span-1 h-[240px] md:h-full"
                }`}
              />
            ))
          ) : conferenceRooms.length > 0 ? (
            conferenceRooms.map((room: any, idx: number) => (
              <RoomGridCard
                key={room.id}
                room={room}
                isFeatured={idx === 0}
                onEnlarge={handleEnlarge}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[240px]">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`rounded-2xl bg-slate-100 animate-pulse ${
                  n === 1
                    ? "md:col-span-2 md:row-span-2 h-[260px] md:h-full"
                    : "col-span-1 h-[240px] md:h-full"
                }`}
              />
            ))
          ) : meetingRooms.length > 0 ? (
            meetingRooms.map((room: any, idx: number) => (
              <RoomGridCard
                key={room.id}
                room={room}
                isFeatured={idx === 0}
                onEnlarge={handleEnlarge}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium italic">
              Tidak ada data ruangan rapat.
            </div>
          )}
        </div>
      </motion.div>

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
              <span className="absolute -top-10 left-0 text-white font-bold tracking-wide">
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
                    className="absolute left-2 sm:-left-12 p-3 sm:p-4 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors shadow-lg"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={nextLightbox}
                    className="absolute right-2 sm:-right-12 p-3 sm:p-4 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors shadow-lg"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}

              <button
                onClick={() => setLightbox({ ...lightbox, isOpen: false })}
                className="absolute top-2 right-2 sm:-top-10 sm:-right-6 p-2 text-white/60 hover:text-white transition-colors"
                title="Tutup"
              >
                <X size={28} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
