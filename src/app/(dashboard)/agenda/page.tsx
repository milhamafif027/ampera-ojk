"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus } from "@/lib/utils";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClipboardList,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Trash2,
  Calendar,
  Clock,
  Building2,
  User,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function AgendaPage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua Status");
  const [roomFilter, setRoomFilter] = useState<string>("Semua Ruangan");

  const [isExporting, setIsExporting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    agendaId: string | null;
    title: string | null;
  }>({
    isOpen: false,
    agendaId: null,
    title: null,
  });

  const isAdmin = user?.role === "admin";

  const fetchAgendas = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/agendas");
      const result = await res.json();

      if (res.ok && result.data) {
        const mappedAgendas: Agenda[] = result.data.map((item: any) => {
          let formattedDate = "";
          if (item.date) {
            const rawDateStr = String(item.date);
            if (rawDateStr.includes("T")) {
              formattedDate = rawDateStr.split("T")[0];
            } else if (rawDateStr.includes(" ")) {
              formattedDate = rawDateStr.split(" ")[0];
            } else {
              formattedDate = rawDateStr.slice(0, 10);
            }
          }

          // PERBAIKAN WAKTU: Pastikan aman dari format epoch / timestamp 1970
          let formattedTime = "";
          if (item.start_time && item.end_time) {
            const startStr = String(item.start_time);
            const endStr = String(item.end_time);

            const cleanStart = startStr.includes("T")
              ? startStr.split("T")[1]
              : startStr;
            const cleanEnd = endStr.includes("T")
              ? endStr.split("T")[1]
              : endStr;

            formattedTime = `${cleanStart.slice(0, 5)} - ${cleanEnd.slice(0, 5)}`;
          } else {
            formattedTime = item.time || "08:00 - 17:00";
          }

          const agendaItem = {
            id: String(item.id),
            title: item.title,
            date: formattedDate,
            time: formattedTime, // Waktu yang sudah dibersihkan
            room: item.room_name || item.room || "Ruang Rapat OJK",
            pic: item.pic || "Pegawai OJK",
            dept: item.dept || "OJK Sumsel",
            layout: item.layout || "-",
            status: item.status || "Pending",
          };

          return {
            ...agendaItem,
            smartStatus: getSmartStatus(agendaItem) as StatusPengajuan,
          };
        });

        setAgendas(mappedAgendas);
      }
    } catch (error) {
      console.error("Gagal mengambil data agenda:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();

      // UBAH DARI localStorage MENJADI sessionStorage
      const storedUser = sessionStorage.getItem("local_user");

      if (!storedUser) {
        router.push("/login");
        return;
      }
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === "eksternal") {
          router.push("/dashboardUtama");
          return;
        }
        setUser(parsedUser);
      } catch (err) {
        router.push("/login");
        return;
      }
      fetchAgendas();
    };
    initData();
  }, [fetchAgendas, router]);

  const roomOptions = Array.from(new Set(agendas.map((a) => a.room))).filter(
    Boolean,
  );

  const filteredAgendas = agendas.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.dept && a.dept.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "Semua Status" || a.smartStatus === statusFilter;
    const matchRoom = roomFilter === "Semua Ruangan" || a.room === roomFilter;

    return matchSearch && matchStatus && matchRoom;
  });

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      let csvContent = "\uFEFF";
      csvContent += `"KANTOR REGIONAL / PROVINSI OJK SUMATERA SELATAN"\n`;
      csvContent += `"LAPORAN REKAPITULASI AGENDA & KEGIATAN RUANGAN"\n`;
      csvContent += `"Tanggal Cetak: ${currentDate} | Filter Status: ${statusFilter} | Filter Ruangan: ${roomFilter}"\n\n`;
      csvContent += `"No","Tanggal","Waktu","Nama Kegiatan / Acara","Penanggung Jawab (PIC)","Satuan Kerja (Satker)","Ruangan","Tata Letak","Status Pengajuan"\n`;

      filteredAgendas.forEach((a, index) => {
        const row = [
          index + 1,
          a.date,
          a.time,
          `"${(a.title || "").replace(/"/g, '""')}"`,
          `"${(a.pic || "").replace(/"/g, '""')}"`,
          `"${(a.dept || "-").replace(/"/g, '""')}"`,
          `"${(a.room || "").replace(/"/g, '""')}"`,
          `"${(a.layout || "-").replace(/"/g, '""')}"`,
          a.smartStatus,
        ];
        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Laporan_Agenda_OJK_Sumsel_${currentDate}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal mengekspor Excel:", error);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const currentDate = new Date().toISOString().split("T")[0];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("OTORITAS JASA KEUANGAN REPUBLIK INDONESIA", 14, 15);
      doc.setFontSize(13);
      doc.text("KANTOR REGIONAL / PROVINSI SUMATERA SELATAN", 14, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Laporan Rekapitulasi Daftar Agenda & Kegiatan Ruang Rapat",
        14,
        28,
      );
      doc.text(
        `Tanggal Cetak: ${currentDate} | Status: ${statusFilter} | Ruangan: ${roomFilter}`,
        14,
        33,
      );
      doc.setLineWidth(0.5);
      doc.line(14, 37, 283, 37);

      const tableColumn = [
        "No",
        "Tanggal & Waktu",
        "Nama Kegiatan / Acara",
        "PIC / Satker",
        "Ruangan",
        "Layout",
        "Status",
      ];
      const tableRows = filteredAgendas.map((item, index) => [
        index + 1,
        `${item.date}\n${item.time}`,
        item.title,
        `${item.pic}\n(${item.dept || "Umum"})`,
        item.room,
        item.layout || "-",
        item.smartStatus,
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
          0: { halign: "center", cellWidth: 12 },
          6: { halign: "center", cellWidth: 35 },
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.text(
            `Halaman ${doc.getNumberOfPages()}`,
            14,
            doc.internal.pageSize.height - 10,
          );
        },
      });

      doc.save(`Laporan_Agenda_OJK_Sumsel_${currentDate}.pdf`);
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const selectedAgenda = agendas.find((a) => a.id === id);
      if (!selectedAgenda) return;
      const [startTime, endTime] = selectedAgenda.time.split(" - ");
      const res = await fetch("/api/agendas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: selectedAgenda.title,
          date: selectedAgenda.date,
          start_time: startTime || "08:00",
          end_time: endTime || "10:00",
          pic: selectedAgenda.pic,
          status: "Disetujui",
        }),
      });
      if (res.ok) fetchAgendas();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDeleteModal = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, agendaId: id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.agendaId) return;
    setActionLoadingId(deleteModal.agendaId);
    try {
      const res = await fetch(`/api/agendas?id=${deleteModal.agendaId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAgendas();
        setDeleteModal({ isOpen: false, agendaId: null, title: null });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

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
            <ClipboardList className="text-[#9f1521]" size={22} /> Rekapitulasi
            Daftar Agenda
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Kelola dan pantau rekapitulasi seluruh pengajuan serta kegiatan
            terdaftar di OJK Sumsel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAgendas}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>

          {isAdmin && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari acara, PIC, satker, ruangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100 shadow-sm"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Sedang Berlangsung">Sedang Berlangsung</option>
            <option value="Pending">Pending</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <div>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="Semua Ruangan">Semua Ruangan</option>
            {roomOptions.map((roomName) => (
              <option key={roomName} value={roomName}>
                {roomName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. TABEL DATA AGENDA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Nama Kegiatan</th>
                <th className="p-4">PIC / Satker</th>
                <th className="p-4">Ruangan</th>
                <th className="p-4 text-center">Status</th>
                {isAdmin && <th className="p-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredAgendas.length > 0 ? (
                filteredAgendas.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#9f1521]" />{" "}
                          {item.date}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />{" "}
                          {item.time}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.title}
                        </p>
                        {item.layout && item.layout !== "-" && (
                          <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            Layout: {item.layout}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <User size={13} className="text-slate-400" />{" "}
                          {item.pic}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.dept || "Umum"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400" />{" "}
                        {item.room}
                      </span>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                          item.smartStatus === "Disetujui"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : item.smartStatus === "Sedang Berlangsung"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}
                      >
                        {item.smartStatus}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {item.smartStatus === "Pending" && (
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={actionLoadingId === item.id}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Setujui Agenda"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(item.id, item.title)}
                            disabled={actionLoadingId === item.id}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus Agenda"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="p-8 text-center text-xs text-slate-400 font-medium italic"
                  >
                    Tidak ditemukan data agenda yang sesuai dengan kriteria
                    filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS AGENDA */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Konfirmasi Hapus
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus agenda{" "}
                <strong>&quot;{deleteModal.title}&quot;</strong> dari sistem?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={() =>
                  setDeleteModal({ isOpen: false, agendaId: null, title: null })
                }
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {actionLoadingId && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {actionLoadingId ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
