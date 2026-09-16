"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";

// Daftar path foto gedung OJK Sumsel
const buildingImages = [
  {
    src: "/gedungOjk/tampakDepan1.jpg",
    title: "Tampak Depan Utama",
  },
  {
    src: "/gedungOjk/tampakDepan2.jpeg",
    title: "Sisi Eksterior Gedung",
  },
  {
    src: "/gedungOjk/tampakDepan3.jpeg",
    title: "Detail Arsitektur Green Building",
  },
  {
    src: "/gedungOjk/tampakDepan4.jpeg",
    title: "Area Lingkungan Kantor",
  },
];

// Animasi Teks (Dari Kiri)
const textVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Animasi Gambar (Dari Kanan)
const imageVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut", delay: 0.2 },
  },
};

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Timer Slideshow Gambar
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % buildingImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="profil"
      // Background Gradient Merah Putih Dominan Putih + Pattern Grid Halus
      className="relative bg-gradient-to-b from-rose-50/50 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Grid Pattern Tipis */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center z-10">
        {/* ================= BAGIAN KIRI: TEKS (CLEAN CORPORATE) ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={textVariants}
          className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start"
        >

          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
              AMPERA
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-[#9f1521] leading-snug">
              Manajemen Peminjaman Ruangan & Kendaraan
            </h2>
          </div>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-lg">
            Platform terpadu Kantor OJK Provinsi Sumatera Selatan. Kelola
            reservasi fasilitas pertemuan dan armada operasional secara efisien,
            transparan, dan terstruktur.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4 w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#9f1521] hover:bg-[#82111b] text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-900/20 group"
              >
                Masuk Portal Pegawai
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/panduan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-slate-500 shrink-0" /> Panduan
                & SOP
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ================= BAGIAN KANAN: GAMBAR DENGAN FLOATING WIDGETS ================= */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={imageVariants}
          className="relative w-full max-w-lg mx-auto lg:max-w-none mt-8 lg:mt-0"
        >
          {/* Main Image Container */}
          <div className="relative aspect-[4/3] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-slate-200/50 shadow-2xl bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <Image
                  src={buildingImages[currentIndex].src}
                  alt={buildingImages[currentIndex].title}
                  fill
                  priority
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Widget Koordinat (Kanan Atas) */}
            <div className="absolute top-4 sm:top-5 right-4 sm:right-5 z-20 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-lg hidden sm:block">
              <span className="text-[9px] font-mono font-medium text-white/90 tracking-widest">
                LAT: -2.9761, LONG: 104.7578
              </span>
            </div>

            {/* Gradient Overlay & Teks Gedung (Bawah) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-5 sm:p-8 z-10 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/80 tracking-widest uppercase">
                  ARSITEKTUR GREEN BUILDING OJK
                </span>
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-snug">
                Jl. Jenderal Sudirman No. 1025, Kota Palembang
              </h3>
              <p className="text-[10px] sm:text-[11px] text-white/70 mt-1 font-medium">
                Gedung 8 Lantai Ramah Lingkungan • Pusat Koordinasi Sektor
                Keuangan
              </p>
            </div>
          </div>

          {/* ================= FLOATING WIDGET 1: RUANGAN (Kiri Atas) ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="absolute -top-4 -left-4 sm:-top-6 sm:-left-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-4 z-30 w-56 sm:w-64"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <span className="text-[9px] font-black text-slate-500 tracking-wider">
                  LIVE OCCUPANCY
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Lt. 5
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Ruang Rapat Sriwijaya
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              Rapat Koordinasi Tim Pengawasan Perbankan Daerah
            </p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500">
                14:00 - 16:30 WIB
              </span>
              <span className="text-[10px] font-extrabold text-[#9f1521]">
                Berlangsung
              </span>
            </div>
          </motion.div>

          {/* ================= FLOATING WIDGET 2: KENDARAAN (Kanan Bawah) ================= */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-4 z-30 w-52 sm:w-60"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-slate-500 tracking-wider">
                  FLEET DISPATCH
                </span>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                EV 01
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Kendaraan Dinas Listrik
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
              Lobby Ground Floor
            </p>
            <div className="flex justify-between items-end mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-black text-slate-800">94%</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600">
                BATERAI SIAP
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
