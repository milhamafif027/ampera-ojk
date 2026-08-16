"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Lock,
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserItem {
  id: number | string;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function KelolaAkunPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State untuk modal ganti password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State toggle mata
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State alert sukses/gagal yang lebih terpusat
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    type: "success",
  });

  // State pesan error khusus di dalam modal
  const [modalError, setModalError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      const result = await res.json();

      if (res.ok && result.data) {
        setUsers(result.data);
      } else {
        setUsers([
          {
            id: 1,
            name: "Administrator OJK",
            email: "admin@timlms.com",
            role: "admin",
            nip: "19850101...",
          },
          {
            id: 2,
            name: "Pegawai Internal Sumsel",
            email: "internal@ojk.go.id",
            role: "internal",
            nip: "19920304...",
          },
          {
            id: 3,
            name: "Tamu Eksternal Vendor",
            email: "eksternal@vendor.com",
            role: "eksternal",
          },
        ]);
      }
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      fetchUsers();
    };
    init();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenPasswordModal = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setModalError("");
    setIsPasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalError("");

    if (newPassword !== confirmPassword) {
      setModalError("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setModalError("Password minimal harus terdiri dari 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
          adminRole: "admin",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal memperbarui password di database",
        );
      }

      setIsPasswordModalOpen(false);
      setAlertInfo({
        isOpen: true,
        message: `Password untuk akun ${selectedUser.name} (${selectedUser.role}) berhasil diubah.`,
        type: "success",
      });
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      setModalError(
        error.message || "Terjadi kesalahan saat memproses ganti password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Alert Notifikasi Global */}
      {alertInfo.isOpen && (
        <div className="p-4 rounded-2xl border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{alertInfo.message}</span>
          </div>
          <button
            onClick={() => setAlertInfo({ ...alertInfo, isOpen: false })}
            className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-[#9f1521]" size={22} /> Kelola Akun & Hak
            Akses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Pusat kontrol admin untuk memantau daftar pengguna dan mereset sandi
            akun internal maupun eksternal.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Cari nama, email, atau role pengguna..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100 shadow-sm"
        />
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
              <th className="p-3">Nama Pengguna</th>
              <th className="p-3">Email / Kontak</th>
              <th className="p-3">NIP / Identitas</th>
              <th className="p-3 text-center">Hak Akses (Role)</th>
              <th className="p-3 text-center">Aksi Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-[#9f1521] dark:text-rose-300 flex items-center justify-center font-black text-xs shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-slate-500">{u.nip || "-"}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        u.role === "admin"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                          : u.role === "internal" || u.role === "internal_kopg"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenPasswordModal(u)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors shadow-sm cursor-pointer"
                    >
                      <Lock size={13} /> Ganti Password
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-slate-400 italic"
                >
                  Tidak ada data pengguna yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL GANTI PASSWORD OLEH ADMIN */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  KONTROL ADMIN SUPERIOR
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Ganti Sandi Pengguna
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs space-y-1">
              <p className="text-slate-500">Target Akun:</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {selectedUser.name} ({selectedUser.email})
              </p>
              <p className="text-[10px] uppercase font-extrabold text-[#9f1521]">
                Role: {selectedUser.role}
              </p>
            </div>

            {/* Pesan Error di dalam Modal jika ada gagal */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form
              onSubmit={handleChangePasswordSubmit}
              className="space-y-4 text-xs font-medium"
            >
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Sandi Baru"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
