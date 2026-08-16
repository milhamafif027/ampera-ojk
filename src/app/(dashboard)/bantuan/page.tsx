"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HelpCircle,
  Monitor,
  Wifi,
  Camera,
  Phone,
  MessageCircle,
  Coffee,
  Utensils,
  Search,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

interface VendorItem {
  id: number | string;
  name: string;
  category: "snack" | "katering";
  phone: string;
  displayPhone?: string;
}

export default function BantuanPage() {
  const [activeVendorTab, setActiveVendorTab] = useState<"snack" | "katering">(
    "snack",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Data Support IT / Internal Helpdesk (Statis/Standar Gedung OJK)
  const itHelpdeskServices = [
    {
      title: "Komputer & Hardware",
      desc: "Penanganan gangguan PC kerja, printer, scanner, proyektor, dan peripheral kantor.",
      icon: Monitor,
      ext: "Ext: 1025 / 1026",
    },
    {
      title: "Jaringan & Wi-Fi",
      desc: "Troubleshooting koneksi LAN, akses Wi-Fi internal/tamu, dan konfigurasi VPN OJK.",
      icon: Wifi,
      ext: "Ext: 1027",
    },
    {
      title: "Multimedia & Zoom",
      desc: "Dukungan pengaturan audio/video rapat, sound system ballroom, dan lisensi Zoom.",
      icon: Camera,
      ext: "Ext: 1028",
    },
    {
      title: "Layanan Telepon Internal",
      desc: "Bantuan sambungan interkom gedung, ext antar-satker, dan komunikasi darurat.",
      icon: Phone,
      ext: "Ext: 1000",
    },
  ];

  // Fetch Vendor dari API Database MySQL
  const fetchVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vendors?category=${activeVendorTab}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setVendors(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data vendor:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeVendorTab]);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      fetchVendors();
    };
    initData();
  }, [fetchVendors]);

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 1. HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-[#9f1521]" size={22} /> Pusat Bantuan &
            Vendor Rekanan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Layanan dukungan teknis IT, perlengkapan rapat, serta referensi
            vendor konsumsi terdaftar database OJK Sumsel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVendors}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data Vendor"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold text-[#9f1521] dark:text-rose-400 shrink-0">
            <ShieldCheck size={16} /> TIM LMSt SUPPORT
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. HELPDESK & IT SUPPORT */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <HelpCircle className="text-[#9f1521]" size={20} /> Bantuan Teknis
              IT & Operasional
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Layanan bantuan cepat untuk kendala fasilitas rapat & kerja
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itHelpdeskServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 rounded-lg">
                        <Icon size={16} />
                      </div>
                      <span>{service.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#9f1521] dark:text-rose-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 inline-block w-fit">
                    {service.ext}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. VENDOR KONSUMSI TERDAFTAR (Dinamis dari Database) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Coffee className="text-[#9f1521]" size={20} /> Vendor Konsumsi
                Terdaftar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Referensi pesanan snack & katering kegiatan kantor dari database
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 shrink-0">
              <button
                onClick={() => setActiveVendorTab("snack")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeVendorTab === "snack"
                    ? "bg-white dark:bg-slate-700 text-[#9f1521] dark:text-rose-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Coffee size={14} /> Snack
              </button>
              <button
                onClick={() => setActiveVendorTab("katering")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeVendorTab === "katering"
                    ? "bg-white dark:bg-slate-700 text-[#9f1521] dark:text-rose-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Utensils size={14} /> Katering
              </button>
            </div>
          </div>

          {/* Search Box Vendor */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari nama vendor atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* List Vendor dari Database */}
          <div className="space-y-3 min-h-[220px]">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                Memuat data vendor dari database MySQL...
              </div>
            ) : filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => {
                const cleanPhone = vendor.phone
                  ? vendor.phone.replace(/\D/g, "")
                  : "";
                const displayPhone = vendor.displayPhone || vendor.phone || "-";

                return (
                  <div
                    key={vendor.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {vendor.name}
                      </p>
                      <p className="text-[10px] font-semibold text-[#9f1521] dark:text-rose-400 uppercase tracking-wider">
                        {vendor.category}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
                        📞 {displayPhone}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(
                        vendor.name,
                      )},%20saya%20dari%20OJK%20Sumsel%20ingin%20menanyakan%20pemesanan%20konsumsi.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                Tidak ditemukan vendor {activeVendorTab} yang sesuai di
                database.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
