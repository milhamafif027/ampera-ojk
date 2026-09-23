"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { getFilteredNavItems, LocalUser } from "@/lib/auth";

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<LocalUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = sessionStorage.getItem("local_user");
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (err) {
        console.error("Gagal mengambil data user dari session:", err);
        return null;
      }
    }
    return null;
  });

  const filteredNavItems = getFilteredNavItems(user?.role);

  const handleLogout = () => {
    sessionStorage.removeItem("local_user");
    router.push("/login");
  };

  return (
    <motion.aside
      className="fixed left-4 top-4 bottom-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 z-50 flex flex-col justify-between shadow-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
      initial={{ width: 88 }}
      animate={{ width: isHovered ? 280 : 88 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* 1. BRAND HEADER */}
        <div className="p-4 flex items-center border-b border-slate-100 dark:border-slate-800 overflow-hidden whitespace-nowrap min-h-[80px]">
          <div
            className={`flex items-center gap-3 w-full ${isHovered ? "justify-start px-0" : "justify-center"}`}
          >
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-md bg-white flex items-center justify-center border border-slate-100">
              <Image
                src="/icon.png"
                alt="Logo OJK"
                fill
                className="object-cover"
              />
            </div>
            <motion.div
              animate={{
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "auto" : 0,
              }}
              className="overflow-hidden text-left"
            >
              <h2 className="font-bold text-xs text-slate-900 dark:text-white">
                AMPERA OJK
              </h2>
              <p className="text-[10px] text-slate-400">Portal Pegawai</p>
            </motion.div>
          </div>
          {isHovered && (
            <ChevronDown
              size={16}
              className="text-slate-400 shrink-0 ml-auto"
            />
          )}
        </div>

        {/* 2. SEARCH BAR */}
        <div className="p-4">
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2.5">
            <Search size={16} className="text-slate-400 shrink-0 mx-auto" />
            <motion.input
              type="text"
              placeholder="Search..."
              animate={{
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "100%" : 0,
              }}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none pl-2.5 overflow-hidden"
            />
          </div>
        </div>

        {/* 3. MENU UTAMA DINAMIS */}
        <nav className="px-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center p-3 rounded-2xl transition-all ${
                  isHovered ? "gap-3.5 justify-start" : "justify-center"
                } ${
                  isActive
                    ? "bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {IconComponent && (
                  <IconComponent size={20} className="shrink-0" />
                )}
                <motion.span
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    width: isHovered ? "auto" : 0,
                  }}
                  className="text-xs whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {/* 4. LOGOUT BUTTON */}
        <div className="px-3 pb-2">
          <button
            onClick={handleLogout}
            className={`flex items-center p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all w-full cursor-pointer ${
              isHovered ? "gap-3.5 justify-start" : "justify-center"
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            <motion.span
              animate={{
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "auto" : 0,
              }}
              className="text-xs font-semibold whitespace-nowrap overflow-hidden"
            >
              Log Out
            </motion.span>
          </button>
        </div>

        {/* 5. USER PROFILE FOOTER */}
        <div
          className={`p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3 overflow-hidden whitespace-nowrap ${
            isHovered ? "justify-start" : "justify-center"
          }`}
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-200 border border-slate-300">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="User Profile"
              fill
              className="object-cover"
            />
          </div>
          <motion.div
            animate={{
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
            }}
            className="overflow-hidden"
          >
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
              {user ? user.name : "Memuat..."}
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              {user ? user.email : user?.role || "Pegawai OJK"}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
