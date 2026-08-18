"use client";

import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: string;
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="px-6 py-5 bg-[#9f1521] text-white flex justify-between items-center">
          <h3 className="font-bold text-base">Form Peminjaman Kendaraan</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-white/20 rounded-full cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100"
        >
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
              Pilih Kendaraan
            </label>
            <select
              value={formData.vehicleName}
              onChange={(e) =>
                setFormData({ ...formData, vehicleName: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer disabled:opacity-50"
              required
            >
              <option value="">-- Pilih Kendaraan --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.plateNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Nama Peminjam
              </label>
              <input
                type="text"
                value={formData.borrower}
                onChange={(e) =>
                  setFormData({ ...formData, borrower: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                placeholder="Contoh: Muhammad Ilham"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Satker
              </label>
              <input
                type="text"
                value={formData.dept}
                onChange={(e) =>
                  setFormData({ ...formData, dept: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                placeholder="Contoh: OJK Sumsel"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
              Kota / Lokasi Tujuan
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
              placeholder="Contoh: Kabupaten Lahat"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Tanggal Berangkat
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                Tanggal Kembali
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
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#9f1521] text-white rounded-xl font-bold hover:bg-[#7a1019] cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
