"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Utensils,
  PhoneCall,
  Building,
  ExternalLink,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

interface VendorItem {
  id: number | string;
  name: string;
  category: "snack" | "katering";
  phone: string;
}

// Varianta animasi kontainer (stagger berurutan)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Varianta animasi elemen anak masuk dari bawah
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function QuickHelp() {
  const [activeTab, setActiveTab] = useState<"snack" | "katering">("snack");
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil data vendor dari database berdasarkan tab aktif
  useEffect(() => {
    let isMounted = true;

    const fetchVendors = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/vendors?category=${activeTab}`);
        const result = await res.json();
        if (isMounted && res.ok && result.success) {
          setVendors(result.data);
        }
      } catch (error) {
        console.error("Gagal memuat vendor:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVendors();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  return (
    <motion.section
      id="bantuan"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={containerVariants}
      className="max-w-7xl mx-auto px-6 py-20 w-full space-y-12"
    >
      <motion.div
        variants={itemVariants}
        className="text-center max-w-2xl mx-auto space-y-3"
      >
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          Pusat Bantuan & Layanan Pendukung
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Kontak bantuan teknis operasional dan informasi referensi vendor
          konsumsi terdaftar di database.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kartu Bantuan Teknis IT & Ruangan */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 transition-shadow duration-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-rose-50 text-[#9f1521] rounded-xl">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              Bantuan Teknis IT & Ruangan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Building className="w-4 h-4 text-[#9f1521]" /> Komputer &
                Hardware
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Troubleshooting perangkat kerja kantor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <PhoneCall className="w-4 h-4 text-[#9f1521]" /> Jaringan &
                Wi-Fi
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gangguan koneksi LAN, Wi-Fi & VPN.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <ExternalLink className="w-4 h-4 text-[#9f1521]" /> Dokumentasi
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dukungan media & liputan acara.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Headphones className="w-4 h-4 text-[#9f1521]" /> Helpdesk
                Internal
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ext: 1025 / Layanan umum OJK.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Kartu Referensi Vendor Konsumsi (Dinamis Database) */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between transition-shadow duration-300 hover:shadow-md"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-[#9f1521] rounded-xl">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  Referensi Vendor Konsumsi
                </h3>
              </div>

              {/* Tab Selector Snack / Katering */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("snack")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    activeTab === "snack"
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Snack
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("katering")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    activeTab === "katering"
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Katering
                </button>
              </div>
            </div>

            {/* List Daftar Vendor */}
            <div className="space-y-3 min-h-[160px] transition-opacity duration-300">
              {isLoading ? (
                <div className="py-10 text-center text-xs text-slate-400 italic animate-pulse">
                  Memuat data vendor dari database...
                </div>
              ) : vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between transition-all duration-200 hover:bg-slate-100/80 hover:translate-x-1"
                  >
                    <span className="font-bold text-xs text-slate-800">
                      {vendor.name}
                    </span>
                    <a
                      href={`tel:${vendor.phone.replace(/\s+/g, "")}`}
                      className="text-xs font-bold text-[#9f1521] hover:underline flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 transition-transform active:scale-95"
                    >
                      📞 {vendor.phone}
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 italic">
                  Belum ada data vendor {activeTab} terdaftar di database.
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-4">
            * Hubungi vendor langsung untuk pemesanan konsumsi kegiatan rapat
            atau acara kedinasan OJK Sumsel.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
