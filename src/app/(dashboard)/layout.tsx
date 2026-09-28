"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Moon,
  Sun,
  User,
  Search,
  ChevronDown,
  Loader2,
  Menu,
  X,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { getFilteredNavItems } from "@/lib/auth";
import NotificationDropdown, {
  NotificationItem,
} from "@/components/dashboard/NotificationDropdown";
import SessionExpiredModal from "@/components/dashboard/SessionExpiredModal";
import { useAuth } from "@/hooks/useAuth";

interface LocalUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user: authUser,
    loading: authLoading,
    isSessionExpired,
    logout,
  } = useAuth();

  const [user, setUser] = useState<LocalUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // State Pop-up Pengumuman Update
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Cek Session Lokal vs Auth
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading) {
        const storedUser = sessionStorage.getItem("local_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (err) {
            console.error("Gagal membaca session user:", err);
          }
        } else if (authUser) {
          setUser(authUser);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [authUser, authLoading]);

  // Efek untuk memunculkan Modal Update (Hanya untuk Admin & Internal)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && user.role !== "eksternal") {
        const hasSeenUpdate = sessionStorage.getItem("ampera_update_v2_seen");
        if (!hasSeenUpdate) {
          setShowUpdateModal(true);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  const handleCloseUpdateModal = () => {
    sessionStorage.setItem("ampera_update_v2_seen", "true");
    setShowUpdateModal(false);
  };

  // Validasi sesi yang aman
  useEffect(() => {
    if (authLoading) return;

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/check-session");

        if (res.status === 401) {
          const storedUser = sessionStorage.getItem("local_user");
          if (!storedUser) {
            router.push("/login?error=unauthorized");
          }
          return;
        }

        const data = await res.json();

        if (!res.ok || !data.valid) {
          sessionStorage.removeItem("local_user");
          const reason = data.message?.includes("aktivitas")
            ? "timeout"
            : "session_replaced";
          router.push(`/login?error=${reason}`);
        }
      } catch (err) {
        console.error("Gagal memvalidasi sesi aktif:", err);
      }
    };

    const timeoutId = setTimeout(verifySession, 2000);
    const interval = setInterval(verifySession, 45000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [authLoading, router]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const storedUser = sessionStorage.getItem("local_user");
      if (storedUser) {
        try {
          const currentUser = JSON.parse(storedUser);
          if (currentUser?.id) {
            navigator.sendBeacon(
              "/api/auth/logout-beacon",
              JSON.stringify({ userId: currentUser.id }),
            );
          }
        } catch (e) {
          // Abaikan error
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const fetchNotifications = useCallback(async (currentUserData: LocalUser) => {
    try {
      const res = await fetch(
        `/api/notifikasi?user_id=${currentUserData.id}&role=${currentUserData.role}`,
      );
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        const dbNotifs: NotificationItem[] = result.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.type || "room",
          status: item.status || "Pending",
          date: item.created_at ? item.created_at.split("T")[0] : "",
          info: item.info || "",
          user_id: item.user_id ? Number(item.user_id) : null,
          created_at: item.created_at,
          is_read: item.is_read,
        }));

        setNotifications(dbNotifs);

        const unreadExist = dbNotifs.some(
          (notif: any) =>
            Number(notif.is_read) === 0 || notif.is_read === false,
        );
        setHasUnread(unreadExist);
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchNotifications(user);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, fetchNotifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Gagal keluar:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const navItems = getFilteredNavItems(user?.role);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#9f1521]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300 relative">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(159, 21, 33, 0.25);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(159, 21, 33, 0.6);
        }
      `}</style>

      {/* BACKDROP MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`fixed top-4 bottom-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 z-50 flex flex-col justify-between shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ease-out ${
          isMobileMenuOpen ? "left-4 w-[280px]" : "-left-80 lg:left-4"
        }`}
        style={{
          width:
            typeof window !== "undefined"
              ? isHovered && window.innerWidth >= 1024
                ? 280
                : window.innerWidth >= 1024
                  ? 88
                  : 280
              : 88,
        }}
        onMouseEnter={() =>
          typeof window !== "undefined" &&
          window.innerWidth >= 1024 &&
          setIsHovered(true)
        }
        onMouseLeave={() =>
          typeof window !== "undefined" &&
          window.innerWidth >= 1024 &&
          setIsHovered(false)
        }
      >
        <div className="flex flex-col h-full w-full">
          {/* Header Sidebar & Logo */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between min-h-[80px] shrink-0 whitespace-nowrap">
            <div
              className={`flex items-center gap-3 w-full ${
                isHovered || isMobileMenuOpen
                  ? "justify-start px-2"
                  : "justify-center px-0"
              }`}
            >
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-md bg-white flex items-center justify-center border border-slate-100">
                <Image
                  src="/icon.png"
                  alt="Logo OJK"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className={`transition-opacity duration-200 overflow-hidden text-left ${
                  isHovered || isMobileMenuOpen
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none lg:w-0"
                }`}
              >
                <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                  AMPERA
                </h1>
                <p className="text-[10px] font-bold text-[#9f1521] dark:text-rose-400 uppercase tracking-widest">
                  KOJK SUMSEL
                </p>
              </div>

              {(isHovered || isMobileMenuOpen) && (
                <div className="flex items-center ml-auto">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
                  >
                    <X size={18} />
                  </button>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 shrink-0 hidden lg:block"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 shrink-0">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2.5 overflow-hidden">
              <Search size={16} className="text-slate-400 shrink-0 mx-auto" />
              <input
                type="text"
                placeholder="Search..."
                className={`bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                  isHovered || isMobileMenuOpen
                    ? "w-full pl-2.5 opacity-100"
                    : "w-0 opacity-0 pointer-events-none lg:w-0"
                }`}
              />
            </div>
          </div>

          {/* Menu Navigasi Utama */}
          <nav className="px-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={
                    !isHovered && !isMobileMenuOpen ? item.label : undefined
                  }
                >
                  <div
                    className={`flex items-center p-3 rounded-2xl text-xs font-bold transition-colors box-border whitespace-nowrap ${
                      isHovered || isMobileMenuOpen
                        ? "justify-start gap-3.5"
                        : "justify-center"
                    } ${
                      isActive
                        ? "bg-[#9f1521] text-white shadow-md shadow-rose-900/25"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    <span
                      className={`transition-opacity duration-200 truncate overflow-hidden whitespace-nowrap ${
                        isHovered || isMobileMenuOpen
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none lg:w-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer Sidebar: User Profile & Logout */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
            <div
              className={`flex items-center gap-3 px-2 py-1 overflow-hidden ${
                !isHovered && !isMobileMenuOpen && "lg:justify-center"
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                <User size={18} />
              </div>
              <div
                className={`transition-opacity duration-200 truncate whitespace-nowrap overflow-hidden ${
                  isHovered || isMobileMenuOpen
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none lg:w-0"
                }`}
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || "Pegawai OJK"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate capitalize">
                  {user?.role || "Internal"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title={!isHovered && !isMobileMenuOpen ? "Logout" : undefined}
              className={`flex items-center bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all border border-rose-100 dark:border-rose-900/50 whitespace-nowrap overflow-hidden cursor-pointer ${
                isHovered || isMobileMenuOpen
                  ? "gap-3.5 p-3 w-full justify-start"
                  : "lg:justify-center lg:w-12 lg:h-12 lg:p-0 lg:mx-auto gap-3.5 p-3 w-full justify-start"
              }`}
            >
              <LogOut size={18} className="shrink-0" />
              <span
                className={`transition-opacity duration-200 truncate overflow-hidden whitespace-nowrap ${
                  isHovered || isMobileMenuOpen
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none lg:w-0"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA KANAN */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out pl-0 ${
          isHovered ? "lg:pl-[310px]" : "lg:pl-[110px]"
        }`}
      >
        {/* HEADER */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>

            <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">
              Portal Internal AMPERA OJK Sumatera Selatan
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NotificationDropdown
              isOpen={isNotifOpen}
              setIsOpen={setIsNotifOpen}
              notifications={notifications}
              currentUser={user}
              hasUnread={hasUnread}
              setHasUnread={setHasUnread}
              onRefresh={() => {
                if (user) fetchNotifications(user);
              }}
            />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* MODAL PENGUMUMAN UPDATE (HANYA UNTUK ADMIN & INTERNAL) */}
      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              {/* Ilustrasi Gambar Menu Baru / Aset Lokal */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <Image
                  src="/MenuBaru.png"
                  alt="Ilustrasi Pembaruan Sistem Ampera"
                  fill
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-6">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 bg-[#9f1521] text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                      FITUR UTAMA BARU
                    </span>
                    <h3 className="text-lg font-black text-white leading-snug">
                      Pembaruan & Optimalisasi Modul AMPERA
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Selamat datang kembali! Berikut adalah ringkasan peningkatan
                  fitur operasional terbaru yang telah diintegrasikan untuk
                  mendukung kelancaran administrasi di lingkungan OJK Provinsi
                  Sumatera Selatan:
                </p>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 max-h-[35vh] overflow-y-auto custom-scrollbar">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                      <Check size={12} />
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white">
                        Modul Rekapitulasi Kendaraan KOPG:
                      </strong>{" "}
                      Pemisahan kolom detail tujuan, keperluan, pengguna, serta
                      driver secara presisi untuk laporan digital yang lebih
                      rapi.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                      <Check size={12} />
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white">
                        Validasi Otomatis Ruang Komunal & Ballroom:
                      </strong>{" "}
                      Penyaringan kapasitas ketat untuk mencegah bentrok
                      reservasi kegiatan berskala besar.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                      <Check size={12} />
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white">
                        Aksi Pembatalan Mandiri:
                      </strong>{" "}
                      Kemudahan bagi pegawai internal untuk mengelola atau
                      membatalkan status agenda langsung dari sistem.
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleCloseUpdateModal}
                    className="w-full py-3.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-rose-900/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Mengerti, Lanjutkan ke Dashboard <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PENGUMUMAN UPDATE (FULL GAMBAR / POSTER STYLE) */}
      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700/60"
            >
              {/* Tombol Close Silang di Pojok Kanan Atas */}
              <button
                onClick={handleCloseUpdateModal}
                className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer"
                title="Tutup"
              >
                <X size={18} />
              </button>

              {/* Kontainer Gambar Full & Tajam */}
              <div className="relative h-[380px] sm:h-[420px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <Image
                  src="/MenuBaru.png"
                  alt="Pembaruan Sistem Ampera OJK"
                  fill
                  className="object-cover object-center"
                  quality={100}
                  priority
                />

                {/* Gradasi Hitam Halus di Bagian Bawah untuk Kejelasan Teks */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8 space-y-3 z-20">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#9f1521] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      INFORMASI PEMBARUAN V2.5
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      ✨ OJK Sumsel
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                    Optimalisasi & Pembaruan Sistem AMPERA
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed line-clamp-3">
                    Pembaruan modul rekapitulasi kendaraan KOPG, validasi ruang
                    komunal otomatis, serta peningkatan fitur pembatalan mandiri
                    agenda kini telah aktif untuk mendukung efisiensi
                    operasional.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCloseUpdateModal}
                      className="w-full py-3.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-extrabold rounded-2xl transition-all shadow-xl shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-2 border border-rose-600/30"
                    >
                      Mengerti, Lanjutkan ke Dashboard <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SessionExpiredModal isOpen={isSessionExpired} onLogout={logout} />
    </div>
  );
}
