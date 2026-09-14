"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="w-full py-6 space-y-4 relative">
      <div className="px-4 max-w-7xl mx-auto flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
          Booklet Wisata & Profil OJK Sumsel
        </h2>
      </div>

      {/* Container utama slider dengan tombol panah melayang di sisi kiri dan kanan */}
      <div
        className="relative w-full overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Tombol Panah Navigasi Kiri Slider */}
        <button
          type="button"
          onClick={() => scrollManual("left")}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Geser Kiri"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Tombol Panah Navigasi Kanan Slider */}
        <button
          type="button"
          onClick={() => scrollManual("right")}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Geser Kanan"
        >
          <ChevronRight size={20} />
        </button>

        {/* Gradient Overlay Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none" />

        {/* Gradient Overlay Kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden py-3 px-12 select-none cursor-pointer scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {duplicatedCards.map((item, index) => {
            // Gunakan modulo index agar pas dengan array asli untuk modal popup
            const originalIndex = index % allBookletImages.length;
            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => setActiveModalIndex(originalIndex)}
                className="min-w-[180px] sm:min-w-[220px] h-[260px] sm:h-[300px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative shrink-0 group/card transform hover:-translate-y-1"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POP-UP / ZOOM GAMBAR UTUH DENGAN TOMBOL PREV & NEXT */}
      {activeModalIndex !== null && (
        <div
          onClick={() => setActiveModalIndex(null)}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup Modal */}
            <button
              onClick={() => setActiveModalIndex(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer z-30"
              type="button"
              title="Tutup"
            >
              <X size={24} />
            </button>

            {/* Tombol Navigasi Kiri di dalam Modal */}
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
              className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer shadow-lg"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Tombol Navigasi Kanan di dalam Modal */}
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
              className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer shadow-lg"
              title="Halaman Berikutnya"
            >
              <ChevronRight size={24} />
            </button>

            {/* Area Gambar Preview Aktif */}
            <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
              <Image
                src={allBookletImages[activeModalIndex].image}
                alt={allBookletImages[activeModalIndex].title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
