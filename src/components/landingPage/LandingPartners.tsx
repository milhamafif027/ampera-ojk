"use client";

import React, { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface LandingPartnersProps {
  partners: any[];
  isLoading: boolean;
  itemVariants: Variants;
}

export default function LandingPartners({
  partners,
  isLoading,
  itemVariants,
}: LandingPartnersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.section
      id="hotel"
      variants={itemVariants}
      className="bg-slate-100/70 border-y border-slate-200 py-12 sm:py-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#9f1521] uppercase tracking-widest">
              Kemitraan Akomodasi
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Hotel Rekanan Resmi OJK
            </h2>
          </div>

          {/* Tombol Navigasi Geser Kiri / Kanan */}
          {!isLoading && partners.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scroll("left")}
                className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-sm"
                title="Geser Kiri"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-sm"
                title="Geser Kanan"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Wadah Scroll Horizontal */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "thin" }}
        >
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200 min-w-[260px] sm:min-w-[280px] max-w-[300px] shrink-0"
              />
            ))
          ) : partners.length > 0 ? (
            partners.map((h, i) => (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                key={h.id || i}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-xl min-w-[260px] sm:min-w-[280px] max-w-[300px] shrink-0 snap-start"
              >
                <div className="h-32 sm:h-36 w-full bg-slate-200 overflow-hidden group relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      h.img ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={h.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />{" "}
                      {h.stars || 4} Stars
                    </span>
                    <h4
                      className="font-bold text-sm text-slate-800 truncate"
                      title={h.name}
                    >
                      {h.name}
                    </h4>
                    <p
                      className="text-xs text-slate-400 truncate"
                      title={h.area || h.address || "Palembang"}
                    >
                      {h.area || h.address || "Palembang"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2">
                    <p
                      className="text-xs font-semibold text-slate-600 truncate"
                      title={h.phone || "Kontak tidak tersedia"}
                    >
                      {h.phone || "Kontak tidak tersedia"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="w-full text-center py-10 text-slate-400 text-xs italic bg-white rounded-3xl border border-slate-200 shadow-sm">
              Belum ada data hotel rekanan.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
