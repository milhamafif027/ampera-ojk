"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Car,
  Plus,
  Calendar,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
  CheckCircle2,
  Download,
  Printer,
  Loader2,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import VehicleBookingModal from "@/components/dashboard/VehicleBookingModal";
import VehicleShowcaseGrid from "@/components/dashboard/VehicleShowcaseGrid";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
  category?: "Khusus Pimpinan" | "Operasional" | string;
}

interface VehicleBooking {
  id: string | number;
  vehicleName: string;
  destination: string;
  borrower: string;
  dept: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Disetujui" | "Selesai" | "Ditolak" | string;
  passengers?: string | number;
  notes?: string;
  userId?: string | number;
  phone?: string;
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
  dept?: string;
  phone?: string;
}

export default function KendaraanPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<VehicleBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua Status");
  const [monthFilter, setMonthFilter] = useState<string>("Semua Bulan");
  const [yearFilter, setYearFilter] = useState<string>("Semua Tahun");
  const [isExporting, setIsExporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<
    string | number | null
  >(null);

  const [newVehicleData, setNewVehicleData] = useState({
    name: "",
    plate_number: "",
    type: "7 Penumpang",
    status: "Tersedia",
    category: "Operasional",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    vehicleName: string;
    borrowerName: string;
  }>({ isOpen: false, bookingId: null, vehicleName: "", borrowerName: "" });
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    vehicleName: "Menunggu Plotting Admin",
    destination: "",
    borrower: "",
    dept: "",
    startDate: "",
    endDate: "",
    purpose: "",
    passengers: "1",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicleData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/kendaraan");
      const result = await res.json();

      if (res.ok) {
        if (result.vehicles && result.vehicles.length > 0) {
          const mappedVehicles: Vehicle[] = result.vehicles.map((v: any) => ({
            id: String(v.id),
            name: v.name || v.nama_kendaraan,
            plateNumber: v.plate_number || v.no_plat || "BG OJK",
            capacity: v.type || v.kapasitas || "7 Penumpang",
            status: v.status || "Tersedia",
            category: v.category || "Operasional",
          }));
          setVehicles(mappedVehicles);
        }

        if (result.bookings) {
          const mappedBookings: VehicleBooking[] = result.bookings.map(
            (b: any) => ({
              id: String(b.id),
              vehicleName: b.nama_kendaraan || b.vehicle_name || b.vehicleName,
              destination: b.tujuan || b.destination,
              borrower: b.peminjam || b.borrower,
              dept: b.satker || b.dept,
              startDate: b.tanggal_mulai
                ? b.tanggal_mulai.split("T")[0]
                : b.start_date
                  ? b.start_date.split("T")[0]
                  : b.startDate,
              endDate: b.tanggal_selesai
                ? b.tanggal_selesai.split("T")[0]
                : b.end_date
                  ? b.end_date.split("T")[0]
                  : b.endDate,
              status: b.status || "Pending",
              passengers: b.total_passengers || b.passengers || "-",
              notes: b.approval_notes || b.notes || "-",
              userId: b.user_id || b.userId,
              phone: b.phone || "",
            }),
          );
          setBookings(mappedBookings);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data kendaraan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      const storedUser = sessionStorage.getItem("local_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setFormData((prev) => ({
            ...prev,
            dept: parsedUser.dept || "OJK Sumsel",
            phone: parsedUser.phone || parsedUser.no_hp || "",
          }));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
        }
      }
      fetchVehicleData();
    };
    initData();
  }, [fetchVehicleData]);

  const isAdmin = user?.role === "admin";

  const isExternalUser = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || "").toLowerCase();
    const deptLower = (user.dept || "").toLowerCase();
    const nameLower = (user.name || "").toLowerCase();
    return (
      roleLower.includes("eksternal") ||
      deptLower.includes("eksternal") ||
      nameLower.includes("eksternal") ||
      roleLower.includes("tamu")
    );
  }, [user]);

  // Opsi Tahun & Bulan Berdasarkan Data Peminjaman
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    bookings.forEach((b) => {
      if (b.startDate) {
        yearsSet.add(b.startDate.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [bookings]);

  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    bookings.forEach((b) => {
      if (b.startDate) {
        const year = b.startDate.slice(0, 4);
        if (yearFilter === "Semua Tahun" || year === yearFilter) {
          monthsSet.add(b.startDate.slice(5, 7));
        }
      }
    });
    return Array.from(monthsSet).sort();
  }, [bookings, yearFilter]);

  const formatMonthName = (monthNum: string) => {
    try {
      const parsed = parseInt(monthNum, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 12) return monthNum;
      return new Date(2026, parsed - 1, 1).toLocaleDateString("id-ID", {
        month: "long",
      });
    } catch {
      return monthNum;
    }
  };

  // Filter Data Peminjaman (Menampilkan semua data lama dengan filter aktif)
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Jika user eksternal, hanya tampilkan miliknya sendiri
        if (isExternalUser && user) {
          const isOwner =
            b.borrower.toLowerCase() === user.name.toLowerCase() ||
            b.borrower.toLowerCase().includes("tamu eksternal");
          if (!isOwner) return false;
        }

        const matchSearch =
          b.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.dept && b.dept.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchStatus =
          statusFilter === "Semua Status" || b.status === statusFilter;

        const itemYear = b.startDate ? b.startDate.slice(0, 4) : "";
        const itemMonth = b.startDate ? b.startDate.slice(5, 7) : "";

        const matchYear =
          yearFilter === "Semua Tahun" || itemYear === yearFilter;
        const matchMonth =
          monthFilter === "Semua Bulan" || itemMonth === monthFilter;

        return matchSearch && matchStatus && matchYear && matchMonth;
      })
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  }, [
    bookings,
    isExternalUser,
    user,
    searchTerm,
    statusFilter,
    yearFilter,
    monthFilter,
  ]);

  // =============== FITUR CETAK / EKSPOR EXCEL (XLSX) ===============
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const exportData: any[][] = [];

      exportData.push(["KANTOR OJK PROVINSI SUMATERA SELATAN"]);
      exportData.push(["LAPORAN REKAPITULASI PEMINJAMAN KENDARAAN DINAS"]);
      exportData.push([
        `Tanggal Cetak: ${currentDate} | Status: ${statusFilter} | Tahun: ${yearFilter} | Bulan: ${monthFilter}`,
      ]);
      exportData.push([]);

      exportData.push([
        "No",
        "Armada / Kendaraan",
        "Tujuan Perjalanan",
        "Peminjam",
        "Satuan Kerja (Satker)",
        "Tanggal Penugasan",
        "Jumlah Penumpang",
        "Catatan Admin",
        "Status",
      ]);

      filteredBookings.forEach((b, idx) => {
        exportData.push([
          idx + 1,
          b.vehicleName || "Menunggu Plotting",
          b.destination || "-",
          b.borrower || "-",
          b.dept || "-",
          `${b.startDate} s.d ${b.endDate}`,
          b.passengers || 1,
          b.notes || "-",
          b.status,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 35 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Kendaraan");
      XLSX.writeFile(wb, `Laporan_Peminjaman_Kendaraan_${currentDate}.xlsx`);
    } catch (error) {
      console.error("Gagal ekspor Excel:", error);
      alert("Gagal melakukan ekspor data Excel.");
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const loadLogoBase64 = (src: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // =============== FITUR CETAK PDF ===============
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const currentDate = new Date().toISOString().split("T")[0];
      const imgData = await loadLogoBase64("/otoritas-jasa-keuangan-logo.png");

      if (imgData) {
        doc.addImage(imgData, "PNG", 240, 10, 32, 16);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("OTORITAS JASA KEUANGAN REPUBLIK INDONESIA", 14, 15);
      doc.setFontSize(13);
      doc.text("KANTOR OJK PROVINSI SUMATERA SELATAN", 14, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Laporan Rekapitulasi Peminjaman Kendaraan Dinas", 14, 28);
      doc.text(
        `Tanggal Cetak: ${currentDate} | Status: ${statusFilter} | Tahun: ${yearFilter} | Bulan: ${monthFilter}`,
        14,
        33,
      );
      doc.setLineWidth(0.5);
      doc.line(14, 37, 283, 37);

      const tableColumn = [
        "No",
        "Armada / Kendaraan",
        "Tujuan & Penumpang",
        "Peminjam / Satker",
        "Tanggal Penugasan",
        "Catatan",
        "Status",
      ];
      const tableRows = filteredBookings.map((b, idx) => [
        idx + 1,
        b.vehicleName || "Menunggu Plotting",
        `${b.destination}\n(${b.passengers} Penumpang)`,
        `${b.borrower}\n(${b.dept || "Umum"})`,
        `${b.startDate} s.d\n${b.endDate}`,
        b.notes || "-",
        b.status,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        theme: "grid",
        headStyles: {
          fillColor: [159, 21, 33],
          textColor: [255, 255, 255],
          halign: "center",
          fontSize: 9,
        },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          6: { halign: "center", cellWidth: 24 },
        },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.text(
            `Halaman ${doc.getNumberOfPages()}`,
            14,
            doc.internal.pageSize.height - 10,
          );
        },
      });

      doc.save(`Laporan_Peminjaman_Kendaraan_${currentDate}.pdf`);
    } catch (error) {
      console.error("Gagal cetak PDF:", error);
      alert("Terjadi kesalahan saat memproses PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenModal = () => {
    const defaultDept = user && !isExternalUser ? "OJK Sumsel" : "";
    const defaultPhone = user?.phone || "";

    setFormData({
      vehicleName: "Menunggu Plotting Admin",
      destination: "",
      borrower: "",
      dept: defaultDept,
      startDate: "",
      endDate: "",
      purpose: "",
      passengers: "1",
      phone: defaultPhone,
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingVehicleId(null);
    setNewVehicleData({
      name: "",
      plate_number: "",
      type: "7 Penumpang",
      status: "Tersedia",
      category: "Operasional",
    });
    setIsAddVehicleModalOpen(true);
  };

  const handleAddOrUpdateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingVehicleId ? "PUT" : "POST";
      const payload = editingVehicleId
        ? { action: "update_vehicle", id: editingVehicleId, ...newVehicleData }
        : { action: "add_vehicle", ...newVehicleData };

      const res = await fetch("/api/kendaraan", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data kendaraan");

      setIsAddVehicleModalOpen(false);
      setEditingVehicleId(null);
      setNewVehicleData({
        name: "",
        plate_number: "",
        type: "7 Penumpang",
        status: "Tersedia",
        category: "Operasional",
      });

      setSuccessMessage(
        editingVehicleId
          ? "Data kendaraan berhasil diperbarui."
          : "Armada kendaraan baru telah berhasil disimpan ke database.",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data kendaraan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_kendaraan: "Menunggu Plotting Admin",
          tujuan: formData.destination,
          peminjam: formData.borrower,
          satker: formData.dept,
          tanggal_mulai: formData.startDate,
          tanggal_selesai: formData.endDate,
          keperluan: formData.purpose,
          total_passengers: formData.passengers,
          phone: formData.phone,
          status: "Pending",
          user_id: user?.id || null,
          role: user?.role || "eksternal",
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan pengajuan peminjaman");
      }

      setIsModalOpen(false);
      setSuccessMessage(
        "Request peminjaman kendaraan berhasil dikirim! Menunggu plotting dari Admin di Dashboard.",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim pengajuan peminjaman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (
    id: string | number,
    vehicleName: string,
    borrowerName: string,
  ) => {
    setDeleteModal({
      isOpen: true,
      bookingId: String(id),
      vehicleName,
      borrowerName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.bookingId) return;

    setIsDeletingBooking(true);
    try {
      const res = await fetch(`/api/kendaraan?id=${deleteModal.bookingId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus pengajuan kendaraan");

      setDeleteModal({
        isOpen: false,
        bookingId: null,
        vehicleName: "",
        borrowerName: "",
      });
      setSuccessMessage("Pengajuan peminjaman kendaraan berhasil dihapus.");
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data pengajuan.");
    } finally {
      setIsDeletingBooking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full pb-12"
    >
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(159, 21, 33, 0.25);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(159, 21, 33, 0.6);
        }
      `}</style>

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="text-[#9f1521] shrink-0" size={22} /> Layanan
              Armada & Kendaraan Dinas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Kelola, pantau, dan ajukan request peminjaman kendaraan
              operasional dinas Kantor OJK Sumsel.
            </p>
          </div>

          {/* TOMBOL CETAK / EKSPOR KHUSUS ADMIN */}
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-75"
              >
                {isExporting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {isExporting ? "Mengekspor..." : "Ekspor Excel"}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-75"
              >
                {isExporting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Printer size={15} />
                )}
                {isExporting ? "Memproses PDF..." : "Cetak PDF"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap sm:flex-nowrap justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchVehicleData}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Refresh Data"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} /> Tambah Kendaraan
              </button>
            )}

            <button
              onClick={() => handleOpenModal()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-900/10 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} /> Request Kendaraan Dinas
            </button>
          </div>
        </div>
      </div>

      {/* SHOWCASE GRID KENDARAAN */}
      <VehicleShowcaseGrid vehicles={vehicles} />

      {/* DAFTAR PENGAJUAN KENDARAAN (DENGAN FILTER BULAN & TAHUN) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Calendar size={18} className="text-[#9f1521]" /> Daftar
            Rekapitulasi Peminjaman Kendaraan
          </h2>

          {/* FILTER BAR & SEARCH */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <div className="relative col-span-2 sm:col-span-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari tujuan/peminjam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521]"
              />
            </div>

            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setMonthFilter("Semua Bulan");
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="Semua Bulan">Semua Bulan</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Pending">Pending</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                  <th className="p-3">Armada / Mobil</th>
                  <th className="p-3">Tujuan & Penumpang</th>
                  <th className="p-3">Peminjam</th>
                  <th className="p-3">Tanggal Penugasan</th>
                  <th className="p-3">Catatan Admin</th>
                  <th className="p-3 text-center">Status</th>
                  {isAdmin && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {b.vehicleName === "Menunggu Plotting Admin" ||
                      !b.vehicleName ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-md text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                          Menunggu Plotting Admin
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {b.vehicleName}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 font-bold">
                          <MapPin size={12} className="text-[#9f1521]" />
                          {b.destination}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <User size={12} /> {b.passengers} Penumpang
                        </span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold">{b.borrower}</span>
                      <br />
                      <span className="text-[10px] text-slate-400">
                        {b.dept || "Umum"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {b.startDate} s.d {b.endDate}
                    </td>
                    <td className="p-3 text-slate-500">
                      {b.notes && b.notes !== "-" ? (
                        <p className="italic text-[11px]">💬 {b.notes}</p>
                      ) : (
                        <span className="italic text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          b.status === "Disetujui"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : b.status === "Selesai"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400"
                              : b.status === "Ditolak"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              handleOpenDeleteModal(
                                b.id,
                                b.vehicleName,
                                b.borrower,
                              )
                            }
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Pengajuan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-6 text-center border-t border-dashed border-slate-200 dark:border-slate-800">
            Tidak ditemukan data peminjaman kendaraan yang sesuai dengan
            kriteria filter.
          </p>
        )}
      </div>

      {/* MODAL TAMBAH KENDARAAN (KHUSUS ADMIN) */}
      {isAddVehicleModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col my-auto"
          >
            <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingVehicleId
                  ? "Edit Data Kendaraan"
                  : "Tambah Armada Kendaraan Baru"}
              </h3>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddOrUpdateVehicleSubmit}
              className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                  Nama Kendaraan / Model
                </label>
                <input
                  type="text"
                  value={newVehicleData.name}
                  onChange={(e) =>
                    setNewVehicleData({
                      ...newVehicleData,
                      name: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  placeholder="Contoh: Toyota Fortuner VRZ"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Nomor Plat
                  </label>
                  <input
                    type="text"
                    value={newVehicleData.plate_number}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        plate_number: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                    placeholder="Contoh: BG 1025 OJK"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Kapasitas / Jenis
                  </label>
                  <input
                    type="text"
                    value={newVehicleData.type}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        type: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                    placeholder="Contoh: 7 Penumpang / Sepeda Motor"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Status Kendaraan
                  </label>
                  <select
                    value={newVehicleData.status}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        status: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Terpakai">Terpakai</option>
                    <option value="Perawatan">Perawatan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Kategori Kendaraan
                  </label>
                  <select
                    value={newVehicleData.category}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        category: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Khusus Pimpinan">Khusus Pimpinan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kendaraan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PENGAJUAN */}
      {deleteModal.isOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hapus Pengajuan Kendaraan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan menghapus permanen data request ke{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.vehicleName}
                </strong>{" "}
                oleh{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.borrowerName}
                </strong>
                . Apakah Anda yakin?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    bookingId: null,
                    vehicleName: "",
                    borrowerName: "",
                  })
                }
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-75"
              >
                {isDeletingBooking ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
              <p className="text-xs text-slate-500 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}

      {/* MODAL RESERVASI / REQUEST KENDARAAN */}
      <VehicleBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        vehicles={vehicles}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
}
