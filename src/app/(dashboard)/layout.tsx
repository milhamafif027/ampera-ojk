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
  AlertCircle,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { getFilteredNavItems } from "@/lib/auth";
import NotificationDropdown, {
  NotificationItem,
} from "@/components/dashboard/NotificationDropdown";

interface LocalUser {
  id: number;
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
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // State untuk indikator loading logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State & Ref untuk Dropdown Notifikasi
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Cek Session User dari localStorage
  useEffect(() => {
    const checkUserSession = async () => {
      await Promise.resolve();
      const storedUser = localStorage.getItem("local_user");
      if (!storedUser) {
        router.push("/login");
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
          router.push("/login");
        }
      }
    };
    checkUserSession();
  }, [router]);

  // Fungsi Fetch Data Notifikasi dari Database MySQL
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

  // Panggil fetchNotifications saat user sudah siap
  // Panggil fetchNotifications saat user sudah siap
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const res = await fetch(
          `/api/notifikasi?user_id=${user.id}&role=${user.role}`,
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
    };

    loadNotifications();
  }, [user]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Fungsi Logout dengan efek loading yang rapi
  const handleConfirmLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      localStorage.removeItem("local_user");
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      router.push("/login");
    }, 600);
  };

  const navItems = getFilteredNavItems(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* SIDEBAR */}
      <aside
        className="fixed left-4 top-4 bottom-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 z-40 flex flex-col justify-between shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ease-out"
        style={{ width: isHovered ? 280 : 88 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full w-full">
          {/* Header Sidebar & Logo icon.png */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center min-h-[80px] shrink-0 whitespace-nowrap">
            <div
              className={`flex items-center gap-3 w-full ${
                isHovered ? "justify-start px-2" : "justify-center px-0"
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
                  isHovered
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none w-0"
                }`}
              >
                <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                  AMPERA
                </h1>
                <p className="text-[10px] font-bold text-[#9f1521] dark:text-rose-400 uppercase tracking-widest">
                  KOJK SUMSEL
                </p>
              </div>

              {isHovered && (
                <ChevronDown
                  size={16}
                  className="text-slate-400 shrink-0 ml-auto"
                />
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
                  isHovered
                    ? "w-full pl-2.5 opacity-100"
                    : "w-0 opacity-0 pointer-events-none"
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
                  title={!isHovered ? item.label : undefined}
                >
                  <div
                    className={`flex items-center p-3 rounded-2xl text-xs font-bold transition-colors box-border whitespace-nowrap ${
                      isHovered ? "justify-start gap-3.5" : "justify-center"
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
                        isHovered
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none w-0"
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
                !isHovered && "justify-center"
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                <User size={18} />
              </div>
              <div
                className={`transition-opacity duration-200 truncate whitespace-nowrap overflow-hidden ${
                  isHovered
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none w-0"
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
              title={!isHovered ? "Logout" : undefined}
              className={`flex items-center bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all border border-rose-100 dark:border-rose-900/50 whitespace-nowrap overflow-hidden cursor-pointer ${
                isHovered
                  ? "gap-3.5 p-3 w-full justify-start"
                  : "justify-center w-12 h-12 p-0 mx-auto"
              }`}
            >
              <LogOut size={18} className="shrink-0" />
              <span
                className={`transition-opacity duration-200 truncate overflow-hidden whitespace-nowrap ${
                  isHovered
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none w-0"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* KONTEN KANAN */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out"
        style={{ paddingLeft: isHovered ? "310px" : "110px" }}
      >
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Portal Internal AMPERA OJK Sumatera Selatan
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* KOMPONEN NOTIFIKASI */}
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

        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* MODAL LOGOUT */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 z-10">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
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
    </div>
  );
}
