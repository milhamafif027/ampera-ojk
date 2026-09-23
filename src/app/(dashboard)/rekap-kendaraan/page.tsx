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
  Download,
  Printer,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface RekapItem {
  id: string | number;
  hari_tanggal: string;
  no_pol: string;
  jam_awal: string;
  km_awal: number;
  tujuan: string;
  keperluan: string;
  pengguna: string;
  driver: string;
  km_akhir: number;
  jam_selesai: string;
}

interface VehicleOption {
  id: string | number;
  name: string;
  plateNumber: string;
}

export default function RekapKendaraanPage() {
  const [rekapList, setRekapList] = useState<RekapItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // State Filter
  const [searchTerm, setSearchTerm] = useState("");

  // State Form Input (Semua Wajib Diisi, Termasuk Km Akhir)
  const [formData, setFormData] = useState({
    hari_tanggal: new Date().toISOString().split("T")[0],
    no_pol: "",
    jam_awal: "",
    km_awal: "",
    tujuan: "",
    keperluan: "",
    pengguna: "",
    driver: "",
    km_akhir: "",
    jam_selesai: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
    title: string;
  }>({ isOpen: false, id: null, title: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Ambil Data Rekap dan Master Kendaraan dengan penanganan kredensial (atasi 401)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resRekap, resVehicles] = await Promise.all([
        fetch("/api/rekap-kendaraan", {
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/kendaraan", {
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (resRekap.status === 401 || resVehicles.status === 401) {
        console.warn("Sesi memerlukan otorisasi ulang.");
      }

      const resultRekap = await resRekap.json();
      const resultVehicles = await resVehicles.json();

      if (resRekap.ok && resultRekap.data) {
        setRekapList(resultRekap.data);
      }

      if (resVehicles.ok && resultVehicles.vehicles) {
        const mappedVehicles: VehicleOption[] = resultVehicles.vehicles.map(
          (v: any) => ({
            id: String(v.id),
            name: v.name || v.nama_kendaraan,
            plateNumber: v.plate_number || v.no_plat || "BG OJK",
          }),
        );
        setVehicles(mappedVehicles);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const [resRekap, resVehicles] = await Promise.all([
          fetch("/api/rekap-kendaraan"),
          fetch("/api/kendaraan"),
        ]);

        const resultRekap = await resRekap.json();
        const resultVehicles = await resVehicles.json();

        if (!isCancelled) {
          if (resRekap.ok && resultRekap.data) {
            setRekapList(resultRekap.data);
          }
          if (resVehicles.ok && resultVehicles.vehicles) {
            setVehicles(
              resultVehicles.vehicles.map((v: any) => ({
                id: String(v.id),
                name: v.name || v.nama_kendaraan,
                plateNumber: v.plate_number || v.no_plat || "BG OJK",
              })),
            );
          }
        }
      } catch (error) {
        if (!isCancelled) console.error("Gagal memuat data:", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    return rekapList.filter((item) => {
      return (
        item.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pengguna.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_pol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keperluan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [rekapList, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/rekap-kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan rekap");

      setIsModalOpen(false);
      setSuccessMsg("Rekap kegiatan dinas kendaraan KOPG berhasil disimpan!");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rekap-kendaraan?id=${deleteModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteModal({ isOpen: false, id: null, title: "" });
        fetchData();
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- EKSPOR EXCEL ---
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const exportData: any[][] = [];

      exportData.push(["KANTOR OJK PROVINSI SUMATERA SELATAN"]);
      exportData.push(["REKAPITULASI KEGIATAN DINAS KENDARAAN"]);
      exportData.push([`Tanggal Cetak: ${currentDate}`]);
      exportData.push([]);

      exportData.push([
        "No",
        "Tanggal",
        "No. Polisi / Mobil",
        "Jam Awal",
        "Km Awal",
        "Tujuan",
        "Keperluan",
        "Pengguna",
        "Driver",
        "Km Akhir",
        "Jam Selesai",
      ]);

      filteredData.forEach((item, idx) => {
        exportData.push([
          idx + 1,
          item.hari_tanggal,
          item.no_pol,
          item.jam_awal,
          item.km_awal,
          item.tujuan,
          item.keperluan,
          item.pengguna,
          item.driver,
          item.km_akhir,
          item.jam_selesai,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap KOPG");
      XLSX.writeFile(wb, `Rekap_Kendaraan_KOPG_${currentDate}.xlsx`);
    } catch (error) {
      console.error("Excel export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // --- CETAK PDF ---
  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const currentDate = new Date().toISOString().split("T")[0];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("OTORITAS JASA KEUANGAN PROVINSI SUMATERA SELATAN", 14, 15);
      doc.setFontSize(10);
      doc.text("Laporan Rekapitulasi Kegiatan Dinas Kendaraan KOPG", 14, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Tanggal Cetak: ${currentDate}`, 14, 28);
      doc.setLineWidth(0.5);
      doc.line(14, 32, 283, 32);

      const tableColumn = [
        "No",
        "Tanggal",
        "No. Pol / Mobil",
        "Jam Awal",
        "Km Awal",
        "Tujuan",
        "Keperluan",
        "Pengguna",
        "Driver",
        "Km Akhir",
        "Jam Selesai",
      ];
      const tableRows = filteredData.map((item, idx) => [
        idx + 1,
        item.hari_tanggal,
        item.no_pol,
        item.jam_awal,
        item.km_awal,
        item.tujuan,
        item.keperluan,
        item.pengguna,
        item.driver,
        item.km_akhir,
        item.jam_selesai,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: "grid",
        headStyles: {
          fillColor: [159, 21, 33],
          textColor: [255, 255, 255],
          fontSize: 8,
          halign: "center",
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
      });

      doc.save(`Rekap_Kendaraan_KOPG_${currentDate}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full pb-12"
    >
      {/* HEADER BAR & ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="text-[#9f1521] shrink-0" size={22} /> Rekapitulasi
              Kegiatan Dinas Kendaraan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Catat dan pantau seluruh aktivitas operasional kedinasan kendaraan
              KOPG OJK Sumsel secara terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={15} /> Ekspor Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Printer size={15} /> Cetak PDF
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/10 cursor-pointer"
            >
              <Plus size={16} /> Rekap Kegiatan Baru
            </button>
          </div>
        </div>
      </div>

      {/* TABEL DATA REKAP KEGIATAN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Calendar size={18} className="text-[#9f1521]" /> Tabel Rekapitulasi
            Dinas
          </h2>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari tujuan, pengguna, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
            />
          </div>
        </div>

        {filteredData.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">No. Polisi / Mobil</th>
                  <th className="p-3">Jam & Km Awal</th>
                  <th className="p-3">Tujuan & Keperluan</th>
                  <th className="p-3">Pengguna / Driver</th>
                  <th className="p-3">Km Akhir & Jam Selesai</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {item.hari_tanggal}
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-[#9f1521]">
                      {item.no_pol}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {item.jam_awal}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge size={12} /> {item.km_awal} Km
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          📍 {item.tujuan}
                        </p>
                        <p className="text-[11px] text-slate-500 italic">
                          💡 {item.keperluan}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold">👤 {item.pengguna}</span>
                        <span className="text-[11px] text-slate-400">
                          🚗 Driver: {item.driver}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex flex-col text-slate-600 dark:text-slate-300">
                        <span>🏁 {item.km_akhir} Km</span>
                        <span className="font-bold text-emerald-600">
                          ⏱️ Selesai: {item.jam_selesai}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            id: String(item.id),
                            title: `${item.tujuan} (${item.pengguna})`,
                          })
                        }
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Rekap"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-8 text-center border-t border-dashed border-slate-200 dark:border-slate-800">
            Belum ada data rekap kegiatan dinas KOPG tercatat.
          </p>
        )}
      </div>

      {/* MODAL INPUT FORM REKAP KOPG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col my-auto"
          >
            <div className="px-6 py-5 bg-[#9f1521] text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                Form Rekap Kegiatan Dinas KOPG
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.hari_tanggal}
                    onChange={(e) =>
                      setFormData({ ...formData, hari_tanggal: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    No. Polisi & Mobil <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.no_pol}
                    onChange={(e) =>
                      setFormData({ ...formData, no_pol: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer font-bold"
                    required
                  >
                    <option value="">-- Pilih Kendaraan --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={`${v.plateNumber} (${v.name})`}>
                        {v.plateNumber} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Jam Awal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_awal}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_awal: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Km Awal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.km_awal}
                    onChange={(e) =>
                      setFormData({ ...formData, km_awal: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    placeholder="Contoh: 154442"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Tujuan Perjalanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tujuan}
                  onChange={(e) =>
                    setFormData({ ...formData, tujuan: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  placeholder="Contoh: Pakjo, Kedamaian"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Keperluan Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.keperluan}
                  onChange={(e) =>
                    setFormData({ ...formData, keperluan: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  placeholder="Contoh: Survei rumdin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Pengguna / User <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pengguna}
                    onChange={(e) =>
                      setFormData({ ...formData, pengguna: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    placeholder="Contoh: Bang Jeff"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Driver <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.driver}
                    onChange={(e) =>
                      setFormData({ ...formData, driver: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    placeholder="Contoh: Rio"
                    required
                  />
                </div>
              </div>

              {/* RAPI BERDAMPINGAN: KM AKHIR & JAM SELESAI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Km Akhir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.km_akhir}
                    onChange={(e) =>
                      setFormData({ ...formData, km_akhir: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    placeholder="Contoh: 154465"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Jam Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_selesai: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#9f1521] text-white rounded-xl font-bold hover:bg-[#7a1019] cursor-pointer"
                >
                  Simpan Rekap
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Hapus Data Rekap?
            </h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus rekap kegiatan ke{" "}
              <strong>{deleteModal.title}</strong>?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, id: null, title: "" })
                }
                className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {successMsg && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Berhasil!
            </h3>
            <p className="text-xs text-slate-500">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg("")}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
