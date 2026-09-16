"use client";

import React, { useMemo } from "react";
import {
  X,
  Loader2,
  MapPin,
  Users,
  CalendarDays,
  FileText,
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
    passengers?: string | number; // Field tambahan untuk jumlah penumpang
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
}

export default function VehicleBookingModal({
  isOpen,
  onClose,
  onSubmit,
  vehicles, // Tetap di-pass agar tidak error dari page.tsx, tapi tidak dipakai di tampilan
  formData,
  setFormData,
  isSubmitting,
}: VehicleBookingModalProps) {
  if (!isOpen) return null;

  // Nilai aman untuk borrower tanpa memicu cascading setState di useEffect
  const displayBorrower =
    formData.borrower === "Tamu Eksternal OJK" ? "" : formData.borrower;

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
          onSubmit={onSubmit}
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
                value={displayBorrower}
                onChange={(e) =>
                  setFormData({ ...formData, borrower: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                placeholder="Nama Lengkap"
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
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#9f1521] disabled:opacity-50 transition-colors"
                placeholder="Contoh: OJK Sumsel"
                required
              />
            </div>
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
              disabled={isSubmitting}
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
