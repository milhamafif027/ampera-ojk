"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const buildingImages = [
  "/gedungOjk/tampakDepan1.jpg",
  "/gedungOjk/tampakDepan2.jpeg",
  "/gedungOjk/tampakDepan3.jpeg",
  "/gedungOjk/tampakDepan4.jpeg",
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % buildingImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden bg-slate-950">
      {/* 1. BACKGROUND IMAGE FULLSCREEN SLIDESHOW TANPA GRADASI BAWAH */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={buildingImages[currentIndex]}
            alt="Latar Belakang Gedung OJK Sumsel"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-full h-full object-cover opacity-85"
          />
        </AnimatePresence>

        {/* Gradien Gelap dari Sisi Kiri agar teks putih selalu tajam terbaca */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

        {/* Gradien bawah dihapus sepenuhnya */}
      </div>

      {/* 2. MAIN HERO CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="max-w-2xl space-y-5 sm:space-y-6"
        >
          {/* Social Proof / Trust Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 w-fit px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-300 border-2 border-slate-900 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-slate-700 shadow-sm">
                OJK
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-300 border-2 border-slate-900 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-slate-700 shadow-sm">
                KR7
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#9f1521] border-2 border-slate-900 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-white shadow-sm">
                SML
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-white/90">
              Digunakan oleh <strong>150+</strong> Pegawai OJK Sumsel
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] font-black text-white tracking-tight leading-none">
              AMPERA
            </h1>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-rose-300 leading-snug">
              Manajemen Peminjaman Ruangan & Kendaraan
            </h2>
          </div>

          {/* Deskripsi */}
          <p className="text-xs sm:text-sm md:text-base text-white/80 max-w-xl leading-relaxed font-medium">
            Platform terpadu Kantor OJK Provinsi Sumatera Selatan. Kelola
            reservasi fasilitas pertemuan dan armada operasional secara efisien,
            transparan, dan terstruktur.
          </p>

          {/* Call to Action Button */}
          <div className="pt-2 flex w-full sm:w-auto">
            <Link
              href="/panduan"
              className="inline-flex items-center justify-center gap-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white px-7 py-3.5 sm:px-8 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xl shadow-rose-950/50 hover:shadow-rose-900/60 border border-rose-800/50 group w-full sm:w-auto"
            >
              <BookOpen
                size={16}
                className="group-hover:-translate-y-0.5 transition-transform duration-300"
              />
              Lihat Panduan Penggunaan
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3. SCROLL DOWN INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none"
      >
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          Scroll ke bawah
        </span>
        <div className="w-0.5 h-6 sm:h-8 bg-white/30 overflow-hidden relative rounded-full">
          <div className="w-full h-1/2 bg-white absolute top-0 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
