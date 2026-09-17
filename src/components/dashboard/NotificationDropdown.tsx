"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Building2,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationItem {
  id: string | number;
  title: string;
  type: "room" | "vehicle";
  status: "Disetujui" | "Ditolak" | "Pending";
  date: string;
  info: string;
  user_id?: number | null;
  created_at?: string;
  is_read?: number | boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  notifications: NotificationItem[];
  currentUser: any;
  hasUnread: boolean;
  setHasUnread: (hasUnread: boolean) => void;
  onRefresh?: () => void;
}

export default function NotificationDropdown({
  isOpen,
  setIsOpen,
  notifications,
  currentUser,
  hasUnread,
  setHasUnread,
  onRefresh,
}: NotificationDropdownProps) {
  const notifRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<
    "terbaru" | "Disetujui" | "Ditolak" | "Pending"
  >("terbaru");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevCountRef = useRef<number>(0);

  // [FITUR AUDIO] Membunyikan lonceng notifikasi menggunakan Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Abaikan jika ada batasan kebijakan audio browser
    }
  }, []);

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Auto-polling interval setiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) onRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleManualRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const payload = {
        userId: currentUser?.id || null,
        role: currentUser?.role || "eksternal",
        markAll: true,
      };

      const res = await fetch("/api/notifikasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setHasUnread(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Gagal memperbarui status baca:", err);
    }
  };

  // Penyaringan berdasarkan tab aktif
  const filteredNotifications = React.useMemo(() => {
    return [...notifications]
      .filter((notif) => {
        const text = `${notif.title} ${notif.info}`.toLowerCase();
        const isApproved =
          notif.status === "Disetujui" ||
          text.includes("disetujui") ||
          text.includes("diterima");
        const isRejected =
          notif.status === "Ditolak" || text.includes("ditolak");
        const isPending =
          notif.status === "Pending" ||
          text.includes("pending") ||
          text.includes("menunggu");

        if (activeFilter === "Disetujui") return isApproved;
        if (activeFilter === "Ditolak") return isRejected;
        if (activeFilter === "Pending") return isPending;
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.date).getTime() || 0;
        const timeB = new Date(b.created_at || b.date).getTime() || 0;
        return timeB - timeA;
      });
  }, [notifications, activeFilter]);

  const activeNotifsCount = filteredNotifications.length;

  // Hitung jumlah pesan yang belum dibaca (is_read === 0 / false)
  const unreadCount = notifications.filter(
    (n) => Number(n.is_read) === 0 || n.is_read === false,
  ).length;

  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current !== 0) {
      playNotificationSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, playNotificationSound]);

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
          hasUnread || unreadCount > 0
            ? "bg-rose-500/10 dark:bg-rose-500/20 text-[#9f1521] dark:text-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/25 animate-pulse"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Notifikasi"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-[#9f1521] text-white text-[10px] font-black shadow-md ring-2 ring-white dark:ring-slate-900 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-[380px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50"
          >
            {/* HEADER DROPDOWN */}
            <div className="px-5 py-4 bg-gradient-to-br from-[#9f1521] via-[#85121b] to-[#7a1019] text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-xl">
                    <Bell size={15} />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-wider">
                      Pusat Notifikasi
                    </h3>
                    <p className="text-[10px] text-rose-200 font-medium">
                      {unreadCount > 0
                        ? `${unreadCount} pesan belum dibaca`
                        : "Semua pesan sudah dibaca"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleManualRefresh}
                    className="p-2 bg-white/15 hover:bg-white/25 rounded-xl cursor-pointer transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw
                      size={13}
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                  </button>
                  {activeNotifsCount > 0 && unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <CheckCheck size={13} /> Baca Semua
                    </button>
                  )}
                </div>
              </div>

              {/* TAB FILTER */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {(["terbaru", "Disetujui", "Ditolak", "Pending"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer text-center ${
                        activeFilter === tab
                          ? "bg-white text-[#9f1521] shadow-sm"
                          : "bg-white/10 hover:bg-white/20 text-white/80"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* LIST NOTIFIKASI */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => {
                  const textToCheck =
                    `${notif.title} ${notif.info}`.toLowerCase();
                  const isApproved =
                    notif.status === "Disetujui" ||
                    textToCheck.includes("disetujui") ||
                    textToCheck.includes("diterima");
                  const isRejected =
                    notif.status === "Ditolak" ||
                    textToCheck.includes("ditolak");
                  const currentStatus = isApproved
                    ? "Disetujui"
                    : isRejected
                      ? "Ditolak"
                      : "Pending";

                  const isUnreadItem =
                    Number(notif.is_read) === 0 || notif.is_read === false;

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 flex items-start gap-3.5 border-l-4 transition-all ${
                        isUnreadItem
                          ? "bg-rose-50/50 dark:bg-rose-950/20 border-[#9f1521]"
                          : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* IKON KATEGORI */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isApproved
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            : isRejected
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {notif.type === "room" ? (
                          <Building2 size={16} />
                        ) : (
                          <Car size={16} />
                        )}
                      </div>

                      {/* KONTEN */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug flex items-center gap-1.5">
                            {notif.title}
                            {isUnreadItem && (
                              <span
                                className="w-2 h-2 rounded-full bg-[#9f1521] animate-pulse"
                                title="Belum dibaca"
                              />
                            )}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border shrink-0 ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : isRejected
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {notif.info}
                        </p>

                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={11} /> {notif.date}
                          </span>

                          {isApproved && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Selesai / Aktif
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <XCircle size={12} /> Dibatalkan
                            </span>
                          )}
                          {!isApproved && !isRejected && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <AlertCircle size={12} /> Menunggu Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Tidak ada notifikasi pada kategori ini.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER DROPDOWN */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-[#9f1521] dark:text-rose-400 hover:underline cursor-pointer"
              >
                Tutup Panel Notifikasi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
