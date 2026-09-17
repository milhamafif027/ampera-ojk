"use client";

import React, { useState } from "react";
import { UserPlus, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "internal",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Gagal membuat akun baru.");

      onSuccess(`Akun ${newUser.name} berhasil ditambahkan ke sistem.`);
      setNewUser({ name: "", email: "", password: "", role: "internal" });
      onClose();
    } catch (error: any) {
      setModalError(error.message || "Terjadi kesalahan saat menyimpan akun.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserPlus size={18} className="text-rose-500" /> Tambah Akun
            Pengguna Baru
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-white/20 rounded-full cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100"
        >
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521]"
              placeholder="Contoh: Divisi Pengawasan"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
              Email Resmi
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521]"
              placeholder="nama@kopg.go.id"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
              Password Sementara
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521]"
              placeholder="Min. 6 karakter"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
              Role / Hak Akses
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer focus:border-[#9f1521]"
            >
              <option value="internal">Internal (Pegawai / Divisi)</option>
              <option value="admin">Admin (TIM LMSt)</option>
              <option value="eksternal">Eksternal (Tamu)</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Akun Baru"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
