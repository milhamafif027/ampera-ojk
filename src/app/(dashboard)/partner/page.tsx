"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Hotel,
  RefreshCw,
  Search,
  Plus,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import CardPartner from "@/components/dashboard/cardPartner";

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

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function PartnerPage() {
  const [partners, setPartners] = useState<HotelPartner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<LocalUser | null>(null);

  // State Modal (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Konfirmasi Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    stars: 4,
    area: "",
    phone: "",
    address: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/partners");
      const result = await res.json();

      if (res.ok && result.data) {
        setPartners(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data hotel rekanan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca user session:", err);
        }
      }
      fetchPartners();
    };

    initData();
  }, [fetchPartners]);

  const isAdmin = user?.role === "admin";

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({
      name: "",
      stars: 4,
      area: "",
      phone: "",
      address: "",
      description: "",
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: HotelPartner) => {
    setIsEditMode(true);
    setCurrentId(hotel.id);
    setFormData({
      name: hotel.name,
      stars: hotel.stars,
      area: hotel.area,
      phone: hotel.phone,
      address: hotel.address || "",
      description: hotel.description || "",
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      if (isEditMode && currentId) {
        data.append("id", String(currentId));
      }
      data.append("name", formData.name);
      data.append("stars", String(formData.stars));
      data.append("area", formData.area);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      data.append("description", formData.description);

      if (selectedFile) {
        data.append("image", selectedFile);
      }

      const res = await fetch("/api/partners", {
        method: isEditMode ? "PUT" : "POST",
        body: data,
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPartners();
      } else {
        alert("Gagal menyimpan data hotel rekanan.");
      }
    } catch (error) {
      console.error("Error saving partner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi memicu modal hapus
  const promptDelete = (id: number | string, name: string) => {
    setItemToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  // Fungsi konfirmasi hapus data
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/partners?id=${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchPartners();
      } else {
        alert("Gagal menghapus data hotel rekanan.");
      }
    } catch (error) {
      console.error("Error deleting partner:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const inputClassName =
    "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#9f1521] outline-none text-slate-800 dark:text-slate-100 shadow-sm transition-colors";
  const labelClassName =
    "text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1.5 block tracking-wider uppercase";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hotel className="text-[#9f1521]" size={22} /> Kemitraan Hotel
            Rekanan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Daftar akomodasi hotel mitra resmi Kantor OJK Provinsi Sumatera
            Selatan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Tambah Kemitraan
            </button>
          )}

          <button
            onClick={fetchPartners}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Cari nama hotel, area, atau jalan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100 shadow-sm"
        />
      </div>

      {/* GRID KATALOG HOTEL REKANAN MENGGUNAKAN CardPartner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.length > 0 ? (
          filteredPartners.map((hotel) => (
            <CardPartner
              key={hotel.id}
              hotel={hotel}
              isAdmin={isAdmin}
              onEdit={() => openEditModal(hotel)}
              onDelete={() => promptDelete(hotel.id, hotel.name)}
            />
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400 italic">
            {isLoading
              ? "Memuat data hotel rekanan dari MySQL..."
              : "Tidak ditemukan hotel rekanan yang sesuai dengan pencarian."}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT KEMITRAAN */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 bg-gradient-to-br from-[#9f1521] to-[#7a1019] text-white flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black tracking-tight">
                {isEditMode
                  ? "Edit Hotel Rekanan"
                  : "Tambah Hotel Rekanan Baru"}
              </h2>
              <button
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors bg-white/10 cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 overflow-y-auto flex-1 space-y-4"
            >
              <div>
                <label className={labelClassName}>Nama Hotel</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`${inputClassName} disabled:opacity-50`}
                  placeholder="Contoh: Hotel Aryaduta Palembang"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>Bintang</label>
                  <select
                    name="stars"
                    value={formData.stars}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`${inputClassName} disabled:opacity-50`}
                  >
                    <option value={3}>3 Bintang</option>
                    <option value={4}>4 Bintang</option>
                    <option value={5}>5 Bintang</option>
                  </select>
                </div>
                <div>
                  <label className={labelClassName}>Area / Wilayah</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`${inputClassName} disabled:opacity-50`}
                    placeholder="Contoh: Ilir Timur I"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`${inputClassName} disabled:opacity-50`}
                    placeholder="0711-xxxxxx"
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    Upload Foto (JPG / PNG)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    disabled={isSubmitting}
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-[#9f1521] hover:file:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>Alamat Lengkap</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`${inputClassName} disabled:opacity-50`}
                  placeholder="Jl. POM IX, Palembang"
                />
              </div>

              <div>
                <label className={labelClassName}>Deskripsi Kemitraan</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  className={`${inputClassName} disabled:opacity-50`}
                  placeholder="Keterangan fasilitas khusus atau rate korporat OJK."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 text-xs cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-75 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {isSubmitting
                    ? "Menyimpan..."
                    : isEditMode
                      ? "Simpan Perubahan"
                      : "Simpan Kemitraan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Konfirmasi Hapus
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus kemitraan{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {itemToDelete?.name}
                </strong>
                ? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
