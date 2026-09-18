"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, Loader2, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Efek mendeteksi scroll untuk mengubah wujud navbar (Transparan -> Frosted Glass)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLoginClick = () => {
    setIsLoading(true);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center ${
        scrolled ? "py-4 px-4" : "py-0 px-0"
      }`}
    >
      <div
        className={`w-full transition-all duration-500 flex items-center justify-between ${
          scrolled
            ? "max-w-5xl bg-white/40 backdrop-blur-xl shadow-lg shadow-slate-300/30 rounded-full border border-white/60 py-3 px-5 sm:px-6"
            : "max-w-7xl bg-transparent py-6 px-6 sm:px-12"
        }`}
      >
        {/* Logo & Identitas Portal */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 ${
              scrolled
                ? "bg-white shadow-sm border border-slate-100"
                : "bg-white/10 backdrop-blur-md border border-white/20"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt="Logo OJK"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="flex flex-col justify-center">
            <h1
              className={`font-black text-sm tracking-wide leading-tight transition-colors duration-300 ${
                scrolled
                  ? "text-slate-900 group-hover:text-[#9f1521]"
                  : "text-white"
              }`}
            >
              AMPERA
            </h1>
            <p
              className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${
                scrolled ? "text-[#9f1521]" : "text-white/80"
              }`}
            >
              OJK SUMSEL
            </p>
          </div>
        </Link>

        {/* Menu Navigasi Tengah (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wide">
          {["fasilitas", "hotel", "panduan"].map((id) => {
            const labels: Record<string, string> = {
              fasilitas: "Katalog Ruangan",
              hotel: "Hotel Rekanan",
              panduan: "Panduan Sistem",
            };
            return (
              <a
                key={id}
                href={id === "panduan" ? "/panduan" : `#${id}`}
                className={`relative py-1 group transition-colors duration-300 ${
                  scrolled
                    ? "text-slate-700 hover:text-[#9f1521]"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {labels[id]}
                <span
                  className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full rounded-full ${
                    scrolled ? "bg-[#9f1521]" : "bg-white"
                  }`}
                />
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
              onClick={handleLoginClick}
              className={`inline-flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-full transition-all duration-300 ${
                scrolled
                  ? "bg-[#9f1521] hover:bg-[#7a1019] text-white shadow-md shadow-rose-900/20"
                  : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? "Memproses..." : "Login Pegawai"}
            </Link>
          </motion.div>

          {/* Tombol Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-all duration-300 ${
              scrolled
                ? "text-slate-700 hover:text-[#9f1521] bg-white/80 border border-slate-200 shadow-sm"
                : "text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
            }`}
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
            className="absolute top-full left-4 right-4 mt-2 md:hidden bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-5 space-y-3 shadow-2xl z-50"
          >
            <a
              href="#fasilitas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-extrabold tracking-wide text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-200/60 transition-colors"
            >
              Katalog Ruangan
            </a>
            <a
              href="#hotel"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-extrabold tracking-wide text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-200/60 transition-colors"
            >
              Hotel Rekanan
            </a>
            <Link
              href="/panduan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-extrabold tracking-wide text-slate-700 hover:text-[#9f1521] py-2 border-b border-slate-200/60 transition-colors"
            >
              Panduan Sistem
            </Link>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLoginClick();
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#9f1521] hover:bg-[#7a1019] transition-colors text-white text-xs font-bold px-5 py-3.5 rounded-xl shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoading ? "Memproses..." : "Login Pegawai"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
