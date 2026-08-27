"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/landingPage/Navbar";
import Hero from "@/components/landingPage/Hero";
import QuickHelp from "@/components/landingPage/QuickHelp";
import LandingRooms from "@/components/landingPage/LandingRooms";
import LandingPartners from "@/components/landingPage/LandingPartners";
import { AlertCircle } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* 1. NAVBAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <Hero />

      {hasError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>Gagal memuat sebagian data live database.</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. FASILITAS & KATALOG RUANGAN UTAMA */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.1 }}
        variants={containerVariants}
        className="w-full flex flex-col"
      >
        <LandingRooms
          rooms={rooms}
          isLoading={isLoading}
          itemVariants={itemVariants}
        />

        {/* 4. HOTEL REKANAN OJK */}
        <LandingPartners
          partners={partners}
          isLoading={isLoading}
          itemVariants={itemVariants}
        />
      </motion.div>

      {/* 5. PUSAT BANTUAN & VENDOR */}
      <QuickHelp />

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="leading-relaxed">
            © 2026 Tim LMSt — Kantor OJK Provinsi Sumatera Selatan. Hak Cipta
            Dilindungi.
          </p>
          <div className="flex items-center gap-6 shrink-0">
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
