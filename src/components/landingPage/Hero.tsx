"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";

// Daftar path 4 foto tampak depan gedung OJK Sumsel
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

// Varianta untuk animasi elemen teks dari kiri
const textVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Varianta untuk animasi wadah gambar dari kanan
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

  // Efek timer otomatis dipercepat menjadi setiap 3 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % buildingImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="profil"
      className="relative bg-gradient-to-b from-white to-slate-100/70 border-b border-slate-200 py-20 lg:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Kolom Teks / Informasi (Animasi masuk dari kiri) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={textVariants}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#9f1521] text-[11px] font-extrabold tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> PLATFORM INTEGRASI PERKANTORAN
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
            AMPERA <br />
            <span className="text-[#9f1521]">
              Aplikasi Manajemen Peminjaman Ruangan & Kendaraan
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Selamat datang di portal informasi Kantor OJK Provinsi Sumatera
            Selatan. Gedung ini terdiri dari 8 lantai berkonsep{" "}
            <strong className="text-slate-800 font-bold">
              Green Building bersertifikasi Gold (GBCI)
            </strong>{" "}
            yang dilengkapi fasilitas pertemuan terpadu dan pengelolaan
            operasional modern.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-900/20"
              >
                Masuk Portal Pegawai <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/panduan"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold px-6 py-3.5 rounded-xl transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-slate-500" /> Panduan Sistem &
                SOP
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Kolom Visual / Slideshow 4 Foto Gedung (Animasi masuk dari kanan) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={imageVariants}
          className="relative"
        >
          <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
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

            {/* Overlay Gradient & Informasi Teks di Atas Gambar */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white z-10 pointer-events-none">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                {buildingImages[currentIndex].title}
              </span>
              <h3 className="text-xl font-bold mt-1">
                Jl. Jenderal Sudirman No. 1025, Kota Palembang
              </h3>
            </div>

            {/* Indikator Titik (Dots) Navigasi Slideshow */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
              {buildingImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
