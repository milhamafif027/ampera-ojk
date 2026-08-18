"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Efek mendeteksi scroll untuk mengubah bentuk navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center ${
        scrolled ? "py-3 px-4" : "py-0 px-0"
      }`}
    >
      <div
        className={`w-full transition-all duration-500 flex items-center justify-between px-6 ${
          scrolled
            ? "max-w-6xl bg-white/95 backdrop-blur-md shadow-xl rounded-full border border-slate-200/80 py-3"
            : "max-w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 rounded-none py-4"
        }`}
      >
        {/* Logo & Identitas Portal (Menggunakan icon.png) */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md bg-white flex items-center justify-center border border-slate-100 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt="Logo OJK"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 leading-tight group-hover:text-[#9f1521] transition-colors">
              AMPERA
            </h1>
            <p className="text-[9px] font-semibold text-[#9f1521] tracking-wider">
              OJK SUMSEL
            </p>
          </div>
        </Link>

        {/* Menu Navigasi Tengah (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          {["profil", "fasilitas", "hotel", "bantuan"].map((id) => {
            const labels: Record<string, string> = {
              profil: "Profil Gedung",
              fasilitas: "Fasilitas & Layanan",
              hotel: "Hotel Rekanan",
              bantuan: "Pusat Bantuan",
            };
            return (
              <a
                key={id}
                href={`#${id}`}
                className="relative hover:text-[#9f1521] transition-colors py-1 group"
              >
                {labels[id]}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#9f1521] transition-all duration-300 group-hover:w-full" />
              </a>
            );
          })}
        </nav>

        {/* Tombol Login & Hamburger */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hidden sm:block"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-900/10 hover:shadow-lg hover:shadow-rose-900/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login Pegawai
            </Link>
          </motion.div>

          {/* Tombol Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#9f1521] transition-colors rounded-xl bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Menu Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-4 right-4 mt-2 md:hidden bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xl z-50"
          >
            <a
              href="#profil"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-100"
            >
              Profil Gedung
            </a>
            <a
              href="#fasilitas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-100"
            >
              Fasilitas & Layanan
            </a>
            <a
              href="#hotel"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-100"
            >
              Hotel Rekanan
            </a>
            <a
              href="#bantuan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-semibold text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-100"
            >
              Pusat Bantuan
            </a>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#9f1521] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md"
              >
                <LogIn className="w-4 h-4" />
                Login Pegawai
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
