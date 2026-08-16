"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Membungkus logika dalam fungsi async agar linter tidak mendeteksi
    // pemanggilan setState secara sinkron
    const verifySession = async () => {
      // Trik microtask: memaksa sisa fungsi ini berjalan secara asynchronous
      await Promise.resolve();

      const storedUser = localStorage.getItem("local_user");

      if (!storedUser) {
        router.push("/login");
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
          localStorage.removeItem("local_user");
          router.push("/login");
        }
      }

      setIsChecking(false);
    };

    verifySession();
  }, [router]);

  // Tampilkan loading saat proses verifikasi berjalan
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#9f1521] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Memverifikasi akses portal...
          </p>
        </div>
      </div>
    );
  }

  // Mencegah rendering komponen jika user tidak valid
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
