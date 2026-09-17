"use client";

import React, { useMemo, useState } from "react";
import {
  Tag,
  Car,
  Shield,
  Wrench,
  CheckCircle2,
  Search,
  Truck,
  Bike,
} from "lucide-react";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
  category?: "Khusus Pimpinan" | "Operasional" | string;
}

interface VehicleShowcaseGridProps {
  vehicles: Vehicle[];
}

export default function VehicleShowcaseGrid({
  vehicles,
}: VehicleShowcaseGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Helper untuk memilih ikon berdasarkan jenis/kapasitas kendaraan
  const getVehicleIcon = (typeStr: string) => {
    const lower = (typeStr || "").toLowerCase();
    if (lower.includes("motor"))
      return <Bike size={18} className="text-[#9f1521]" />;
    if (lower.includes("pickup") || lower.includes("box"))
      return <Truck size={18} className="text-[#9f1521]" />;
    return <Car size={18} className="text-[#9f1521]" />;
  };

  // Filter kendaraan berdasarkan kategori dan pencarian nama/plat
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesCategory =
        selectedCategory === "Semua" ||
        (v.category &&
          v.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.capacity.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [vehicles, selectedCategory, searchQuery]);

  const categories = ["Semua", "Operasional", "Khusus Pimpinan"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#9f1521] font-extrabold text-[10px] tracking-widest uppercase mb-1">
            <Shield size={13} /> Direktori Armada Resmi OJK Sumsel
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Katalog Kendaraan Dinas ({vehicles.length} Unit)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Daftar unit armada operasional dan pimpinan yang terdaftar di
            sistem.
          </p>
        </div>

        {/* PENCARIAN & FILTER KATEGORI */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mobil / plat..."
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-[#9f1521] transition-colors w-48 sm:w-56"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white dark:bg-slate-900 text-[#9f1521] dark:text-rose-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID KARTU KENDARAAN */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((v) => {
            const isAvailable = v.status.toLowerCase() === "tersedia";
            const isMaintenance = v.status.toLowerCase() === "perawatan";

            return (
              <div
                key={v.id}
                className="group relative bg-slate-50/60 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 hover:border-[#9f1521]/40 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                {/* BAGIAN ATAS: KATEGORI & STATUS */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/50">
                    {v.category || "Operasional"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : isMaintenance
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isAvailable ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Wrench size={11} />
                    )}
                    {v.status}
                  </span>
                </div>

                {/* BAGIAN TENGAH: NAMA & PLAT NOMOR */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {getVehicleIcon(v.capacity)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-snug">
                        {v.name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 bg-slate-200/70 dark:bg-slate-700/60 rounded font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        <Tag size={11} className="text-[#9f1521]" />
                        {v.plateNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BAGIAN BAWAH: SPESIFIKASI / JENIS */}
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Jenis Unit:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {v.capacity}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center space-y-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Car size={32} className="mx-auto text-slate-400 opacity-50" />
          <p className="text-xs text-slate-500 font-medium">
            Tidak ada kendaraan yang sesuai dengan filter atau kata kunci
            pencarian.
          </p>
        </div>
      )}
    </div>
  );
}
