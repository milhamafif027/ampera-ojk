"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLogout: () => void;
}

export default function SessionExpiredModal({
  isOpen,
  onLogout,
}: SessionExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 border border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle size={32} className="animate-bounce" />
        </div>

        <div className="space-y-2">
          <h3 className="font-black text-slate-900 dark:text-white text-lg">
            Sesi Berakhir karena Tidak Aktif
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Demi keamanan data instansi OJK Sumsel, Anda telah otomatis
            dikeluarkan dari sistem karena tidak ada aktivitas selama 30 menit.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#9f1521] hover:bg-[#7a1019] text-white transition-all shadow-lg shadow-rose-900/20 cursor-pointer"
        >
          Masuk Kembali ke Halaman Login
        </button>
      </div>
    </div>
  );
}
