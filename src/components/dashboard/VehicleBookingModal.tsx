"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  X,
  Loader2,
  MapPin,
  Users,
  CalendarDays,
  FileText,
  Phone,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: string;
  category?: string;
}

interface VehicleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  vehicles: Vehicle[];
  formData: {
    vehicleName: string;
    destination: string;
    borrower: string;
    dept: string;
    startDate: string;
    endDate: string;
    purpose: string;
    passengers?: string | number;
    phone?: string; // TAMBAHAN: Field nomor handphone
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
}

export default function VehicleBookingModal({
  isOpen,
  onClose,
  onSubmit,
  vehicles,
  formData,
  setFormData,
  isSubmitting,
}: VehicleBookingModalProps) {
  // State untuk validasi nomor HP secara real-time
  const [phoneError, setPhoneError] = useState("");

  const localUserData = useMemo(() => {
    if (typeof window === "undefined")
      return { role: "eksternal", name: "", phone: "" };
    try {
      const stored =
        sessionStorage.getItem("local_user") ||
        localStorage.getItem("local_user");
      const parsed = stored ? JSON.parse(stored) : null;
      return {
        role: (parsed?.role || "eksternal").toLowerCase(),
        name: parsed?.name || "",
        phone: parsed?.phone || parsed?.no_hp || "",
      };
    } catch {
      return { role: "eksternal", name: "", phone: "" };
    }
  }, []);

  const isInternalOrAdmin =
    localUserData.role === "admin" || localUserData.role === "internal";

  useEffect(() => {
    if (isOpen) {
      setFormData((prev: any) => {
        const isDefaultName =
          prev.borrower === localUserData.name ||
          prev.borrower === "Admin Baru" ||
          prev.borrower === "Tamu Eksternal OJK";

        return {
          ...prev,
          borrower: isDefaultName ? "" : prev.borrower,
          dept: isInternalOrAdmin ? "OJK Sumsel" : prev.dept,
          phone: prev.phone || localUserData.phone || "",
        };
      });
      // Hapus baris setPhoneError("") dari sini untuk menghilangkan error linter
    }
  }, [isOpen, isInternalOrAdmin, localUserData, setFormData]);

  if (!isOpen) return null;

  const handleStartDateChange = (val: string) => {
    setFormData((prev: any) => {
      const nextEndDate =
        prev.endDate && prev.endDate < val ? val : prev.endDate;
      return {
        ...prev,
        startDate: val,
        endDate: nextEndDate || val,
      };
    });
  };

  // Handler khusus untuk validasi nomor HP
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, phone: numericValue });

    if (
      numericValue.length > 0 &&
      (numericValue.length < 11 || numericValue.length > 13)
    ) {
      setPhoneError(
        "Nomor tidak valid. Harus terdiri dari 11 - 13 digit angka.",
      );
    } else {
      setPhoneError("");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError || !formData.phone) {
      setPhoneError(
        "Nomor WhatsApp wajib diisi dengan format yang valid (11-13 digit).",
      );
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        <div className="px-6 py-5 bg-[#9f1521] text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-base">Request Kendaraan Dinas</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-white/20 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100 max-h-[75vh] overflow-y-auto custom-scrollbar"
        >
          {/* BANNER INFORMASI */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 font-medium">
            💡 <strong>Info:</strong> Silakan lengkapi detail perjalanan Anda.
            Armada kendaraan dan Driver akan ditentukan (di-plotting) oleh Admin
            setelah pengajuan disetujui.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Kota / Lokasi Tujuan
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                placeholder="Contoh: Kabupaten Lahat"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Users size={12} /> Jumlah Penumpang
              </label>
              <input
                type="number"
                min="1"
                value={formData.passengers || "1"}
                onChange={(e) =>
                  setFormData({ ...formData, passengers: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                placeholder="Contoh: 4"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={12} /> Tanggal Berangkat
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={12} /> Tanggal Kembali
              </label>
              <input
                type="date"
                min={
                  formData.startDate || new Date().toISOString().split("T")[0]
                }
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Nama Peminjam (PIC)
              </label>
              <input
                type="text"
                value={formData.borrower}
                onChange={(e) =>
                  setFormData({ ...formData, borrower: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                placeholder="Contoh: Muhammad Fadli"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Satker / Bagian
              </label>
              <input
                type="text"
                value={formData.dept}
                onChange={(e) =>
                  setFormData({ ...formData, dept: e.target.value })
                }
                disabled={isInternalOrAdmin || isSubmitting}
                className={`w-full p-3 rounded-xl outline-none focus:border-[#9f1521] transition-colors ${
                  isInternalOrAdmin
                    ? "opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                    : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                }`}
                placeholder={
                  isInternalOrAdmin ? "OJK Sumsel" : "Contoh: Instansi Luar"
                }
                required
              />
            </div>
          </div>

          {/* KOLOM NOMOR WHATSAPP / HP PEMOHON */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Phone size={12} /> Nomor WhatsApp / HP Pemohon
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={handlePhoneChange}
              disabled={isSubmitting}
              className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors ${
                phoneError
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              placeholder="Contoh: 081234567890"
              required
            />
            {phoneError && (
              <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                <AlertCircle size={12} /> {phoneError}
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <FileText size={12} /> Keperluan / Keterangan
            </label>
            <textarea
              rows={2}
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] resize-none disabled:opacity-50 transition-colors"
              placeholder="Contoh: Membawa dokumen penting, butuh mobil dengan bagasi luas."
              required
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!phoneError}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#9f1521] text-white hover:bg-[#7a1019] rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 transition-colors shadow-md"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
