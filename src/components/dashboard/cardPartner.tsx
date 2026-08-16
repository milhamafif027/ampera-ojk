"use client";

import React from "react";
import { Star, MapPin, Phone, Pencil, Trash2, Hotel } from "lucide-react";

interface HotelPartner {
  id: number | string;
  name: string;
  stars: number;
  area: string;
  phone: string;
  address?: string;
  description?: string;
  img?: string;
}

interface CardPartnerProps {
  hotel: HotelPartner;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardPartner({
  hotel,
  isAdmin,
  onEdit,
  onDelete,
}: CardPartnerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
      <div className="h-40 w-full overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            hotel.img ||
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          }
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 inline-flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />{" "}
            {hotel.stars} Bintang
          </span>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onEdit}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Edit Kemitraan"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Hapus Kemitraan"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
            {hotel.name}
          </h3>
          <p className="text-xs text-[#9f1521] dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
            <MapPin size={13} /> {hotel.area}
          </p>
        </div>

        {hotel.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium flex-grow">
            {hotel.description}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <a
            href={`tel:${hotel.phone.replace(/\s+/g, "")}`}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#9f1521] flex items-center gap-1.5 transition-colors"
          >
            <Phone size={14} className="text-[#9f1521]" /> {hotel.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
