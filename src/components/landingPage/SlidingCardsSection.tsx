"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

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
  const [activeImage, setActiveImage] = useState<string | null>(null);

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

  const duplicatedCards = [...allBookletImages, ...allBookletImages];

  return (
    <div className="w-full py-6 space-y-4 relative">
      <div className="px-4 max-w-7xl mx-auto">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
          Booklet Wisata & Profil OJK Sumsel
        </h2>
      </div>

      {/* Container utama dengan efek gradasi halus (fade-out) di sisi kiri dan kanan */}
      <div className="relative w-full overflow-hidden">
        {/* Gradient Overlay Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none" />

        {/* Gradient Overlay Kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-hidden py-3 px-4 select-none cursor-pointer scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {duplicatedCards.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => setActiveImage(item.image)}
              className="min-w-[180px] sm:min-w-[220px] h-[260px] sm:h-[300px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative shrink-0 group transform hover:-translate-y-1"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL POP-UP GAMBAR UTUH SAAT DIKLIK */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
              <Image
                src={activeImage}
                alt="Booklet Preview"
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
