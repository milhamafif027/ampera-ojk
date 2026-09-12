"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Menit

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State baru untuk menampilkan modal peringatan habis sesi
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      // Panggil API backend untuk menghapus token di database dan membersihkan cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Gagal memanggil API logout:", err);
    } finally {
      // Bersihkan penyimpanan lokal
      sessionStorage.removeItem("local_user");
      localStorage.removeItem("local_user");

      // Arahkan kembali ke halaman login
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  // Efek Inaktivitas 30 Menit
  useEffect(() => {
    const stored = sessionStorage.getItem("local_user");
    if (!stored) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsSessionExpired(true);
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = sessionStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Gagal parse session", e);
        }
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    loading,
    isSessionExpired,
    logout: handleLogout,
  };
}
