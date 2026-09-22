"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus, formatAgendaDate } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
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
  Loader2,
  X,
  BookOpen,
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

  // State untuk Pengajuan Pending Kendaraan di Dashboard Utama
  const [vehicleBookings, setVehicleBookings] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [vehicleApprovalModal, setVehicleApprovalModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    vehicleName: string;
    phone?: string;
    actionType: "approve" | "reject" | null;
  }>({
    isOpen: false,
    bookingId: null,
    vehicleName: "",
    phone: "",
    actionType: null,
  });

  const [vehicleApprovalForm, setVehicleApprovalForm] = useState({
    selectedVehicle: "",
    totalPassengers: "1",
    notes: "Disetujui, kendaraan dan driver telah disiapkan.",
  });
  const [isExecutingVehicleAction, setIsExecutingVehicleAction] =
    useState(false);

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

  const loadDashboardData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const [resAgendas, resRooms, resVehicles] = await Promise.all([
        fetch("/api/agendas"),
        fetch("/api/ruangan"),
        fetch("/api/kendaraan"),
      ]);

      const resultAgendas = await resAgendas.json();
      const resultRooms = await resRooms.json();
      const resultVehicles = await resVehicles.json();

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

      if (resVehicles.ok) {
        if (resultVehicles.bookings) {
          setVehicleBookings(resultVehicles.bookings);
        }
        if (resultVehicles.vehicles) {
          setAvailableVehicles(resultVehicles.vehicles);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

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

    let message = `Halo ${agendaData.pic || "Pemohon"},\n\nPengajuan reservasi ruangan *${agendaData.room || "Ruang Rapat OJK"}* untuk kegiatan *${agendaData.title || "Agenda Rapat"}* pada ${dateRangeText} (${agendaData.time || "08:00 - 17:00"} WIB) telah *${statusText}*.`;

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
          notes: notesPayload,
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

  const handleExecuteVehicleApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleApprovalModal.bookingId || !vehicleApprovalModal.actionType)
      return;

    if (
      vehicleApprovalModal.actionType === "approve" &&
      !vehicleApprovalForm.selectedVehicle
    ) {
      alert("Pilih armada kendaraan terlebih dahulu.");
      return;
    }

    try {
      setIsExecutingVehicleAction(true);
      const newStatus =
        vehicleApprovalModal.actionType === "approve" ? "Disetujui" : "Ditolak";

      const res = await fetch("/api/kendaraan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_booking",
          id: vehicleApprovalModal.bookingId,
          nama_kendaraan: vehicleApprovalForm.selectedVehicle || "Ditolak",
          total_passengers: vehicleApprovalForm.totalPassengers,
          approval_notes: vehicleApprovalForm.notes,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const targetBooking = vehicleBookings.find(
          (b) => String(b.id) === String(vehicleApprovalModal.bookingId),
        );

        if (vehicleApprovalModal.phone && targetBooking) {
          let cleanPhone = vehicleApprovalModal.phone.replace(/\D/g, "");
          if (cleanPhone.startsWith("0"))
            cleanPhone = "62" + cleanPhone.slice(1);

          const statusText =
            newStatus === "Disetujui" ? "DISETUJUI ✅" : "DITOLAK ❌";
          let message = `Halo ${targetBooking.peminjam || targetBooking.borrower || "Bapak/Ibu"},\n\nPengajuan peminjaman Kendaraan Dinas OJK Sumsel dengan tujuan *${targetBooking.tujuan || targetBooking.destination}* telah *${statusText}*.`;

          if (newStatus === "Disetujui") {
            message += `\n\n🚗 *Armada / Driver:* ${vehicleApprovalForm.selectedVehicle}\n📝 *Catatan:* ${vehicleApprovalForm.notes}`;
          } else {
            message += `\n\n📝 *Alasan Penolakan:* ${vehicleApprovalForm.notes}`;
          }

          message += `\n\nTerima kasih.\n_Bagian Layanan Manajemen Strategis Kantor OJK Sumatera Selatan_`;

          window.open(
            `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
            "_blank",
          );
        }

        await loadDashboardData(false);
        setVehicleApprovalModal({
          isOpen: false,
          bookingId: null,
          vehicleName: "",
          phone: "",
          actionType: null,
        });
      } else {
        alert("Gagal memproses status peminjaman kendaraan.");
      }
    } catch (err) {
      console.error("Error processing vehicle status:", err);
    } finally {
      setIsExecutingVehicleAction(false);
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

      {/* TOP HEADER BAR */}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Menu & Layanan Eksternal Tersedia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih modul layanan di bawah untuk mengakses informasi instansi.
              </p>
            </div>

            {/* Grid 4 Kartu Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Menu 1: Katalog Ruangan */}
              <Link
                href="/ruangan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg"
              >
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 w-fit rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Katalog Ruangan
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Lihat daftar dan ketersediaan ruang rapat OJK Sumsel.
                  </p>
                </div>
              </Link>

              {/* Menu 2: Panduan & SOP */}
              <Link
                href="/panduan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 w-fit rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Panduan & SOP
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Tata cara pengajuan dan prosedur kunjungan resmi.
                  </p>
                </div>
              </Link>

              {/* Menu 3: Hotel Rekanan */}
              <Link
                href="/#hotel"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg"
              >
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 w-fit rounded-xl">
                  <Hotel size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Hotel Rekanan
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Daftar akomodasi mitra resmi untuk keperluan dinas.
                  </p>
                </div>
              </Link>

              {/* Menu 4: Pusat Bantuan */}
              <Link
                href="/bantuan"
                className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:border-[#9f1521] transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-fit rounded-xl">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#9f1521] transition-colors">
                    Pusat Bantuan
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Hubungi tim administrasi atau IT Support OJK Sumsel.
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
          {/* OVERVIEW METRICS CARDS */}
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

          {/* GRID LIVE & AGENDA TERDEKAT */}
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

          {/* PANEL PENGAJUAN PENDING (ADMIN - RUANGAN) */}
          {isAdmin && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/60 dark:border-amber-900/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Bell size={14} /> MENUNGGU VERIFIKASI RUANGAN
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Pengajuan Pending ({totalPending})
                  </h2>
                </div>
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
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() =>
                            setDetailModal({ isOpen: true, data: item })
                          }
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                  Tidak ada pengajuan ruangan yang membutuhkan tindakan saat
                  ini.
                </div>
              )}
            </div>
          )}

          {/* PANEL PENGAJUAN PENDING KENDARAAN (ADMIN) */}
          {isAdmin && (
            <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-5 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-200/60 dark:border-blue-900/30 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Car size={14} /> REQUEST KENDARAAN DINAS PENDING
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Peminjaman Kendaraan Menunggu Plotting (
                    {
                      vehicleBookings.filter((b) => b.status === "Pending")
                        .length
                    }
                    )
                  </h2>
                </div>
              </div>

              {vehicleBookings.filter((b) => b.status === "Pending").length >
              0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleBookings
                    .filter((b) => b.status === "Pending")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              PENDING KENDARAAN
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {item.tanggal_mulai || item.start_date}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#9f1521]" />{" "}
                            Tujuan: {item.tujuan || item.destination}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Peminjam:{" "}
                            <strong>{item.peminjam || item.borrower}</strong> (
                            {item.satker || item.dept})
                          </p>
                          <p className="text-xs text-slate-400">
                            Jumlah Penumpang:{" "}
                            {item.total_passengers || item.passengers || 1}{" "}
                            Orang • No HP: {item.phone || "-"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                          <button
                            onClick={() => {
                              setVehicleApprovalModal({
                                isOpen: true,
                                bookingId: String(item.id),
                                vehicleName:
                                  item.nama_kendaraan || item.vehicleName || "",
                                phone: item.phone || "",
                                actionType: "reject",
                              });
                              setVehicleApprovalForm({
                                selectedVehicle: "",
                                totalPassengers: String(
                                  item.total_passengers ||
                                    item.passengers ||
                                    "1",
                                ),
                                notes:
                                  "Mohon maaf, kendaraan tidak tersedia pada tanggal tersebut.",
                              });
                            }}
                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            <XCircle size={14} /> Tolak
                          </button>

                          <button
                            onClick={() => {
                              setVehicleApprovalModal({
                                isOpen: true,
                                bookingId: String(item.id),
                                vehicleName:
                                  item.nama_kendaraan || item.vehicleName || "",
                                phone: item.phone || "",
                                actionType: "approve",
                              });
                              setVehicleApprovalForm({
                                selectedVehicle: "",
                                totalPassengers: String(
                                  item.total_passengers ||
                                    item.passengers ||
                                    "1",
                                ),
                                notes:
                                  "Disetujui, kendaraan dan driver telah disiapkan.",
                              });
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Plotting & Setujui
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 font-medium italic bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-blue-200">
                  Tidak ada pengajuan kendaraan yang membutuhkan plotting saat
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
                <X size={20} />
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
                  {/* PERBAIKAN: Menggunakan formatAgendaDate agar sesuai kaidah Indonesia */}
                  <span className="text-slate-900 dark:text-white font-bold text-right">
                    {formatAgendaDate(
                      detailModal.data?.date,
                      detailModal.data?.endDate,
                    )}
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

      {/* MODAL AKSI KENDARAAN (SETUJU / TOLAK) DI DASHBOARD */}
      {vehicleApprovalModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {vehicleApprovalModal.actionType === "approve"
                  ? "Plotting & Setujui Kendaraan"
                  : "Konfirmasi Penolakan Kendaraan"}
              </h3>
              <button
                onClick={() =>
                  setVehicleApprovalModal({
                    isOpen: false,
                    bookingId: null,
                    vehicleName: "",
                    phone: "",
                    actionType: null,
                  })
                }
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleExecuteVehicleApproval}
              className="space-y-4 text-xs"
            >
              {vehicleApprovalModal.actionType === "approve" && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                    Pilih Armada Kendaraan (Tersedia)
                  </label>
                  <select
                    value={vehicleApprovalForm.selectedVehicle}
                    onChange={(e) =>
                      setVehicleApprovalForm({
                        ...vehicleApprovalForm,
                        selectedVehicle: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold cursor-pointer text-slate-800 dark:text-slate-100"
                    required
                  >
                    <option value="">-- Pilih Kendaraan --</option>
                    {availableVehicles
                      .filter((v: any) => v.status === "Tersedia")
                      .map((v: any) => (
                        <option key={v.id} value={v.name || v.nama_kendaraan}>
                          {v.name || v.nama_kendaraan} (
                          {v.plate_number || v.no_plat}) -{" "}
                          {v.type || v.kapasitas}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  {vehicleApprovalModal.actionType === "approve"
                    ? "Catatan / Instruksi Supir"
                    : "Alasan Penolakan"}
                </label>
                <textarea
                  rows={3}
                  value={vehicleApprovalForm.notes}
                  onChange={(e) =>
                    setVehicleApprovalForm({
                      ...vehicleApprovalForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none font-medium"
                  placeholder={
                    vehicleApprovalModal.actionType === "approve"
                      ? "Contoh: Supir Bpk. Budi, standby jam 08:00."
                      : "Contoh: Seluruh armada sedang digunakan untuk agenda pimpinan."
                  }
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setVehicleApprovalModal({
                      isOpen: false,
                      bookingId: null,
                      vehicleName: "",
                      phone: "",
                      actionType: null,
                    })
                  }
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isExecutingVehicleAction}
                  className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    vehicleApprovalModal.actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isExecutingVehicleAction && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {vehicleApprovalModal.actionType === "approve"
                    ? "Plotting & Setujui"
                    : "Konfirmasi Tolak"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI (ADMIN) */}
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
            </div>

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
