"use client";

import React from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  Pencil,
  ShieldAlert,
} from "lucide-react";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
  category?: "Khusus Pimpinan" | "Operasional" | string;
  img?: string;
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  user: LocalUser | null;
  onOpenModal: (vehicle: Vehicle) => void;
  onOpenEditModal: (vehicle: Vehicle) => void;
}

export default function VehicleCard({
  vehicle,
  isAdmin,
  user,
  onOpenModal,
  onOpenEditModal,
}: VehicleCardProps) {
  const isLeaderCar = vehicle.category === "Khusus Pimpinan";

  // Fungsi helper untuk menentukan warna & ikon berdasarkan status / kategori
  const getStatusConfig = (status: string) => {
    if (isLeaderCar) {
      return {
        style:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300",
        icon: <ShieldAlert size={12} />,
        label: "KENDARAAN PIMPINAN",
      };
    }
    switch (status) {
      case "Tersedia":
        return {
          style:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
          icon: <CheckCircle2 size={12} />,
          label: "TERSEDIA",
        };
      case "Terpakai":
        return {
          style:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
          icon: <Clock size={12} />,
          label: "TERPAKAI",
        };
      case "Perawatan":
        return {
          style:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
          icon: <Wrench size={12} />,
          label: "PERAWATAN",
        };
      default:
        return {
          style:
            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
          icon: <Clock size={12} />,
          label: status.toUpperCase(),
        };
    }
  };

  const statusConfig = getStatusConfig(vehicle.status);

  return (
    <div
      className={`border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md w-full ${
        isLeaderCar
          ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      }`}
    >
      <div>
        {/* Opsional: Tampilkan foto kendaraan jika tersedia di database dengan Lazy Loading */}
        {vehicle.img ? (
          <div className="relative h-40 w-full bg-slate-950 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vehicle.img}
              alt={vehicle.name}
              width={600}
              height={160}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {vehicle.plateNumber}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                  {vehicle.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Tombol Edit Khusus Admin */}
                {isAdmin && (
                  <button
                    onClick={() => onOpenEditModal(vehicle)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title="Edit Kendaraan"
                  >
                    <Pencil size={13} />
                  </button>
                )}

                {/* Label Status Dinamis */}
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 flex items-center gap-1 ${statusConfig.style}`}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <p className="flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />{" "}
                {vehicle.capacity}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        {isLeaderCar ? (
          <div className="w-full py-2.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold text-center border border-amber-200 dark:border-amber-900">
            Khusus Operasional Pimpinan
          </div>
        ) : (
          <button
            onClick={() => onOpenModal(vehicle)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Pesan Unit Ini
          </button>
        )}
      </div>
    </div>
  );
}
