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
  Edit3,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface VendorItem {
  id: number | string;
  name: string;
  category: "snack" | "katering";
  phone: string;
  address?: string;
  displayPhone?: string;
}

interface ItServiceItem {
  id: string;
  title: string;
  desc: string;
  icon: any;
  ext: string;
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  dept?: string;
}

export default function BantuanPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [activeVendorTab, setActiveVendorTab] = useState<"snack" | "katering">(
    "snack",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Data IT Support
  const [itServices, setItServices] = useState<ItServiceItem[]>([
    {
      id: "it-1",
      title: "Komputer & Hardware",
      desc: "Penanganan gangguan PC kerja, printer, scanner, proyektor, dan peripheral kantor.",
      icon: Monitor,
      ext: "Ext: 1025 / 1026",
    },
    {
      id: "it-2",
      title: "Jaringan & Wi-Fi",
      desc: "Troubleshooting koneksi LAN, akses Wi-Fi internal/tamu, dan konfigurasi VPN OJK.",
      icon: Wifi,
      ext: "Ext: 1027",
    },
    {
      id: "it-3",
      title: "Multimedia & Zoom",
      desc: "Dukungan pengaturan audio/video rapat, sound system ballroom, dan lisensi Zoom.",
      icon: Camera,
      ext: "Ext: 1028",
    },
    {
      id: "it-4",
      title: "Layanan Telepon Internal",
      desc: "Bantuan sambungan interkom gedung, ext antar-satker, dan komunikasi darurat.",
      icon: Phone,
      ext: "Ext: 1000",
    },
  ]);

  // State Modal Edit IT Support
  const [isEditItModalOpen, setIsEditItModalOpen] = useState(false);
  const [selectedItService, setSelectedItService] =
    useState<ItServiceItem | null>(null);
  const [itExtInput, setItExtInput] = useState("");

  // State Modal Kelola Vendor (Tambah / Edit Vendor)
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    category: "snack" as "snack" | "katering",
    phone: "",
    address: "",
  });

  // State Modal Konfirmasi Hapus Vendor
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vendorId: number | string | null;
    vendorName: string;
  }>({
    isOpen: false,
    vendorId: null,
    vendorName: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });

  // 1. Ambil Session User saat halaman dimuat
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = user?.role === "admin";

  // Fetch Vendor dari API Database MySQL dengan Loading State
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
    const timer = setTimeout(() => {
      fetchVendors();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchVendors]);

  // Handler Simpan Perubahan Ext IT Helpdesk
  const handleSaveItExt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItService) return;

    setItServices((prev) =>
      prev.map((item) =>
        item.id === selectedItService.id ? { ...item, ext: itExtInput } : item,
      ),
    );
    setIsEditItModalOpen(false);
    setSuccessModal({
      isOpen: true,
      message: "Nomor Extension IT berhasil diperbarui.",
    });
  };

  // Handler Submit Tambah / Edit Vendor
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingVendor ? "PUT" : "POST";
      const payload = editingVendor
        ? { id: editingVendor.id, ...vendorForm }
        : { ...vendorForm };

      const res = await fetch("/api/vendors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data vendor");

      setIsVendorModalOpen(false);
      setEditingVendor(null);
      setVendorForm({
        name: "",
        category: activeVendorTab,
        phone: "",
        address: "",
      });
      setSuccessModal({
        isOpen: true,
        message: editingVendor
          ? "Data vendor berhasil diperbarui."
          : "Vendor baru berhasil ditambahkan.",
      });
      fetchVendors();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Konfirmasi Eksekusi Hapus Vendor
  const handleConfirmDelete = async () => {
    if (!deleteModal.vendorId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vendors?id=${deleteModal.vendorId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus vendor");

      setDeleteModal({ isOpen: false, vendorId: null, vendorName: "" });
      setSuccessModal({
        isOpen: true,
        message: "Vendor berhasil dihapus dari database.",
      });
      fetchVendors();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus vendor.");
    } finally {
      setIsDeleting(false);
    }
  };

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
            disabled={isLoading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold text-[#9f1521] dark:text-rose-400 shrink-0">
            <ShieldCheck size={16} /> TIM LMSt SUPPORT{" "}
            {isAdmin && "(ADMIN MODE)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. HELPDESK & IT SUPPORT */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <HelpCircle className="text-[#9f1521]" size={20} /> Bantuan
                Teknis IT & Operasional
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Layanan bantuan cepat untuk kendala fasilitas rapat & kerja
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between relative group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 rounded-lg">
                          <Icon size={16} />
                        </div>
                        <span>{service.title}</span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedItService(service);
                            setItExtInput(service.ext);
                            setIsEditItModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Edit Ext"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
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

        {/* 3. VENDOR KONSUMSI TERDAFTAR */}
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

            <div className="flex items-center gap-2">
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

              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingVendor(null);
                    setVendorForm({
                      name: "",
                      category: activeVendorTab,
                      phone: "",
                      address: "",
                    });
                    setIsVendorModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Tambah Vendor Baru"
                >
                  <Plus size={14} /> Tambah
                </button>
              )}
            </div>
          </div>

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

          {/* List Vendor dengan Indikator Loading */}
          <div className="space-y-3 min-h-[220px]">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 italic">
                <Loader2 size={24} className="animate-spin text-[#9f1521]" />
                <span>Memuat data vendor dari database MySQL...</span>
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
                        📞 {displayPhone}{" "}
                        {vendor.address ? `• 📍 ${vendor.address}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
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

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingVendor(vendor);
                              setVendorForm({
                                name: vendor.name,
                                category: vendor.category,
                                phone: vendor.phone,
                                address: vendor.address || "",
                              });
                              setIsVendorModalOpen(true);
                            }}
                            className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="Edit Vendor"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                vendorId: vendor.id,
                                vendorName: vendor.name,
                              })
                            }
                            className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Vendor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* MODAL EDIT EXTENSION IT */}
      {isEditItModalOpen && isAdmin && selectedItService && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Edit Ext: {selectedItService.title}
              </h3>
              <button
                onClick={() => setIsEditItModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItExt} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Nomor Extension
                </label>
                <input
                  type="text"
                  value={itExtInput}
                  onChange={(e) => setItExtInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white"
                  placeholder="Contoh: Ext: 1050"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditItModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT VENDOR */}
      {isVendorModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingVendor ? "Edit Data Vendor" : "Tambah Vendor Baru"}
              </h3>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVendorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Nama Vendor / Toko
                </label>
                <input
                  type="text"
                  value={vendorForm.name}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, name: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white"
                  placeholder="Contoh: Dapur Ibu Catering"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Kategori
                </label>
                <select
                  value={vendorForm.category}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      category: e.target.value as "snack" | "katering",
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer text-slate-800 dark:text-white"
                >
                  <option value="snack">Snack</option>
                  <option value="katering">Katering</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="text"
                  value={vendorForm.phone}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, phone: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white"
                  placeholder="Contoh: 081234567890"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Alamat (Opsional)
                </label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, address: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white"
                  placeholder="Contoh: Jl. Demang Lebar Daun"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {isSubmitting ? "Menyimpan..." : "Simpan Vendor"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS VENDOR */}
      {deleteModal.isOpen && isAdmin && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hapus Vendor?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.vendorName}
                </strong>{" "}
                dari daftar rekanan?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    vendorId: null,
                    vendorName: "",
                  })
                }
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Berhasil!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {successModal.message}
              </p>
            </div>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: "" })}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
