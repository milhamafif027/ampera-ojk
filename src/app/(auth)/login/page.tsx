"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  HelpCircle,
  BookOpen,
  X,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // State untuk Modal Peringatan Sesi Ganda (Duplicate Login / 403)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        setIsLoading(false);
        setDuplicateMessage(
          data.message || "Akun sedang digunakan oleh pengguna lain.",
        );
        setIsDuplicateModalOpen(true);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.message || "Email atau kata sandi yang Anda masukkan salah.",
        );
      }

      sessionStorage.setItem("local_user", JSON.stringify(data.user));
      router.push("/dashboardUtama");
    } catch (err: any) {
      setIsLoading(false);
      setError(
        err.message || "Gagal masuk. Periksa kembali kredensial akun Anda.",
      );
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans selection:bg-[#9f1521] selection:text-white overflow-y-auto">
      {/* Container Utama: Putih dengan padding di dalam untuk memberikan bingkai putih pada gambar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row p-2 sm:p-3 my-auto min-h-[600px] border border-slate-100"
      >
        {/* SISI KIRI: Visual Gambar (Mirip referensi, digeser ke kiri) */}
        <div className="hidden lg:flex lg:w-1/2 relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-900">
          <Image
            src="/bg-satu.jpg"
            alt="Gedung OJK"
            fill
            priority
            className="object-cover object-center opacity-90 mix-blend-overlay"
          />
          {/* Overlay Gelap */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-900/30 flex flex-col justify-between p-8 text-white">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold tracking-widest text-white/80">
                OJK SUMSEL
              </span>
              <div className="flex gap-4 text-[10px] font-bold tracking-widest text-white/60">
                <Link href="/" className="hover:text-white transition-colors">
                  BERANDA
                </Link>
                <Link
                  href="/panduan"
                  className="hover:text-white transition-colors"
                >
                  PANDUAN
                </Link>
              </div>
            </div>

            {/* Widget Ala User Profile di Kiri Bawah */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#9f1521] rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                OJK
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight tracking-wide">
                  AMPERA
                </h3>
                <p className="text-xs text-white/70 font-medium">
                  Manajemen Peminjaman Ruangan & Kendaraan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Form Login yang Bersih */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 relative">
          {/* Tombol Kembali (Mobile Only - Di Desktop dipindah ke gambar) */}
          <div className="absolute top-6 right-6 lg:hidden">
            <Link
              href="/"
              className="text-[10px] font-bold text-slate-500 hover:text-[#9f1521] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Beranda
            </Link>
          </div>

          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Masuk menggunakan kredensial pegawai AMPERA
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                {/* Input Email yang Bersih */}
                <div>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#9f1521] focus:ring-1 focus:ring-[#9f1521] transition-all font-medium"
                    placeholder="Email Pengguna"
                    required
                  />
                </div>

                {/* Input Password yang Bersih */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#9f1521] focus:ring-1 focus:ring-[#9f1521] transition-all font-medium"
                    placeholder="Kata Sandi"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#9f1521] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Lupa Kata Sandi / Pusat Bantuan */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-[#9f1521] transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2.5">
                  <ShieldAlert size={16} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tombol Login Merah Klasik */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#9f1521] hover:bg-[#7a1019] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Login Pegawai"
                )}
              </motion.button>
            </form>

            {/* Footer Form */}
            <div className="pt-6 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <HelpCircle size={12} /> Pusat Bantuan
              </button>
              <span>•</span>
              <Link
                href="/panduan"
                className="hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <BookOpen size={12} /> SOP & Panduan
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MODAL PUSAT BANTUAN */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative"
          >
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-red-50 text-[#9f1521] rounded-xl">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Bantuan Akses & Kredensial
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Pengelolaan Akun Pegawai OJK Sumsel
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Lupa Kata Sandi / Akun Belum Terdaftar?</strong>
              </p>
              <p>
                Akun portal AMPERA dikelola oleh Tim LMSt. Jika Anda mengalami
                kendala login:
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li>Hubungi Tim IT Support OJK Sumsel (Ext: 1025).</li>
                <li>Kirim pesan internal via WhatsApp Tim LMSt.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL PERINGATAN SESI GANDA */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 relative border border-slate-100"
          >
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-slate-900 text-base">
                Akun Sedang Digunakan
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {duplicateMessage}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  setPassword("");
                }}
                className="w-full py-3 bg-[#9f1521] hover:bg-[#7a1019] text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-rose-900/20 cursor-pointer"
              >
                Mengerti & Coba Lagi
              </button>
              <p className="text-[10px] text-slate-400 leading-normal">
                Jika Anda yakin tidak sedang membuka di perangkat lain, tunggu
                1-2 menit atau tutup paksa tab sebelumnya.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
