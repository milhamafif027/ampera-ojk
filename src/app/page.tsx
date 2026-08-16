"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/landingPage/Navbar";
import Hero from "@/components/landingPage/Hero";
import QuickHelp from "@/components/landingPage/QuickHelp";
import {
  Building2,
  Star,
  AlertCircle,
  Users,
  Info,
  Sparkles,
  Database,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

// Varianta untuk animasi kontainer (stagger efek berurutan)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Varianta untuk elemen anak
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function LandingPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPublicData = async () => {
      try {
        setHasError(false);

        const resRooms = await fetch("/api/public/rooms");
        const resultRooms = await resRooms.json();

        const resPartners = await fetch("/api/partners");
        const resultPartners = await resPartners.json();

        if (isMounted) {
          if (resRooms.ok && resultRooms.data) {
            setRooms(resultRooms.data);
          }
          if (resPartners.ok && resultPartners.data) {
            setPartners(resultPartners.data);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data publik database:", error);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden">
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <Hero />

      {/* 3. FASILITAS & KATALOG RUANGAN UTAMA (FULL WIDTH & BESAR) */}
      <motion.section
        id="fasilitas"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 py-24 w-full space-y-12"
      >
        <motion.div
          variants={itemVariants}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#9f1521] text-xs font-extrabold tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> FASILITAS UNGGULAN Kantor OJK
            SUMSEL
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Katalog Ruang Pertemuan & Rapat
          </h2>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
            Pratinjau inventaris fasilitas ruang rapat dan ballroom modern yang
            terintegrasi langsung dengan database sistem reservasi.
          </p>
        </motion.div>

        {hasError && (
          <motion.div
            variants={itemVariants}
            className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Gagal memuat sebagian data live database.</span>
            </div>
          </motion.div>
        )}

        {/* KONTAINER UTAMA LEBAR & BESAR */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100 p-8 md:p-12 space-y-8"
        >
          {/* SUB-HEADER KONTAINER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#9f1521]/10 text-[#9f1521] flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Daftar Ruangan & Ballroom
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Informasi kapasitas dan fasilitas pendukung tiap ruangan.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold w-fit">
              <Database size={13} className="animate-pulse" /> LIVE DATABASE
              SYNC
            </div>
          </div>

          {/* GRID RUANGAN DIPERBESAR (2 KOLOM LUAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl bg-slate-100 animate-pulse h-56"
                />
              ))
            ) : rooms.length > 0 ? (
              rooms.map((room) => {
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
                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";

                return (
                  <motion.div
                    whileHover={{ scale: 1.01, y: -4 }}
                    key={room.id}
                    className="group bg-slate-50/60 hover:bg-white border border-slate-200/90 hover:border-[#9f1521]/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row"
                  >
                    {/* FOTO RUANGAN LEBIH BESAR */}
                    <div className="sm:w-2/5 h-56 sm:h-auto relative overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={roomThumb}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-md uppercase tracking-wider">
                          {room.type || "Rapat"}
                        </span>
                      </div>
                    </div>

                    {/* KONTEN INFORMASI RUANGAN */}
                    <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-slate-900 text-base md:text-lg group-hover:text-[#9f1521] transition-colors">
                            {room.name}
                          </h4>
                          <span className="px-3 py-1 bg-rose-50 text-[#9f1521] border border-rose-100 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-xs">
                            <Users size={13} /> {room.capacity || "Fleksibel"}{" "}
                            Orang
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 flex items-start gap-2 leading-relaxed font-medium">
                          <Info
                            size={14}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />
                          <span>
                            {room.description || "Fasilitas rapat standar OJK."}
                          </span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Gedung Kantor OJK Sumsel</span>
                        <span className="text-[#9f1521] group-hover:underline">
                          Tersedia untuk Reservasi →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-400 font-medium italic">
                Belum ada data ruangan yang tersedia di database.
              </div>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* 4. HOTEL REKANAN OJK */}
      <motion.section
        id="hotel"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={containerVariants}
        className="bg-slate-100/70 border-y border-slate-200 py-16"
      >
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <motion.div variants={itemVariants}>
            <span className="text-xs font-bold text-[#9f1521] uppercase tracking-widest">
              Kemitraan Akomodasi
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Hotel Rekanan Resmi OJK
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              [1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl h-64 animate-pulse border"
                />
              ))
            ) : partners.length > 0 ? (
              partners.map((h, i) => (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  key={h.id || i}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-xl"
                >
                  <div className="h-32 w-full bg-slate-200 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        h.img ||
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={h.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />{" "}
                      {h.stars || 4} Stars
                    </span>
                    <h4 className="font-bold text-sm text-slate-800">
                      {h.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {h.area || h.address || "Palembang"}
                    </p>
                  </div>
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                      {h.phone || "Kontak tidak tersedia"}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-slate-400 text-xs italic bg-white rounded-3xl border border-slate-200">
                Belum ada data hotel rekanan.
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* 5. PUSAT BANTUAN & VENDOR */}
      <QuickHelp />

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 Tim LMSt — Kantor OJK Provinsi Sumatera Selatan. Hak Cipta
            Dilindungi.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              Portal Pegawai
            </Link>
            <Link
              href="/panduan"
              className="hover:text-white transition-colors"
            >
              Panduan SOP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
