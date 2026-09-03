"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Menit dalam milidetik

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    sessionStorage.removeItem("local_user");
    localStorage.removeItem("local_user");
    router.push("/login");
  }, [router]);

  // Efek Inaktivitas 30 Menit (Auto-Logout)
  useEffect(() => {
    const stored = sessionStorage.getItem("local_user");
    if (!stored) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert(
          "Sesi Anda telah habis karena tidak ada aktivitas selama 30 menit. Silakan login kembali.",
        );
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [handleLogout]);

  // Cek Sesi SessionStorage dengan aman tanpa cascading render
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = sessionStorage.getItem("local_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (e) {
          console.error("Gagal parse session user", e);
        }
      }
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.role === "admin",
    isExternal: user?.role === "eksternal",
    logout: handleLogout,
  };
}
