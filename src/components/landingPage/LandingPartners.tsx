"use client";

import React from "react";
import { Star } from "lucide-react";
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
  return (
    <motion.section
      id="hotel"
      variants={itemVariants}
      className="bg-slate-100/70 border-y border-slate-200 py-16"
    >
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div>
          <span className="text-xs font-bold text-[#9f1521] uppercase tracking-widest">
            Kemitraan Akomodasi
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Hotel Rekanan Resmi OJK
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl h-64 animate-pulse border"
              />
            ))
          ) : partners.length > 0 ? (
            partners.map((h, i) => (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                key={h.id || i}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-xl"
              >
                <div className="h-32 w-full bg-slate-200 overflow-hidden group">
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
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />{" "}
                    {h.stars || 4} Stars
                  </span>
                  <h4 className="font-bold text-sm text-slate-800">{h.name}</h4>
                  <p className="text-xs text-slate-400">
                    {h.area || h.address || "Palembang"}
                  </p>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <p className="text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                    {h.phone || "Kontak tidak tersedia"}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs italic bg-white rounded-3xl border border-slate-200">
              Belum ada data hotel rekanan.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
