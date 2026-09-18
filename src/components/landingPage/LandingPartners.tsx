"use client";

import React, { memo, useState } from "react";
import { Star, MapPin, Info, X, Phone } from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";

interface LandingPartnersProps {
  partners: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

function LandingPartners({
  partners,
  isLoading,
  itemVariants,
}: LandingPartnersProps) {
  // State untuk melihat detail/foto yang diperbesar
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    partner: any | null;
  }>({ isOpen: false, partner: null });

  // Render Kartu Partner (MUI Titlebar ImageListItem Style)
  const renderPartnerCard = (partner: any, index: number) => {
    // Item pertama dibuat lebih besar sebagai "Featured" (2x2 grid)
    const isFeatured = index === 0;
    const imgUrl =
      partner.img ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

    return (
      <motion.div
        variants={itemVariants}
        key={partner.id || index}
        className={`relative overflow-hidden rounded-2xl bg-slate-900 group shadow-md hover:shadow-xl transition-all cursor-pointer transform-gpu ${
          isFeatured
            ? "md:col-span-2 md:row-span-2 h-[300px] md:h-[620px]" // Kartu Utama Besar
            : "col-span-1 h-[300px]" // Kartu Standar
        }`}
        onClick={() => setLightbox({ isOpen: true, partner })}
      >
        {/* Gambar Full Cover */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt={partner.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradien Gelap dari bawah (MUI ImageListItemBar Style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Konten Titlebar Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between z-10 pointer-events-none">
          <div className="flex flex-col text-white min-w-0 pr-4">
            {/* Bintang Hotel */}
            <div className="flex items-center gap-0.5 mb-1.5 drop-shadow-md">
              {Array.from({ length: partner.stars || 4 }).map((_, i) => (
                <Star
                  key={i}
                  size={isFeatured ? 14 : 12}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            {/* Nama Hotel */}
            <h4
              className={`font-bold leading-tight truncate drop-shadow-md ${
                isFeatured ? "text-xl sm:text-3xl" : "text-base sm:text-lg"
              }`}
            >
              {partner.name}
            </h4>

            {/* Area / Lokasi */}
            <span
              className={`text-white/80 flex items-center gap-1.5 drop-shadow-md mt-1 font-medium truncate ${
                isFeatured ? "text-sm" : "text-[11px]"
              }`}
            >
              <MapPin size={isFeatured ? 16 : 14} className="shrink-0" />{" "}
              {partner.area || partner.address || "Palembang"}
            </span>
          </div>

          {/* Icon Info */}
          <button
            className="text-white/50 hover:text-white p-1.5 transition-colors shrink-0 pointer-events-auto"
            title="Lihat Detail"
          >
            <Info size={isFeatured ? 28 : 22} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.section
      id="hotel"
      variants={itemVariants}
      className="bg-slate-50 border-y border-slate-200 py-16 sm:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#9f1521] uppercase tracking-widest">
            Kemitraan Akomodasi
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Hotel Rekanan Resmi OJK
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
            Fasilitas akomodasi perhotelan terbaik yang telah menjalin kemitraan
            resmi untuk menunjang kegiatan dinas dan operasional.
          </p>
        </div>

        {/* GRID LAYOUT ALA MUI IMAGE LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[300px]">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`rounded-2xl bg-slate-200 animate-pulse ${
                  n === 1
                    ? "md:col-span-2 md:row-span-2 h-[300px] md:h-[620px]"
                    : "col-span-1 h-[300px]"
                }`}
              />
            ))
          ) : partners.length > 0 ? (
            partners.map((partner, index) => renderPartnerCard(partner, index))
          ) : (
            <div className="col-span-full text-center py-16 text-slate-400 text-sm font-medium italic bg-white rounded-3xl border border-slate-200 shadow-sm">
              Belum ada data hotel rekanan yang tersedia saat ini.
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL DETAIL & LIGHTBOX ================= */}
      <AnimatePresence>
        {lightbox.isOpen && lightbox.partner && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setLightbox({ isOpen: false, partner: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row transform-gpu"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bagian Kiri: Gambar Full */}
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-900 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    lightbox.partner.img ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={lightbox.partner.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bagian Kanan: Informasi Detail */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center space-y-6">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: lightbox.partner.stars || 4 }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className="fill-amber-400 text-amber-400"
                        />
                      ),
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {lightbox.partner.name}
                  </h3>
                  <span className="inline-block mt-2 px-3 py-1 bg-rose-50 text-[#9f1521] text-xs font-bold rounded-lg uppercase tracking-wider">
                    Mitra Resmi
                  </span>
                </div>

                <div className="space-y-4 text-sm font-medium text-slate-600">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={18}
                      className="text-slate-400 mt-0.5 shrink-0"
                    />
                    <span>
                      {lightbox.partner.address ||
                        lightbox.partner.area ||
                        "Alamat tidak tersedia"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400 shrink-0" />
                    <span>
                      {lightbox.partner.phone || "Kontak tidak tersedia"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                    <Info
                      size={18}
                      className="text-slate-400 mt-0.5 shrink-0"
                    />
                    <p className="leading-relaxed">
                      {lightbox.partner.description ||
                        "Tersedia rate khusus Corporate OJK. Silakan hubungi nomor di atas untuk reservasi kamar atau fasilitas lainnya."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setLightbox({ isOpen: false, partner: null })}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors mt-4"
                >
                  Tutup Detail
                </button>
              </div>

              {/* Tombol Silang Pojok Kanan Atas (Tampil di Mobile) */}
              <button
                onClick={() => setLightbox({ isOpen: false, partner: null })}
                className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/20 text-slate-800 md:text-white md:hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default memo(LandingPartners);
