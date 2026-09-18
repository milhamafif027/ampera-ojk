"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Car, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Daftar path foto gedung OJK Sumsel untuk latar belakang fullscreen
const buildingImages = [
  "/gedungOjk/tampakDepan1.jpg",
  "/gedungOjk/tampakDepan2.jpeg",
  "/gedungOjk/tampakDepan3.jpeg",
  "/gedungOjk/tampakDepan4.jpeg",
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Timer Slideshow Gambar Latar Belakang (Transisi sangat lambat & halus)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % buildingImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden bg-slate-950">
      {/* 1. BACKGROUND IMAGE FULLSCREEN SLIDESHOW */}
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
            className="w-full h-full object-cover opacity-80"
          />
        </AnimatePresence>

        {/* Gradien Hitam dari Kiri ke Kanan untuk memastikan teks putih terbaca jelas */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />

        {/* Gradien Hitam dari Bawah agar menyatu natural dengan section berikutnya */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent opacity-100" />
      </div>

      {/* 2. NAVBAR (TRANSPARAN DI ATAS GAMBAR) */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="text-white font-black text-xl sm:text-2xl tracking-tight flex items-center gap-2">
          AMPERA<span className="text-[#9f1521] text-3xl leading-none">.</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-bold text-white/90">
          <Link
            href="#fasilitas"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Building2 size={16} /> Fasilitas Ruangan
          </Link>
          <Link
            href="#kendaraan"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Car size={16} /> Armada Kendaraan
          </Link>
          <Link
            href="/panduan"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={16} /> Panduan Sistem
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white transition-all shadow-sm"
          >
            Masuk Portal
          </Link>
        </nav>
      </header>

      {/* 3. MAIN HERO CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="max-w-3xl space-y-6 sm:space-y-8"
        >
          {/* Social Proof / Trust Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 w-fit px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 border-2 border-slate-900 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-700 shadow-sm">
                OJK
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-300 border-2 border-slate-900 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-700 shadow-sm">
                KR7
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#9f1521] border-2 border-slate-900 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white shadow-sm">
                SML
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-white/90">
              Digunakan oleh <strong>150+</strong> Pegawai OJK Sumsel
            </span>
          </div>

          {/* Heading Besar */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-black text-white tracking-tight leading-none">
              AMPERA
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-300 leading-snug">
              Manajemen Peminjaman Ruangan & Kendaraan
            </h2>
          </div>

          {/* Deskripsi */}
          <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl leading-relaxed font-medium">
            Platform terpadu Kantor OJK Provinsi Sumatera Selatan. Kelola
            reservasi fasilitas pertemuan dan armada operasional secara efisien,
            transparan, dan terstruktur.
          </p>

          {/* Call to Action Button */}
          <div className="pt-4 flex w-full sm:w-auto">
            <Link
              href="/panduan"
              className="inline-flex items-center justify-center gap-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white px-8 py-4 rounded-full text-sm sm:text-base font-bold transition-all shadow-xl shadow-rose-950/50 hover:shadow-rose-900/60 border border-rose-800/50 group w-full sm:w-auto"
            >
              <BookOpen
                size={18}
                className="group-hover:-translate-y-0.5 transition-transform duration-300"
              />
              Lihat Panduan Penggunaan
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 4. SCROLL DOWN INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none"
      >
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Scroll ke bawah
        </span>
        <div className="w-0.5 h-10 bg-slate-400/30 overflow-hidden relative rounded-full">
          <div className="w-full h-1/2 bg-slate-400 absolute top-0 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
