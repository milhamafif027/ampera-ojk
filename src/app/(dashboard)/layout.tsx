"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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

  // Efek untuk memunculkan Modal Update jika belum pernah dilihat (session_storage)
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenUpdate = sessionStorage.getItem("ampera_update_v2_seen");
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
          // Abaikan error parse
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
      console.error("Gagal memuat notifikasi dari database:", error);
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
      {/* Global CSS untuk Custom Scrollbar Modal Update & Elemen Lain */}
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
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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

      {/* MODAL PENGUMUMAN UPDATE (GLOBAL LAYOUT) */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#9f1521] flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  PEMBARUAN SISTEM V2.5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Selamat Datang di AMPERA
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Kami telah merilis sejumlah pembaruan fitur untuk mengoptimalkan
              manajemen fasilitas dan pengalaman operasional di lingkungan OJK
              Provinsi Sumatera Selatan:
            </p>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 max-h-[45vh] overflow-y-auto custom-scrollbar">
              {/* Poin 1 */}
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Integrasi & Validasi Otomatis Ruang Komunal:
                  </strong>{" "}
                  Sistem kini secara otomatis membatasi pemesanan Ruang Komunal
                  apabila Ballroom sedang digunakan dalam kapasitas maksimal
                  (500 peserta) atau menggunakan konfigurasi tata letak Round
                  Table (≥200 peserta) untuk menjaga kenyamanan dan kelancaran
                  kegiatan bersama.
                </div>
              </div>

              {/* Poin 2 */}
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Pencarian & Filter Kapasitas Ruangan:
                  </strong>{" "}
                  Penambahan fitur filter pencarian yang memungkinkan pengguna
                  menyaring daftar ruangan berdasarkan jumlah digit atau
                  spesifikasi kapasitas angka ruangan secara presisi.
                </div>
              </div>

              {/* Poin 3 */}
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Aksi Pembatalan Mandiri (Internal):
                  </strong>{" "}
                  Penyediaan tombol batal khusus pada menu daftar agenda untuk
                  pengguna ber-role internal, memungkinkan pegawai membatalkan
                  pengajuan kegiatan mereka sendiri secara langsung dari sistem.
                </div>
              </div>

              {/* Poin 4 */}
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Akses Cepat Detail Kegiatan:
                  </strong>{" "}
                  Penambahan tombol interaktif (ikon mata) pada seluruh daftar
                  agenda, termasuk pada kartu Agenda Terdekat dan Live Status,
                  sehingga pengguna dapat langsung melihat rincian lengkap
                  kegiatan secara instan tanpa harus berpindah halaman.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseUpdateModal}
                className="w-full py-3.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-rose-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                Mengerti, Lanjutkan ke Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL LOGOUT MANUAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 z-10">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <LogOut size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin keluar dari Portal AMPERA OJK Sumsel?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#9f1521] hover:bg-[#7a1019] text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <span>Ya, Keluar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERINGATAN KARENA TIDAK AKTIF MENGGUNAKAN KOMPONEN TERPISAH */}
      <SessionExpiredModal isOpen={isSessionExpired} onLogout={logout} />
    </div>
  );
}
