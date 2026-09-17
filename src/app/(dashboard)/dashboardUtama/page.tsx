"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus, formatAgendaDate } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Bell,
  RefreshCw,
  Car,
  Hotel,
  HelpCircle,
  XCircle,
  Eye,
  ShieldCheck,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, animate } from "framer-motion";

interface ExtendedAgenda extends Agenda {
  endDate?: string;
  notes?: string;
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

function Counter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplayValue(Math.floor(latest));
      },
    });

    return controls.stop;
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<LocalUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const storedUser = sessionStorage.getItem("local_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [agendas, setAgendas] = useState<ExtendedAgenda[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Pop-up Pengumuman Update (Aman dari Cascading Render Error)
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    agendaId: string | null;
    title: string | null;
    actionType: "approve" | "reject" | null;
    rejectReason: string;
  }>({
    isOpen: false,
    agendaId: null,
    title: null,
    actionType: null,
    rejectReason: "",
  });

  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({
    isOpen: false,
    data: null,
  });

  // Cek sessionStorage untuk menampilkan Welcome Update Modal sekali per sesi
  useEffect(() => {
    // Gunakan setTimeout untuk menghindari error "Cascading Renders"
    const timer = setTimeout(() => {
      const hasSeenUpdate = sessionStorage.getItem("ampera_update_v2_seen");
      if (!hasSeenUpdate) {
        setShowUpdateModal(true);
      }
    }, 100); // Jeda 100 milidetik setelah halaman dirender

    return () => clearTimeout(timer);
  }, []);

  const handleCloseUpdateModal = () => {
    sessionStorage.setItem("ampera_update_v2_seen", "true");
    setShowUpdateModal(false);
  };

  const loadDashboardData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const [resAgendas, resRooms] = await Promise.all([
        fetch("/api/agendas"),
        fetch("/api/ruangan"),
      ]);

      const resultAgendas = await resAgendas.json();
      const resultRooms = await resRooms.json();

      if (resAgendas.ok && resultAgendas.data) {
        const mappedAgendas: ExtendedAgenda[] = resultAgendas.data.map(
          (item: any) => {
            const formattedDate = item.date
              ? String(item.date).slice(0, 10)
              : "";
            const formattedEndDate = item.end_date
              ? String(item.end_date).slice(0, 10)
              : formattedDate;

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
              formattedTime = item.time || "";
            }

            const agendaItem = {
              id: String(item.id),
              title: item.title,
              date: formattedDate,
              endDate: formattedEndDate,
              time: formattedTime,
              room: item.room_name || item.room || "Ruang Rapat OJK",
              pic: item.pic || "Pegawai OJK",
              dept: item.dept || "OJK Sumsel",
              phone: item.phone || "",
              layout: item.layout || "-",
              status: item.status || "Pending",
              total_participants: item.total_participants || 1,
              meeting_leader: item.meeting_leader || "-",
              notes: item.notes || "",
            };

            return {
              ...agendaItem,
              smartStatus: getSmartStatus(agendaItem) as StatusPengajuan,
            };
          },
        );

        setAgendas(mappedAgendas);
      }

      if (resRooms.ok && Array.isArray(resultRooms.data)) {
        setRooms(resultRooms.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  // Real-time Auto Polling setiap 5 detik agar data pending muncul tanpa refresh manual
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      if (!isCancelled) await loadDashboardData(true);
    };

    init();

    const interval = setInterval(() => {
      if (!isCancelled) {
        loadDashboardData(false);
      }
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  const isAdmin = user?.role === "admin";
  const isExternal = user?.role === "eksternal";

  const liveAgendas = agendas.filter(
    (a) => a.smartStatus === "Sedang Berlangsung",
  );

  const upcomingAgendas = agendas
    .filter((a) => a.smartStatus === "Disetujui")
    .sort((a, b) => {
      const dtA =
        a.date.split("/").reverse().join("-") +
        "T" +
        (a.time.split(" - ")[0] || "00:00");
      const dtB =
        b.date.split("/").reverse().join("-") +
        "T" +
        (b.time.split(" - ")[0] || "00:00");
      return dtA.localeCompare(dtB);
    });

  const pendingAgendas = agendas.filter(
    (a) => a.smartStatus === "Pending" || a.status === "Pending",
  );

  const totalAgendas = agendas.length;
  const totalDisetujui = agendas.filter(
    (a) =>
      a.smartStatus === "Disetujui" ||
      a.smartStatus === "Sedang Berlangsung" ||
      a.status === "Disetujui",
  ).length;
  const totalPending = pendingAgendas.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const bookedRoomsToday = new Set(
    agendas
      .filter((item) => {
        const start = item.date;
        const end = item.endDate || item.date;
        return (
          todayStr >= start && todayStr <= end && item.status !== "Ditolak"
        );
      })
      .map((item) => item.room),
  );
  const totalMasterRooms = rooms.length > 0 ? rooms.length : 9;
  const availableRoomsCount = Math.max(
    0,
    totalMasterRooms - bookedRoomsToday.size,
  );

  const sendWhatsAppNotification = (
    agendaData: any,
    status: "Disetujui" | "Ditolak",
    reason?: string,
  ) => {
    if (!agendaData.phone) {
      console.warn("Nomor WhatsApp pemohon tidak tersedia di database.");
      return;
    }

    let cleanPhone = agendaData.phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const statusText = status === "Disetujui" ? "DISETUJUI ✅" : "DITOLAK ❌";
    const dateRangeText =
      agendaData.date === agendaData.endDate || !agendaData.endDate
        ? `tanggal ${agendaData.date}`
        : `tanggal ${agendaData.date} s.d. ${agendaData.endDate}`;

    let message = `Halo ${agendaData.pic || "Pemohon"},

Pengajuan reservasi ruangan *${agendaData.room || "Ruang Rapat OJK"}* untuk kegiatan *${agendaData.title || "Agenda Rapat"}* pada ${dateRangeText} (${agendaData.time || "08:00 - 17:00"} WIB) telah *${statusText}*.`;

    if (status === "Ditolak" && reason) {
      message += `\n\n📝 *Alasan Penolakan:* ${reason}`;
    }

    message += `\n\nTerima kasih.\n_Bagian Layanan Manajemen Strategis Kantor OJK Sumatera Selatan_`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const openConfirmModal = (
    agendaId: string,
    title: string,
    actionType: "approve" | "reject",
  ) => {
    setConfirmModal({
      isOpen: true,
      agendaId,
      title,
      actionType,
      rejectReason: "",
    });
  };

const handleExecuteAction = async () => {
  if (!confirmModal.agendaId || !confirmModal.actionType) return;

  try {
    setIsExecutingAction(true);

    const selectedAgenda: any = agendas.find(
      (a) => a.id === confirmModal.agendaId,
    );
    if (!selectedAgenda) return;

    const newStatus =
      confirmModal.actionType === "approve" ? "Disetujui" : "Ditolak";

    // LOGIKA BARU: Jangan timpa notes jika disetujui!
    // Pertahankan request asli dari pemohon agar tidak hilang.
    let notesPayload = selectedAgenda.notes;
    if (confirmModal.actionType === "reject") {
      const originalNote = selectedAgenda.notes
        ? ` (Catatan awal: ${selectedAgenda.notes})`
        : "";
      notesPayload = `[ALASAN DITOLAK]: ${confirmModal.rejectReason}${originalNote}`;
    }

    const res = await fetch("/api/agendas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: confirmModal.agendaId,
        status: newStatus,
        notes: notesPayload, // Mengirim catatan yang aman
      }),
    });

    if (res.ok) {
      sendWhatsAppNotification(
        selectedAgenda,
        newStatus,
        confirmModal.rejectReason,
      );

      await loadDashboardData(false);
      setConfirmModal({
        isOpen: false,
        agendaId: null,
        title: null,
        actionType: null,
        rejectReason: "",
      });
    } else {
      const errData = await res.json();
      alert(
        `Gagal memproses status reservasi: ${errData.message || "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error("Error processing agenda status:", error);
  } finally {
    setIsExecutingAction(false);
  }
};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 sm:space-y-8 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full pb-12"
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

      {/* ================= MODAL PENGUMUMAN UPDATE TERBARU (WELCOME POPUP) ================= */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#9f1521] flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  PEMBARUAN SISTEM V2.5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Selamat Datang di AMPERA
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Kami telah merilis sejumlah pembaruan fitur untuk mengoptimalkan
              manajemen fasilitas dan pengalaman operasional di lingkungan OJK
              Provinsi Sumatera Selatan:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 max-h-[45vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Validasi Cerdas Ruang Komunal:
                  </strong>{" "}
                  Reservasi Ruang Komunal kini terintegrasi dengan status
                  Ballroom. Komunal otomatis tidak dapat dipesan apabila
                  Ballroom sedang digunakan dalam kapasitas maksimal (500
                  peserta) atau menggunakan konfigurasi <em>Round Table</em>{" "}
                  (≥200 peserta).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Sistem Plotting Armada Dinas:
                  </strong>{" "}
                  Mekanisme peminjaman kendaraan dialihkan menjadi pengajuan
                  terpusat. Alokasi unit armada kini akan dikelola dan di-
                  <em>plot</em> secara langsung oleh Admin LMSt.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Pembatalan Agenda Mandiri:
                  </strong>{" "}
                  Pengguna dengan hak akses Internal kini diberikan otoritas
                  penuh untuk membatalkan pengajuan agenda secara langsung
                  melalui menu Daftar Agenda.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Rekomendasi Kapasitas Ruangan:
                  </strong>{" "}
                  Direktori ruangan kini dilengkapi filter presisi yang
                  merekomendasikan fasilitas terbaik berdasarkan spesifikasi
                  jumlah peserta kegiatan Anda.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">
                    Transparansi Rincian Kegiatan:
                  </strong>{" "}
                  Tinjauan detail setiap agenda kini dapat diakses lebih
                  mendalam secara langsung melalui{" "}
                  <em>Dashboard Live Status</em> oleh pengguna Internal dan
                  Admin.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseUpdateModal}
                className="w-full py-3.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-rose-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                Mengerti, Lanjutkan ke Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* ================= TOP HEADER BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm border-l-4 border-l-[#9f1521]">
        <div>
          <div className="flex items-center gap-2 text-[#9f1521] font-extrabold text-[10px] tracking-widest uppercase mb-1">
            <ShieldCheck size={14} /> Panel Operasional OJK Sumsel
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Selamat Datang,{" "}
            {user?.name || (isExternal ? "Tamu Eksternal" : "Pegawai OJK")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isExternal
              ? "Akses portal eksternal OJK Sumsel untuk melihat katalog fasilitas ruangan dan layanan instansi."
              : "Pantau ketersediaan ruang rapat, jadwal kegiatan live, dan status pengajuan fasilitas secara real-time."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-right">
            <span className="block text-[9px] font-extrabold text-[#9f1521] uppercase tracking-wider">
              HARI INI
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD EKSTERNAL */}
      {isExternal ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Menu & Layanan Eksternal Tersedia
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Silakan pilih modul di bawah ini untuk melihat informasi fasilitas
              atau mengajukan layanan yang Anda butuhkan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/ruangan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 w-fit rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Katalog Ruangan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Lihat daftar dan ketersediaan ruang rapat OJK Sumsel.
                  </p>
                </div>
              </Link>

              <Link
                href="/kendaraan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 w-fit rounded-xl">
                  <Car size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Peminjaman Kendaraan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Informasi layanan armada operasional instansi.
                  </p>
                </div>
              </Link>

              <Link
                href="/partner"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-fit rounded-xl">
                  <Hotel size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Hotel Rekanan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Daftar hotel mitra kerja sama instansi.
                  </p>
                </div>
              </Link>

              <Link
                href="/bantuan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 w-fit rounded-xl">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Pusat Bantuan & Vendor
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Layanan pengaduan, kontak, dan informasi vendor.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* ================= OVERVIEW METRICS CARDS ================= */}
          <div
            className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}
          >
            <div className="bg-gradient-to-br from-amber-50/70 to-white dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70 dark:text-amber-400">
                  Total Agenda
                </span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <CalendarDays size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  <Counter value={totalAgendas} />
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Agenda kedinasan tercatat
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/70 to-white dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-400">
                  Disetujui
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  <Counter value={totalDisetujui} />
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Jadwal aktif & siap pakai
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="bg-gradient-to-br from-rose-50/70 to-white dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-rose-200/60 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900/70 dark:text-rose-400">
                    Pending Review
                  </span>
                  <div className="p-2 rounded-xl bg-rose-100 text-[#9f1521]">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#9f1521] dark:text-rose-400">
                    <Counter value={totalPending} />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Menunggu verifikasi admin
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50/70 to-white dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-blue-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900/70 dark:text-blue-400">
                  Ruangan Tersedia
                </span>
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Building2 size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  <Counter value={availableRoomsCount} />
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Unit siap dipesan hari ini
                </p>
              </div>
            </div>
          </div>

          {/* ================= GRID LIVE & AGENDA TERDEKAT ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-[320px] sm:h-[340px]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                    LIVE STATUS
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                    Sedang Berlangsung
                  </h2>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 text-xs font-bold rounded-full">
                  {liveAgendas.length} Acara
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {liveAgendas.length > 0 ? (
                  liveAgendas.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        setDetailModal({ isOpen: true, data: item })
                      }
                      className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400 rounded-xl space-y-2 cursor-pointer transition-all shadow-2xs group"
                    >
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock
                            size={14}
                            className="text-emerald-600 shrink-0"
                          />
                          {item.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin
                            size={14}
                            className="text-emerald-600 shrink-0"
                          />
                          {item.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users
                            size={14}
                            className="text-emerald-600 shrink-0"
                          />
                          {item.pic}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium italic text-center px-4">
                    Saat ini tidak ada agenda yang sedang berlangsung.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-[320px] sm:h-[340px]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521] dark:text-rose-400">
                    PERSIAPAN ACARA
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                    Agenda Terdekat
                  </h2>
                </div>
                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 border border-rose-200 text-xs font-bold rounded-full">
                  {upcomingAgendas.length} Acara
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {upcomingAgendas.length > 0 ? (
                  upcomingAgendas.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        setDetailModal({ isOpen: true, data: item })
                      }
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:border-[#9f1521]/60 rounded-xl space-y-2 cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                          {formatAgendaDate(item.date, item.endDate)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock
                            size={14}
                            className="text-[#9f1521] shrink-0"
                          />
                          {item.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin
                            size={14}
                            className="text-[#9f1521] shrink-0"
                          />
                          {item.room}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium italic text-center px-4">
                    Belum ada agenda terkonfirmasi untuk ditampilkan.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= PANEL PENGAJUAN PENDING (ADMIN) ================= */}
          {isAdmin && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/60 dark:border-amber-900/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Bell size={14} /> MENUNGGU VERIFIKASI
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Pengajuan Pending ({totalPending})
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium max-w-md">
                  Daftar reservasi ruangan yang membutuhkan peninjauan dan
                  persetujuan Admin.
                </p>
              </div>

              {pendingAgendas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingAgendas.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            PENDING
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {formatAgendaDate(item.date, item.endDate)}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {item.room} • {item.time}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          PIC: {item.pic} ({item.dept || "Umum"})
                        </p>
                      </div>

                      {/* TOMBOL AKSI */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() =>
                            setDetailModal({ isOpen: true, data: item })
                          }
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={14} /> Lihat Detail Lengkap
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openConfirmModal(item.id, item.title, "reject")
                            }
                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            <XCircle size={14} /> Tolak
                          </button>
                          <button
                            onClick={() =>
                              openConfirmModal(item.id, item.title, "approve")
                            }
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Setujui
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 font-medium italic bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-amber-200">
                  Tidak ada pengajuan yang membutuhkan tindakan persetujuan saat
                  ini.
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* MODAL DETAIL INFORMASI LENGKAP PENGAJUAN / AGENDA */}
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-hidden my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  INFORMASI DETAIL KEGIATAN
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Detail Rapat & Agenda
                </h3>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, data: null })}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Nama Kegiatan:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold text-right">
                    {detailModal.data?.title || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Tanggal Pelaksanaan:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {detailModal.data?.date
                      ? detailModal.data.date.slice(0, 10)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Waktu Acara:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {detailModal.data?.start_time
                      ? `${detailModal.data.start_time.slice(0, 5)} - ${detailModal.data.end_time?.slice(0, 5)}`
                      : detailModal.data?.time || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Ruangan Dipilih:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {detailModal.data?.room_name ||
                      detailModal.data?.room ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Tata Letak (Layout):
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {detailModal.data?.layout || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Jumlah Peserta:
                  </span>
                  <span className="text-emerald-600 font-bold">
                    {detailModal.data?.total_participants
                      ? `${detailModal.data.total_participants} Orang`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Pimpinan Rapat:
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {detailModal.data?.meeting_leader || "-"}
                  </span>
                </div>

                <div className="flex justify-between items-start pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium">
                    Catatan / Request:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium text-right max-w-[240px] italic">
                    {detailModal.data?.notes ||
                      detailModal.data?.note ||
                      "Tidak ada catatan tambahan."}
                  </span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2.5 border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Penanggung Jawab (PIC):
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.pic}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    No. WhatsApp Pemohon:
                  </span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {detailModal.data.phone || "-"}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Satuan Kerja (Satker):
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.dept || "OJK Sumsel"}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Status Pengajuan:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {detailModal.data.status ||
                      detailModal.data.smartStatus ||
                      "Disetujui"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI (ADMIN) ================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100 dark:border-slate-800"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                confirmModal.actionType === "approve"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600"
                  : "bg-rose-100 dark:bg-rose-900/40 text-rose-600"
              }`}
            >
              {confirmModal.actionType === "approve" ? (
                <CheckCircle2 size={24} />
              ) : (
                <XCircle size={24} />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {confirmModal.actionType === "approve"
                  ? "Konfirmasi Persetujuan"
                  : "Konfirmasi Penolakan"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.actionType === "approve" ? (
                  <>
                    Apakah benar Anda ingin menyetujui rapat{" "}
                    <strong>&quot;{confirmModal.title}&quot;</strong> ini?
                  </>
                ) : (
                  <>
                    Berikan alasan penolakan untuk rapat{" "}
                    <strong>&quot;{confirmModal.title}&quot;</strong>:
                  </>
                )}
              </p>
            </div>

            {confirmModal.actionType === "reject" && (
              <div className="text-left space-y-1 pt-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                  Catatan / Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  value={confirmModal.rejectReason}
                  onChange={(e) =>
                    setConfirmModal({
                      ...confirmModal,
                      rejectReason: e.target.value,
                    })
                  }
                  placeholder="Contoh: Ruangan sudah digunakan untuk agenda penting lain pada jam tersebut."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    agendaId: null,
                    title: null,
                    actionType: null,
                    rejectReason: "",
                  })
                }
                disabled={isExecutingAction}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isExecutingAction}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                  confirmModal.actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isExecutingAction && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                {isExecutingAction
                  ? "Memproses..."
                  : confirmModal.actionType === "approve"
                    ? "Ya, Setujui"
                    : "Ya, Tolak"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
