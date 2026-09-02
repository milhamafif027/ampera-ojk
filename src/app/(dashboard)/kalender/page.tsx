"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Clock,
  Building2,
  User,
  Car,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";

interface VehicleBookingItem {
  id: string;
  vehicleName: string;
  plateNumber: string;
  startDate: string;
  endDate: string;
  time: string;
  borrower: string;
  destination: string;
  status: string;
}

export default function KalenderPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<VehicleBookingItem[]>(
    [],
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDateModal, setSelectedDateModal] = useState<{
    isOpen: boolean;
    dateStr: string;
    agendas: Agenda[];
    vehicles: VehicleBookingItem[];
  }>({
    isOpen: false,
    dateStr: "",
    agendas: [],
    vehicles: [],
  });

  const fetchAllCalendarData = useCallback(async () => {
    try {
      setIsLoading(true);

      const resAgendas = await fetch("/api/agendas");
      const resultAgendas = await resAgendas.json();

      const resVehicles = await fetch("/api/kendaraan");
      const resultVehicles = await resVehicles.json();

      if (resAgendas.ok && resultAgendas.data) {
        const mappedAgendas: Agenda[] = resultAgendas.data
          .filter((item: any) => item.status !== "Ditolak")
          .map((item: any) => {
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

            // PERBAIKAN FORMAT WAKTU AGAR TIDAK MUNCUL 1970-
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
              time: formattedTime,
              room: item.room_name || item.room || "Ruang Rapat OJK",
              pic: item.pic || "Pegawai OJK",
              dept: item.dept || "OJK Sumsel",
              status: item.status || "Pending",
            };

            return {
              ...agendaItem,
              smartStatus: getSmartStatus(agendaItem) as StatusPengajuan,
            };
          });

        setAgendas(mappedAgendas);
      }
      
      if (resVehicles.ok && resultVehicles.bookings) {
        const mappedBookings: VehicleBookingItem[] = resultVehicles.bookings
          .filter((item: any) => item.status === "Disetujui") // Hanya menyaring yang berstatus Disetujui
          .map((item: any) => {
            let startDate = item.start_date ? String(item.start_date) : "";
            if (startDate.includes("T")) startDate = startDate.split("T")[0];

            let endDate = item.end_date ? String(item.end_date) : startDate;
            if (endDate.includes("T")) endDate = endDate.split("T")[0];

            return {
              id: String(item.id),
              vehicleName: item.vehicle_name || "Kendaraan Dinas",
              plateNumber: item.plate_number || "OJK",
              startDate: startDate,
              endDate: endDate,
              time: "08:00 - 17:00",
              borrower: item.borrower || item.pic || "Pegawai OJK",
              destination: item.destination || "-",
              status: item.status,
            };
          });

        setVehicleBookings(mappedBookings);
      }
    } catch (error) {
      console.error("Gagal mengambil data kalender:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.resolve();
      fetchAllCalendarData();
    };
    loadData();
  }, [fetchAllCalendarData]);

  const monthNames = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, "0");
    const monthStr = (currentMonth + 1).toString().padStart(2, "0");

    const isoDateStr = `${currentYear}-${monthStr}-${dayStr}`;
    const altDateStr = `${dayStr}/${monthStr}/${currentYear}`;

    calendarDays.push({
      dayNum: d,
      isoDateStr,
      altDateStr,
    });
  }

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const handleDayClick = (
    isoDateStr: string,
    altDateStr: string,
    dayAgendas: Agenda[],
    dayVehicles: VehicleBookingItem[],
  ) => {
    if (dayAgendas.length === 0 && dayVehicles.length === 0) return;
    setSelectedDateModal({
      isOpen: true,
      dateStr: isoDateStr,
      agendas: dayAgendas,
      vehicles: dayVehicles,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-[#9f1521]" size={22} /> Kalender Terpadu
            Kegiatan & Armada OJK
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Jadwal bulanan reservasi ruang rapat dan peminjaman kendaraan dinas
            OJK Sumsel. Klik tanggal untuk detail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllCalendarData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Kalender"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-3 uppercase tracking-wider">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold cursor-pointer"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[750px]">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((item, idx) => {
              if (!item)
                return (
                  <div
                    key={idx}
                    className="min-h-[120px] bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl"
                  />
                );

              const dayAgendas = agendas.filter((a) => {
                const cleanAgendaDate = a.date
                  ? String(a.date).split("T")[0]
                  : "";
                return cleanAgendaDate === item.isoDateStr;
              });

              const dayVehicles = vehicleBookings.filter((v) => {
                return (
                  item.isoDateStr >= v.startDate && item.isoDateStr <= v.endDate
                );
              });

              const hasAgendas = dayAgendas.length > 0;
              const hasVehicles = dayVehicles.length > 0;

              let badgeText = "";
              if (hasAgendas && hasVehicles) {
                badgeText = "Kegiatan & Peminjaman";
              } else if (hasAgendas) {
                badgeText = `${dayAgendas.length} Kegiatan`;
              } else if (hasVehicles) {
                badgeText = `${dayVehicles.length} Peminjaman`;
              }

              const nowLocal = new Date();
              const todayIsoStr = `${nowLocal.getFullYear()}-${String(
                nowLocal.getMonth() + 1,
              ).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(
                2,
                "0",
              )}`;
              const isToday = item.isoDateStr === todayIsoStr;

              return (
                <div
                  key={idx}
                  onClick={() =>
                    handleDayClick(
                      item.isoDateStr,
                      item.altDateStr,
                      dayAgendas,
                      dayVehicles,
                    )
                  }
                  className={`min-h-[120px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:border-[#9f1521]/50 hover:shadow-sm ${
                    isToday
                      ? "border-[#9f1521] bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-[#9f1521] text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.dayNum}
                    </span>
                    {badgeText && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-[#9f1521] dark:text-rose-300 rounded-full truncate max-w-[90px]"
                        title={badgeText}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayAgendas.map((a) => {
                      // Penentuan warna shape agenda berdasarkan status
                      let shapeColorClass =
                        "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"; // Disetujui (Hijau)
                      if (a.smartStatus === "Sedang Berlangsung") {
                        shapeColorClass =
                          "bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200"; // Sedang Berlangsung (Biru)
                      } else if (
                        a.smartStatus === "Pending" ||
                        a.status === "Pending"
                      ) {
                        shapeColorClass =
                          "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"; // Pending (Orange/Amber)
                      }

                      return (
                        <div
                          key={`agenda-${a.id}`}
                          className={`p-1 rounded-lg text-[9px] font-bold truncate leading-tight ${shapeColorClass}`}
                          title={`[Rapat] ${a.title} (${a.room})`}
                        >
                          🏛️ {a.time ? a.time.split(" - ")[0] : ""} • {a.title}
                        </div>
                      );
                    })}

                    {dayVehicles.map((v) => (
                      <div
                        key={`vehicle-${v.id}`}
                        className="p-1 rounded-lg text-[9px] font-bold truncate leading-tight bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200"
                        title={`[Mobil Dinas] ${v.vehicleName} (${v.plateNumber})`}
                      >
                        🚗 {v.vehicleName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DETAIL KEGIATAN & KENDARAAN PADA TANGGAL TERSEBUT */}
      {selectedDateModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  INFORMASI JADWAL TERPADU
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Tanggal: {selectedDateModal.dateStr}
                </h3>
              </div>
              <button
                onClick={() =>
                  setSelectedDateModal({
                    isOpen: false,
                    dateStr: "",
                    agendas: [],
                    vehicles: [],
                  })
                }
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {selectedDateModal.agendas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600" /> Agenda
                    Ruang Rapat ({selectedDateModal.agendas.length})
                  </h4>
                  {selectedDateModal.agendas.map((agenda) => {
                    // Warna badge status di dalam modal detail
                    let badgeColorClass =
                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"; // Hijau (Disetujui)
                    if (agenda.smartStatus === "Sedang Berlangsung") {
                      badgeColorClass =
                        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"; // Biru
                    } else if (
                      agenda.smartStatus === "Pending" ||
                      agenda.status === "Pending"
                    ) {
                      badgeColorClass =
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"; // Orange/Amber
                    }

                    return (
                      <div
                        key={agenda.id}
                        className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                            {agenda.title}
                          </h5>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${badgeColorClass}`}
                          >
                            {agenda.smartStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock
                              size={14}
                              className="text-[#9f1521] shrink-0"
                            />{" "}
                            {agenda.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2
                              size={14}
                              className="text-[#9f1521] shrink-0"
                            />{" "}
                            {agenda.room}
                          </span>
                          <span className="flex items-center gap-1.5 sm:col-span-2">
                            <User
                              size={14}
                              className="text-[#9f1521] shrink-0"
                            />{" "}
                            PIC: {agenda.pic} ({agenda.dept || "OJK Sumsel"})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDateModal.vehicles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Car size={14} className="text-purple-600" /> Armada
                    Kendaraan Dipakai ({selectedDateModal.vehicles.length})
                  </h4>
                  {selectedDateModal.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          {v.vehicleName}{" "}
                          <span className="text-xs font-semibold text-slate-500">
                            ({v.plateNumber})
                          </span>
                        </h5>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400">
                          {v.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            className="text-purple-600 shrink-0"
                          />{" "}
                          Periode: {v.startDate} s.d. {v.endDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin
                            size={14}
                            className="text-purple-600 shrink-0"
                          />{" "}
                          Tujuan: {v.destination}
                        </span>
                        <span className="flex items-center gap-1.5 sm:col-span-2">
                          <User
                            size={14}
                            className="text-purple-600 shrink-0"
                          />{" "}
                          Peminjaman: {v.borrower}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDateModal.agendas.length === 0 &&
                selectedDateModal.vehicles.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium italic">
                    Tidak ada agenda ruangan atau peminjaman kendaraan pada
                    tanggal ini.
                  </div>
                )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() =>
                  setSelectedDateModal({
                    isOpen: false,
                    dateStr: "",
                    agendas: [],
                    vehicles: [],
                  })
                }
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
