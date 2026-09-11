"use client";

import React from "react";
import {
  Building2,
  MapPin,
  Coffee,
  Dumbbell,
  Compass,
  Landmark,
} from "lucide-react";

// Data card yang diadaptasi dari ringkasan Booklet Wisata & Profil OJK Sumsel
const highlightCards = [
  {
    id: 1,
    title: "Green Building OJK Sumsel",
    category: "Profil & Sejarah Kantor",
    description:
      "Gedung 8 lantai di Jl. Jend. Sudirman No. 1025 ini merupakan satu-satunya gedung bersertifikat Green Building kategori Gold di Sumatera Selatan[cite: 1].",
    icon: <Building2 className="w-5 h-5 text-[#9f1521] dark:text-rose-400" />,
    badge: "Fasilitas Utama",
    location: "Jl. Jend. Sudirman No. 1025",
  },
  {
    id: 2,
    title: "Work-Life Balance Area (Lantai 8)",
    category: "Fasilitas Internal KOPG",
    description:
      "Dilengkapi fasilitas mini golf dengan pemandangan Kota Palembang, ruang gym lengkap, studio band CETO, hingga area billiard[cite: 1].",
    icon: (
      <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    ),
    badge: "Area Rekreasi",
    location: "Lantai 8 Gedung KOPG",
  },
  {
    id: 3,
    title: "Wisata Kuliner Legendaris",
    category: "Kuliner & Oleh-Oleh",
    description:
      "Nikmati kelezatan Pindang Musi Rawas/Sarinande, Pempek Vico & Beringin, Martabak HAR, hingga berburu durian di Demang City[cite: 1].",
    icon: <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    badge: "Wajib Coba",
    location: "Kota Palembang",
  },
  {
    id: 4,
    title: "Jembatan Ampera & BKB",
    category: "Destinasi Wisata",
    description:
      "Menyusuri Sungai Musi menggunakan Musi Cruise, atau menikmati suasana malam di Benteng Kuto Besak (BKB)[cite: 1].",
    icon: <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    badge: "Ikon Kota",
    location: "Tepi Sungai Musi",
  },
  {
    id: 5,
    title: "Sultan Muda Sumsel Center (SMSC)",
    category: "Pusat Kolaborasi",
    description:
      "Berada di lantai 3 sebagai pusat inkubasi pembelajaran, business matching, dan pembinaan pengusaha muda di Sumatera Selatan[cite: 1].",
    icon: <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    badge: "Lantai 3 KOPG",
    location: "Kandang Kolaborasi",
  },
];

export default function SlidingCardsSection() {
  return (
    <div className="w-full py-2 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521] dark:text-rose-400 flex items-center gap-1.5">
            <Compass size={14} /> EKSPLORASI OJK & WONG KITO GALO
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-0.5">
            Informasi Kantor & Destinasi Pilihan
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:block">
          Geser untuk melihat info lainnya →
        </span>
      </div>

      {/* Container Card Berjalan / Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 custom-scrollbar px-1 snap-x">
        {highlightCards.map((card) => (
          <div
            key={card.id}
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between shrink-0 snap-start group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 rounded-full border border-rose-100 dark:border-rose-900/50">
                  {card.badge}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {card.category}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[180px]">
                <MapPin size={12} className="text-[#9f1521] shrink-0" />
                {card.location}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">
                OJK Sumsel
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
