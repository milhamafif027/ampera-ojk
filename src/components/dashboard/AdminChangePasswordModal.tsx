"use client";

import React, { useState } from "react";
import { X, Lock, CheckCircle2 } from "lucide-react";

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number | string;
    name: string;
    email: string;
    role: string;
  } | null;
  adminRole: string;
}

export default function AdminChangePasswordModal({
  isOpen,
  onClose,
  targetUser,
  adminRole,
}: AdminChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password minimal harus terdiri dari 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          newPassword: newPassword,
          adminRole: adminRole,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengubah password");
      }

      alert(
        `Password untuk akun ${targetUser.name} (${targetUser.role}) berhasil diubah!`,
      );
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
              KONTROL ADMIN SUPERIOR
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Ganti Password Pengguna
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs space-y-1">
          <p className="text-slate-500">Mengubah sandi untuk:</p>
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {targetUser.name} ({targetUser.email})
          </p>
          <p className="text-[10px] uppercase font-extrabold text-[#9f1521]">
            Role: {targetUser.role}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
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
                type="password"
                required
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521]"
              />
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
                type="password"
                required
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold transition-colors shadow-sm"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
