"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

const allBookletImages = [
  {
    id: 1,
    title: "Cover & Sambutan",
    image: "/Cetak-Booklet Wisata Palembang/1.png",
  },
  {
    id: 2,
    title: "Letak Geografis Sumsel",
    image: "/Cetak-Booklet Wisata Palembang/3.png",
  },
  {
    id: 3,
    title: "Pimpinan OJK Sumsel",
    image: "/Cetak-Booklet Wisata Palembang/4.png",
  },
  {
    id: 4,
    title: "Fakta & Sejarah Kantor",
    image: "/Cetak-Booklet Wisata Palembang/5.png",
  },
  {
    id: 5,
    title: "Gedung Green Building OJK",
    image: "/Cetak-Booklet Wisata Palembang/6.png",
  },
  {
    id: 6,
    title: "Work-Life Balance Area",
    image: "/Cetak-Booklet Wisata Palembang/7.png",
  },
  {
    id: 7,
    title: "Navigasi Wisata Palembang",
    image: "/Cetak-Booklet Wisata Palembang/8.png",
  },
  {
    id: 8,
    title: "Panduan Aktivitas & Destinasi",
    image: "/Cetak-Booklet Wisata Palembang/9.png",
  },
  {
    id: 9,
    title: "Alternatif Transportasi",
    image: "/Cetak-Booklet Wisata Palembang/10.png",
  },
  {
    id: 10,
    title: "Kuliner Pindang Legendaris",
    image: "/Cetak-Booklet Wisata Palembang/11.png",
  },
  {
    id: 11,
    title: "Peta & Rute Wisata",
    image: "/Cetak-Booklet Wisata Palembang/12.png",
  },
  {
    id: 12,
    title: "Tempat Wisata Sejarah",
    image: "/Cetak-Booklet Wisata Palembang/13.png",
  },
  {
    id: 13,
    title: "Jakabaring Sport City",
    image: "/Cetak-Booklet Wisata Palembang/14.png",
  },
  {
    id: 14,
    title: "Ampera & Punti Kayu",
    image: "/Cetak-Booklet Wisata Palembang/15.png",
  },
  {
    id: 15,
    title: "Wisata Modern & Kopi Lokal",
    image: "/Cetak-Booklet Wisata Palembang/16.png",
  },
  {
    id: 16,
    title: "Makan Durian & Duku",
    image: "/Cetak-Booklet Wisata Palembang/17.png",
  },
  {
    id: 17,
    title: "Kuliner & Oleh-Oleh Sekitar Kantor",
    image: "/Cetak-Booklet Wisata Palembang/18.png",
  },
  {
    id: 18,
    title: "Pempek Khas Palembang",
    image: "/Cetak-Booklet Wisata Palembang/19.png",
  },
  {
    id: 19,
    title: "Mie Celor & Martabak HAR",
    image: "/Cetak-Booklet Wisata Palembang/20.png",
  },
  {
    id: 20,
    title: "Oleh-Oleh Kopi & Songket",
    image: "/Cetak-Booklet Wisata Palembang/21.png",
  },
  {
    id: 21,
    title: "Akomodasi Hotel Pilihan",
    image: "/Cetak-Booklet Wisata Palembang/22.png",
  },
  {
    id: 22,
    title: "Kamus Bahaso Palembang",
    image: "/Cetak-Booklet Wisata Palembang/23.png",
  },
  {
    id: 23,
    title: "Terima Kasih",
    image: "/Cetak-Booklet Wisata Palembang/24.png",
  },
];

export default function SlidingCardsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    // Kecepatan diatur agar nyaman dipandang
    const scrollSpeed = 0.5;

    const autoScroll = () => {
      if (!isPaused && container) {
        container.scrollLeft += scrollSpeed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  // Fungsi untuk menggeser card slider manual via tombol panah luar
  const scrollManual = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.5;
      scrollRef.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const duplicatedCards = [...allBookletImages, ...allBookletImages];

  return (
    <section className="w-full py-16 sm:py-24 space-y-8 relative bg-white dark:bg-slate-950 overflow-hidden">
      {/* Header Section dengan Tipografi Premium */}
      <div className="px-6 max-w-7xl mx-auto flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#9f1521]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
            E-Booklet & Panduan
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Booklet Wisata & Profil OJK Sumsel
        </h2>
      </div>

      {/* Container utama slider dengan tombol panah melayang */}
      <div
        className="relative w-full group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Tombol Panah Navigasi Kiri Slider */}
        <button
          type="button"
          onClick={() => scrollManual("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
          title="Geser Kiri"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Tombol Panah Navigasi Kanan Slider */}
        <button
          type="button"
          onClick={() => scrollManual("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          title="Geser Kanan"
        >
          <ChevronRight size={20} />
        </button>

        {/* Gradient Overlay Kiri (Vignette) */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

        {/* Gradient Overlay Kanan (Vignette) */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-hidden py-4 px-16 sm:px-32 select-none cursor-pointer scroll-smooth transform-gpu will-change-scroll"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {duplicatedCards.map((item, index) => {
            const originalIndex = index % allBookletImages.length;
            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => setActiveModalIndex(originalIndex)}
                className="min-w-[180px] sm:min-w-[240px] h-[260px] sm:h-[340px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 relative shrink-0 group/card transform hover:-translate-y-2"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                />

                {/* Efek Hover Judul Halaman di dalam Card */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end p-5">
                  <span className="text-white font-bold text-sm leading-snug translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 drop-shadow-md">
                    {item.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POP-UP / ZOOM GAMBAR UTUH */}
      {activeModalIndex !== null && (
        <div
          onClick={() => setActiveModalIndex(null)}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup Modal */}
            <button
              onClick={() => setActiveModalIndex(null)}
              className="absolute -top-12 right-0 sm:-right-12 sm:-top-8 p-2 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer z-30 shadow-lg"
              type="button"
              title="Tutup"
            >
              <X size={24} />
            </button>

            {/* Area Gambar Preview Aktif */}
            <div className="relative w-full h-[75vh] sm:h-[80vh] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-transparent">
              <Image
                src={allBookletImages[activeModalIndex].image}
                alt={allBookletImages[activeModalIndex].title}
                fill
                className="object-contain"
                priority
              />

              {/* Caption Title Bar dalam Modal */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent text-center text-white pointer-events-none">
                <h3 className="font-bold text-sm sm:text-base tracking-wide">
                  {allBookletImages[activeModalIndex].title}
                </h3>
                <p className="text-[10px] sm:text-xs text-white/70 font-medium mt-1">
                  Halaman {activeModalIndex + 1} dari {allBookletImages.length}
                </p>
              </div>
            </div>

            {/* Tombol Navigasi Kiri */}
            <button
              type="button"
              onClick={() => {
                setActiveModalIndex((prev) =>
                  prev === 0
                    ? allBookletImages.length - 1
                    : prev !== null
                      ? prev - 1
                      : 0,
                );
              }}
              className="absolute left-2 sm:-left-16 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Tombol Navigasi Kanan */}
            <button
              type="button"
              onClick={() => {
                setActiveModalIndex((prev) =>
                  prev === allBookletImages.length - 1
                    ? 0
                    : prev !== null
                      ? prev + 1
                      : 0,
                );
              }}
              className="absolute right-2 sm:-right-16 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
              title="Halaman Berikutnya"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
