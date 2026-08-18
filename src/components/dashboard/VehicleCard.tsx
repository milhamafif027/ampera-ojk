"use client";

import React from "react";
import { Users, CheckCircle2, Clock, Wrench } from "lucide-react";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onOpenModal: (vehicle: Vehicle) => void;
}

export default function VehicleCard({
  vehicle,
  onOpenModal,
}: VehicleCardProps) {
  // Fungsi helper untuk menentukan warna & ikon berdasarkan status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Tersedia":
        return {
          style:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
          icon: <CheckCircle2 size={12} />,
        };
      case "Terpakai":
        return {
          style:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
          icon: <Clock size={12} />,
        };
      case "Perawatan":
        return {
          style:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
          icon: <Wrench size={12} />,
        };
      default:
        return {
          style:
            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
          icon: <Clock size={12} />,
        };
    }
  };

  const statusConfig = getStatusConfig(vehicle.status);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
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

          {/* Label Status Dinamis */}
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 flex items-center gap-1 ${statusConfig.style}`}
          >
            {statusConfig.icon}
            {vehicle.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <p className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" /> {vehicle.capacity}
          </p>
        </div>
      </div>

      <button
        onClick={() => onOpenModal(vehicle)}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
      >
        Pesan Unit Ini
      </button>
    </div>
  );
}
