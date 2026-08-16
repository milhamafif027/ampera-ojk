"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon, Bell, User as UserIcon } from "lucide-react";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    const initHeaderState = async () => {
      // Memaksa eksekusi berjalan secara asynchronous (microtask queue)
      await Promise.resolve();

      // 1. Cek status dark mode dari class <html>
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);

      // 2. Ambil data user login dari localStorage
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca profil user:", err);
        }
      }
    };

    initHeaderState();
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 lg:px-8 flex items-center justify-between">
      {/* KIRI - JUDUL PORTAL */}
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Portal Internal AMPERA OJK Sumatera Selatan
      </div>

      {/* KANAN - AKSI & PROFIL USER */}
      <div className="flex items-center gap-3">
        {/* Toggle Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Mode Tampilan"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifikasi */}
        <div className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#9f1521]" />
        </div>

        {/* Avatar & Profil User */}
        {user && (
          <div className="pl-2 border-l border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#9f1521] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold capitalize">
                {user.role} {user.nip ? `• ${user.nip}` : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
