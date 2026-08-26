"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus } from "@/lib/utils";
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
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal Pop-up Konfirmasi Persetujuan / Penolakan Admin
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

  // State untuk Modal Detail Informasi Pengajuan Admin
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({
    isOpen: false,
    data: null,
  });

  // 1. Fungsi Fetch Data dari API MySQL
  const fetchAgendas = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/agendas");
      const result = await res.json();

      if (res.ok && result.data) {
        const mappedAgendas: Agenda[] = result.data.map((item: any) => {
          const formattedDate = item.date ? item.date.split("T")[0] : "";
          const formattedTime =
            item.start_time && item.end_time
              ? `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`
              : item.time || "";

          const agendaItem = {
            id: String(item.id),
            title: item.title,
            date: formattedDate,
            time: formattedTime,
            room: item.room_name || item.room || "Ruang Rapat OJK",
            pic: item.pic || "Pegawai OJK",
            dept: item.dept || "OJK Sumsel",
            phone: item.phone || "",
            layout: item.layout || "-",
            status: item.status || "Pending",
            total_participants: item.total_participants || 1,
            meeting_leader: item.meeting_leader || "-",
          };

          return {
            ...agendaItem,
            smartStatus: getSmartStatus(agendaItem) as StatusPengajuan,
          };
        });

        setAgendas(mappedAgendas);
      }
    } catch (error) {
      console.error("Gagal mengambil data agenda dari MySQL:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Inisialisasi Sesi User & Panggil Data
  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();

      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca data user:", err);
        }
      }

      fetchAgendas();
    };

    initData();
  }, [fetchAgendas]);

  // Status Role
  const isAdmin = user?.role === "admin";
  const isExternal = user?.role === "eksternal";

  // 3. Filter Data Berdasarkan Smart Status
  const liveAgendas = agendas.filter(
    (a) => a.smartStatus === "Sedang Berlangsung",
  );

  const upcomingAgendas = agendas
    .filter((a) => a.smartStatus === "Disetujui")
    .sort((a, b) => {
      const dtA =
        a.date.split("/").reverse().join("-") + "T" + a.time.split(" - ")[0];
      const dtB =
        b.date.split("/").reverse().join("-") + "T" + b.time.split(" - ")[0];
      return dtA.localeCompare(dtB);
    });

  const pendingAgendas = agendas.filter(
    (a) => a.smartStatus === "Pending" || a.status === "Pending",
  );

  // Metrik Statistik
  const totalAgendas = agendas.length;
  const totalDisetujui = agendas.filter(
    (a) =>
      a.smartStatus === "Disetujui" ||
      a.smartStatus === "Sedang Berlangsung" ||
      a.status === "Disetujui",
  ).length;
  const totalPending = pendingAgendas.length;
  const totalRuanganTerpakai = new Set(agendas.map((a) => a.room)).size;

  // 4. Helper untuk Membuka WhatsApp Otomatis
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
    let message = `Halo ${agendaData.pic || "Bapak/Ibu"},

Pengajuan reservasi ruangan *${agendaData.room || "Rapat"}* untuk kegiatan *${agendaData.title || "Agenda"}* pada tanggal ${agendaData.date || "-"} telah *${statusText}*.`;

    if (status === "Ditolak" && reason) {
      message += `\n\n📝 *Alasan Penolakan:* ${reason}`;
    }

    message += `\n\nTerima kasih.\n_Sistem Manajemen OJK Sumsel_`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Buka Modal dengan Tipe Aksi (Approve atau Reject)
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

  // Eksekusi API PUT untuk Menyetujui atau Menolak Reservasi + Kirim WA
  const handleExecuteAction = async () => {
    if (!confirmModal.agendaId || !confirmModal.actionType) return;

    try {
      setIsExecutingAction(true);

      const selectedAgenda: any = agendas.find(
        (a) => a.id === confirmModal.agendaId,
      );
      if (!selectedAgenda) return;

      const [startTime, endTime] = selectedAgenda.time.split(" - ");
      const newStatus =
        confirmModal.actionType === "approve" ? "Disetujui" : "Ditolak";
      const notesPayload =
        confirmModal.actionType === "reject"
          ? confirmModal.rejectReason
          : "Disetujui oleh Admin";

      const res = await fetch("/api/agendas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: confirmModal.agendaId,
          title: selectedAgenda.title,
          date: selectedAgenda.date,
          start_time: startTime || "08:00",
          end_time: endTime || "10:00",
          pic: selectedAgenda.pic,
          phone: selectedAgenda.phone,
          status: newStatus,
          notes: notesPayload,
        }),
      });

      if (res.ok) {
        // [OTOMATIS KIRIM NOTIFIKASI WHATSAPP]
        sendWhatsAppNotification(
          selectedAgenda,
          newStatus,
          confirmModal.rejectReason,
        );

        await fetchAgendas();
        setConfirmModal({
          isOpen: false,
          agendaId: null,
          title: null,
          actionType: null,
          rejectReason: "",
        });
      } else {
        alert("Gagal memproses status reservasi.");
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
      className="space-y-8"
    >
      {/* WELCOME BANNER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#9f1521] to-[#7a1019] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 bg-white/20 border border-white/35 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-rose-200">
            {isExternal ? "PORTAL EKSTERNAL AMPERA" : "PORTAL INTERNAL AMPERA"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat Datang,{" "}
            {isAdmin ? "Admin TIM LMSt" : user?.name || "Tamu Eksternal OJK"}
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 font-medium max-w-xl leading-relaxed">
            {isExternal
              ? "Akses portal eksternal OJK Sumsel untuk melihat katalog fasilitas ruangan, layanan peminjaman kendaraan, hotel rekanan, dan pusat bantuan."
              : "Pantau ketersediaan ruang rapat, jadwal kegiatan live, dan status pengajuan fasilitas secara real-time dari database MySQL."}
          </p>
        </div>
        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <button
            onClick={fetchAgendas}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-right">
            <p className="text-[10px] font-bold text-rose-200 uppercase">
              Hari Ini
            </p>
            <p className="text-sm font-black text-white">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* KONTEN DASBOR KHUSUS EKSTERNAL */}
      {isExternal ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
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
          className="space-y-8"
        >
          {/* KARTU METRIK STATISTIK */}
          <div
            className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Total Agenda
                </span>
                <CalendarDays size={18} className="text-[#9f1521]" />
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white">
                {totalAgendas}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Terkonfirmasi
                </span>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">
                {totalDisetujui}
              </p>
            </div>

            {isAdmin && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    Pending
                  </span>
                  <AlertCircle size={18} className="text-amber-500" />
                </div>
                <p className="text-3xl font-black text-amber-500">
                  {totalPending}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Ruangan Terpakai
                </span>
                <Building2 size={18} className="text-blue-600" />
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white">
                {totalRuanganTerpakai}
              </p>
            </div>
          </div>

          {/* GRID LIVE STATUS & AGENDA TERDEKAT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel Kegiatan Berlangsung (Live) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[340px]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                    LIVE STATUS
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
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
                      className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-2"
                    >
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
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
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium italic">
                    Saat ini tidak ada agenda yang sedang berlangsung.
                  </div>
                )}
              </div>
            </div>

            {/* Panel Agenda Terdekat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[340px]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521] dark:text-rose-400">
                    PERSIAPAN ACARA
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
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
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                          {item.date}
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
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium italic">
                    Belum ada agenda terkonfirmasi untuk ditampilkan.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PANEL PENGAJUAN PENDING: HANYA MUNCUL UNTUK ADMIN */}
          {isAdmin && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200/60 dark:border-amber-900/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Bell size={14} /> MENUNGGU VERIFIKASI
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Pengajuan Pending ({totalPending})
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium max-w-md">
                  Daftar reservasi ruangan yang membutuhkan peninjauan dan
                  persetujuan Admin TIM LMSt.
                </p>
              </div>

              {pendingAgendas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingAgendas.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            PENDING
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {item.date}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {item.room} • {item.time}
                        </p>
                        <p className="text-xs text-slate-400">
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
                <div className="p-6 text-center text-xs text-slate-500 font-medium italic bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-amber-200">
                  Tidak ada pengajuan yang membutuhkan tindakan persetujuan saat
                  ini.
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* MODAL DETAIL INFORMASI LENGKAP PENGAJUAN */}
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-5 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  VERIFIKASI DATA PENGAJUAN
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Detail Informasi Reservasi
                </h3>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, data: null })}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2.5 border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Nama Kegiatan:
                  </span>
                  <strong className="text-slate-900 dark:text-white text-right">
                    {detailModal.data.title}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Tanggal Pelaksanaan:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.date}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Waktu Acara:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.time}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Ruangan Dipilih:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.room}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Tata Letak (Layout):
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.layout || "Standard"}
                  </strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-700/50">
                  <span className="text-slate-400 font-medium">
                    Jumlah Peserta:
                  </span>
                  <strong className="text-emerald-600 font-bold">
                    {detailModal.data.total_participants} Orang
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">
                    Pimpinan Rapat:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {detailModal.data.meeting_leader}
                  </strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2.5 border border-slate-200/60 dark:border-slate-800">
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
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    {detailModal.data.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const agendaId = detailModal.data.id;
                  const title = detailModal.data.title;
                  setDetailModal({ isOpen: false, data: null });
                  openConfirmModal(agendaId, title, "reject");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => {
                  const agendaId = detailModal.data.id;
                  const title = detailModal.data.title;
                  setDetailModal({ isOpen: false, data: null });
                  openConfirmModal(agendaId, title, "approve");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                Setujui Pengajuan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL POP-UP KONFIRMASI (SETUJU ATAU TOLAK) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl space-y-4 text-center"
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

            <div className="flex gap-2 pt-2">
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
