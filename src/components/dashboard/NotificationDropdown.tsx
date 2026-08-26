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
    "terbaru" | "Disetujui" | "Ditolak"
  >("terbaru");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevCountRef = useRef<number>(0);

  // [FITUR AUDIO] Fungsi membunyikan lonceng notifikasi secara instan menggunakan Web Audio API
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
    } catch (e) {
      // Ignore audio policy restrictions if user hasn't interacted yet
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
      // Kirim payload dengan role dan userId agar API memperbarui tabel yang tepat
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
      } else {
        console.error("Gagal menandai semua dibaca:", result.message);
      }
    } catch (err) {
      console.error("Gagal memperbarui status baca:", err);
    }
  };

  // Penyaringan berdasarkan tab aktif (Backend sudah memisahkan data sesuai role)
  const filteredNotifications = React.useMemo(() => {
    return [...notifications]
      .filter((notif) => {
        if (activeFilter === "Disetujui") {
          const text = `${notif.title} ${notif.info}`.toLowerCase();
          return (
            notif.status === "Disetujui" ||
            text.includes("disetujui") ||
            text.includes("diterima")
          );
        }
        if (activeFilter === "Ditolak") {
          const text = `${notif.title} ${notif.info}`.toLowerCase();
          return notif.status === "Ditolak" || text.includes("ditolak");
        }
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
  const unreadCount = filteredNotifications.filter(
    (n) => Number(n.is_read) === 0 || n.is_read === false,
  ).length;

  // [EFEK SUARA] Cek jika ada penambahan jumlah pesan belum dibaca baru
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
            ? "bg-rose-500/10 dark:bg-rose-500/20 text-[#9f1521] dark:text-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20 animate-pulse"
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
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
          >
            <div className="px-5 py-4 bg-gradient-to-br from-[#9f1521] via-[#85121b] to-[#7a1019] text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <h3 className="font-black text-xs uppercase tracking-wider">
                    Notifikasi Status{" "}
                    {unreadCount > 0 && `(${unreadCount} Baru)`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={13}
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                  </button>
                  {activeNotifsCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="bg-white/25 hover:bg-white/35 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl cursor-pointer"
                    >
                      <CheckCheck size={13} className="inline mr-1" /> Baca
                      Semua
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {(["terbaru", "Disetujui", "Ditolak"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${activeFilter === tab ? "bg-white text-[#9f1521]" : "bg-white/15 text-white/80"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
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
                      : notif.status;
                  const isUnreadItem =
                    Number(notif.is_read) === 0 || notif.is_read === false;

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 flex items-start gap-3.5 border-l-4 transition-colors ${isUnreadItem ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-400" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isApproved ? "bg-emerald-100 text-emerald-600" : isRejected ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}
                      >
                        {notif.type === "room" ? (
                          <Building2 size={16} />
                        ) : (
                          <Car size={16} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            {notif.title}
                            {isUnreadItem && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
                                title="Belum dibaca"
                              />
                            )}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${isApproved ? "text-emerald-700 border-emerald-200" : isRejected ? "text-rose-700 border-rose-200" : "text-amber-700 border-amber-200"}`}
                          >
                            {currentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {notif.info}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {notif.date}
                          </span>
                          {isApproved && (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Diterima
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <XCircle size={11} /> Ditolak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 italic">
                  Tidak ada notifikasi untuk akun ini.
                </div>
              )}
            </div>

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
