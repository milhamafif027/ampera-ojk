"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
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

  // State baru untuk Modal Peringatan Sesi Ganda (Duplicate Login / 403)
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

      // Tangkap penolakan status 403 karena akun sedang aktif di perangkat lain
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
        err.message ||
          "Gagal masuk. Periksa koneksi ke database lokal phpMyAdmin Anda.",
      );
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 sm:p-6 font-sans selection:bg-[#9f1521] selection:text-white overflow-y-auto">
      {/* Container Utama Berbentuk Kartu Fleksibel Menyesuaikan Layar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/60 my-auto"
      >
        {/* SISI KIRI: Form Login (Lebar 6 Kolom) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative">
          {/* Tombol Kembali */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#9f1521] transition-colors bg-slate-100 hover:bg-rose-50 px-3.5 py-2 rounded-xl group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Kembali ke Beranda Utama
            </Link>
          </div>

          {/* Konten Form */}
          <div className="my-auto py-6 max-w-md w-full mx-auto">
            <div className="relative h-14 w-28 mb-4">
              <Image
                src="/logo-lms.png"
                alt="Logo OJK"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight">
              Selamat Datang Kembali
            </h2>
            <p className="text-slate-500 mb-6 text-xs font-medium">
              Silakan masuk menggunakan kredensial akun pegawai AMPERA
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Email Pengguna / NIP
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9f1521] transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#9f1521] focus:bg-white transition-all font-medium shadow-sm"
                    placeholder="admin@timlms.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9f1521] transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/80 border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#9f1521] focus:bg-white transition-all font-medium shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#9f1521] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2.5 shadow-sm">
                  <ShieldAlert size={16} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#9f1521] hover:bg-[#7a1019] text-white py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk ke Dasbor Utama
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer Kecil */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 max-w-md mx-auto w-full">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="hover:text-[#9f1521] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle size={13} /> Pusat Bantuan
              </button>
              <Link
                href="/panduan"
                className="hover:text-[#9f1521] transition-colors flex items-center gap-1"
              >
                <BookOpen size={13} /> SOP / Panduan
              </Link>
            </div>
            <span>V 1.0</span>
          </div>
        </div>

        {/* SISI KANAN: Visual Gambar Menyesuaikan Otomatis dengan Teks Baru */}
        <div className="hidden lg:col-span-6 lg:flex relative p-4 items-center justify-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full h-full min-h-[520px] lg:min-h-[580px] overflow-hidden shadow-xl"
            style={{
              borderRadius: "2rem",
              clipPath:
                "path('M 0 50 C 0 20, 20 0, 50 0 L 100% 0 L 100% 100% L 0 100% Z')",
            }}
          >
            <Image
              src="/bg-satu.jpg"
              alt="Gedung OJK"
              fill
              priority
              className="object-cover object-center transform hover:scale-105 transition-transform duration-1000"
            />
            {/* Gradien Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-widest mb-1">
                Kantor OJK Provinsi Sumatera Selatan
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
                AMPERA
              </h3>
              <p className="text-sm text-rose-200 font-bold leading-relaxed max-w-md">
                Aplikasi Manajemen Peminjaman Ruangan & Kendaraan
              </p>
            </div>
          </motion.div>
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
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL PERINGATAN KARENA AKUN SEDANG DIGUNAKAN DI PERANGKAT LAIN */}
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
                  // Opsional: Anda bisa mengosongkan password agar user bisa input ulang
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
