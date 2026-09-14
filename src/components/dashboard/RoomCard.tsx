"use client";

import React, { useState, useRef, memo } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Info,
  Users,
  Calendar,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Room } from "@/types";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

interface RoomCardProps {
  room: Room;
  isAdmin: boolean;
  user: LocalUser | null;
  getRoomLiveStatus: (name: string) => { isUsed: boolean; [key: string]: any };
  handleOpenBooking: (room: Room) => void;
  handleOpenEditModal: (room: Room) => void;
  handleDeleteRoom?: (roomId: string | number) => void;
  agendas?: any[];
  cardVariants?: Variants;
}

function RoomCard({
  room,
  isAdmin,
  getRoomLiveStatus,
  handleOpenBooking,
  handleOpenEditModal,
  handleDeleteRoom,
  agendas = [],
}: RoomCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Ref untuk mengontrol posisi scroll gambar secara otomatis
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State untuk Modal Lightbox / Zoom Gambar
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // State untuk Modal Cek Jadwal Ruangan
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const liveStatus = getRoomLiveStatus(room.name);

  const roomDesc =
    (room as any).description || "Perlengkapan: Proyektor | Sound System | AC";
  const roomLayout = (room as any).layout;

  // --- LOGIKA MENGURUSI LAYOUT & KAPASITAS DINAMIS BERDASARKAN DROPDOWN ---
  let availableLayouts: { layoutName: string; capacity: number }[] = [];
  const rawLayouts = (room as any).layouts;

  if (rawLayouts) {
    if (typeof rawLayouts === "string") {
      try {
        const parsed = JSON.parse(rawLayouts);
        if (Array.isArray(parsed)) availableLayouts = parsed;
      } catch {
        availableLayouts = [];
      }
    } else if (Array.isArray(rawLayouts)) {
      availableLayouts = rawLayouts;
    }
  }

  if (availableLayouts.length === 0) {
    availableLayouts = [
      {
        layoutName: roomLayout || "Theater",
        capacity: room.capacity
          ? Number(String(room.capacity).replace(/\D/g, "")) || 500
          : 500,
      },
    ];
  }

  const [selectedLayout, setSelectedLayout] = useState(availableLayouts[0]);

  const defaultImage =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";

  const roomImgs = (room as any).imgs;
  let roomImages: string[] = [defaultImage];
  if (roomImgs) {
    if (Array.isArray(roomImgs) && roomImgs.length > 0) {
      roomImages = roomImgs.filter(Boolean);
    } else if (typeof roomImgs === "string") {
      try {
        const parsed = JSON.parse(roomImgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          roomImages = parsed.filter(Boolean);
        }
      } catch {
        roomImages = [defaultImage];
      }
    }
  }

  // Perhitungan Tanggal yang Aman di Luar JSX
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  const formattedToday = todayObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  const formattedTomorrow = tomorrowObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      if (index !== activeImageIndex) {
        setActiveImageIndex(index);
      }
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
    }
    setActiveImageIndex(index);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex =
      activeImageIndex === 0 ? roomImages.length - 1 : activeImageIndex - 1;
    scrollToImage(newIndex);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex =
      activeImageIndex === roomImages.length - 1 ? 0 : activeImageIndex + 1;
    scrollToImage(newIndex);
  };

  const handleDelete = () => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus ruangan ${room.name} ${roomLayout ? `(${roomLayout})` : ""}?`,
      )
    ) {
      if (handleDeleteRoom) {
        handleDeleteRoom(room.id);
      }
    }
  };

  const handleEditClick = () => {
    let existingImages = roomImages;
    if (typeof roomImgs === "string") {
      try {
        existingImages = JSON.parse(roomImgs);
      } catch {
        existingImages = [defaultImage];
      }
    }

    const roomWithExistingImgs = {
      ...room,
      existingImgs: existingImages,
    };

    handleOpenEditModal(roomWithExistingImgs as Room);
  };

  // Filter Jadwal Berdasarkan Ruangan Ini
  const roomAgendas = agendas.filter((a) => {
    if (!a.room || a.room.toLowerCase() !== room.name.toLowerCase())
      return false;

    const isValidStatus =
      a.smartStatus === "Disetujui" || a.smartStatus === "Sedang Berlangsung";
    if (!isValidStatus) return false;

    if (a.date && a.date >= todayStr) {
      return true;
    }
    return false;
  });

  const getAvailableSlotsForDate = (targetDateStr: string) => {
    const operationalStart = "08:00";
    const operationalEnd = "17:00";

    const agendasOnDate = roomAgendas
      .filter((a) => a.date === targetDateStr && a.time)
      .map((a) => {
        const parts = a.time.split("-");
        if (parts.length === 2) {
          return {
            start: parts[0].trim().slice(0, 5),
            end: parts[1].trim().slice(0, 5),
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.start.localeCompare(b.start));

    if (agendasOnDate.length === 0) {
      return [`${operationalStart} - ${operationalEnd}`];
    }

    const slots: string[] = [];
    let currentTime = operationalStart;

    agendasOnDate.forEach((agenda: any) => {
      if (currentTime < agenda.start) {
        slots.push(`${currentTime} - ${agenda.start}`);
      }
      if (agenda.end > currentTime) {
        currentTime = agenda.end;
      }
    });

    if (currentTime < operationalEnd) {
      slots.push(`${currentTime} - ${operationalEnd}`);
    }

    return slots.length > 0 ? slots : ["Penuh (Tidak ada slot kosong)"];
  };

  const todayAvailableSlots = getAvailableSlotsForDate(todayStr);
  const tomorrowAvailableSlots = getAvailableSlotsForDate(tomorrowStr);

  const renderFormattedDescription = (text: string) => {
    if (!text) return null;
    const italicTerms = [
      "layout",
      "Theater",
      "Klasikal",
      "U-Shape",
      "Roundtable",
      "Videotron",
      "Infokus",
      "Proyektor",
      "Sound System",
      "Mic Delegate Wireless",
    ];
    const escapedTerms = italicTerms.map((term) =>
      term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
    );
    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = italicTerms.some(
        (term) => term.toLowerCase() === part.toLowerCase(),
      );
      if (isMatch) {
        return (
          <span key={i} className="italic font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md w-full relative transform-gpu"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "auto 320px",
        }}
      >
        <div>
          {/* Banner Galeri Foto (Dengan Akselerasi GPU) */}
          <div className="relative h-28 sm:h-32 w-full bg-slate-950 overflow-hidden group">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-zoom-in transform-gpu"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onClick={() => setLightboxImg(roomImages[activeImageIndex])}
              title="Klik untuk memperbesar gambar"
            >
              {roomImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative h-full w-full flex-shrink-0 snap-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageError ? defaultImage : imgUrl}
                    alt={`${room.name} - ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover transform-gpu transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>

            {roomImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10 shadow-sm"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10 shadow-sm"
                  title="Foto Berikutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}

            <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5 pointer-events-none">
              {liveStatus.isUsed ? (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                  Sedang Digunakan
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full shadow-sm">
                  Tersedia
                </span>
              )}
            </div>

            {roomImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full pointer-events-none">
                {roomImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1 rounded-full transition-all ${
                      activeImageIndex === idx
                        ? "w-2.5 bg-white"
                        : "w-1 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Informasi Isi Card */}
          <div className="p-3.5 flex flex-col space-y-2.5">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <h3
                  className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate"
                  title={room.name}
                >
                  {room.name}
                </h3>

                {/* DROPDOWN PILIHAN LAYOUT */}
                <div className="relative inline-block w-full">
                  <select
                    value={selectedLayout.layoutName}
                    onChange={(e) => {
                      const found = availableLayouts.find(
                        (l) => l.layoutName === e.target.value,
                      );
                      if (found) setSelectedLayout(found);
                    }}
                    className="w-full appearance-none bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 text-[10px] font-black py-1 pl-2.5 pr-7 rounded-lg border border-rose-200 dark:border-rose-900/50 focus:outline-none cursor-pointer truncate"
                  >
                    {availableLayouts.map((item, idx) => (
                      <option
                        key={idx}
                        value={item.layoutName}
                        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        Layout: {item.layoutName} ({item.capacity} Orang)
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9f1521] dark:text-rose-400 pointer-events-none"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={handleEditClick}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title="Edit Ruangan"
                    type="button"
                  >
                    <Pencil size={12} />
                  </button>

                  <button
                    onClick={handleDelete}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Ruangan"
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Users size={12} className="text-[#9f1521] shrink-0" /> Kapasitas
              Muatan:{" "}
              <strong className="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">
                {selectedLayout.capacity} Orang
              </strong>
            </p>

            <div className="max-h-[70px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  {renderFormattedDescription(roomDesc)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Akses Bawah */}
        <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 mt-auto gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            type="button"
          >
            <Calendar size={13} /> Cek Jadwal
          </button>
          <button
            onClick={() => handleOpenBooking(room)}
            className="flex-1 px-2.5 py-1.5 bg-[#9f1521] hover:bg-[#7a1019] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            type="button"
          >
            <Plus size={13} /> Pesan Ruangan
          </button>
        </div>
      </div>

      {/* MODAL LIGHTBOX / ZOOM GAMBAR (DI LUAR CARD - PORTAL/FIXED OVERLAY) */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center transform-gpu"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImg}
                alt={room.name}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
              />

              {roomImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newIdx =
                        activeImageIndex === 0
                          ? roomImages.length - 1
                          : activeImageIndex - 1;
                      setActiveImageIndex(newIdx);
                      setLightboxImg(roomImages[newIdx]);
                    }}
                    className="absolute left-3 p-3 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-lg"
                    title="Sebelumnya"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newIdx =
                        activeImageIndex === roomImages.length - 1
                          ? 0
                          : activeImageIndex + 1;
                      setActiveImageIndex(newIdx);
                      setLightboxImg(roomImages[newIdx]);
                    }}
                    className="absolute right-3 p-3 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-lg"
                    title="Berikutnya"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-lg"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CEK JADWAL RUANGAN (DI LUAR CARD - RAPI & FULLSCREEN OVERLAY) */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-auto border border-slate-200/80 dark:border-slate-800 transform-gpu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                    DETAIL JADWAL RUANGAN
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Pratinjau slot waktu kosong & acara terkonfirmasi (Hari ini
                    & Besok).
                  </p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
                <div className="space-y-2.5">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>{" "}
                    Saran Slot Kosong (08:00 - 17:00)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>HARI INI</span>
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs">
                          {formattedToday}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {todayAvailableSlots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold border border-emerald-200/80 dark:border-emerald-900/50 text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Clock size={13} /> {slot}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>BESOK</span>
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs">
                          {formattedTomorrow}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {tomorrowAvailableSlots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold border border-emerald-200/80 dark:border-emerald-900/50 text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Clock size={13} /> {slot}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9f1521]"></span>{" "}
                    Jadwal Terisi (Approved)
                  </span>

                  {roomAgendas.length > 0 ? (
                    <div className="space-y-2.5">
                      {roomAgendas.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex justify-between items-center gap-3"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              🕒 {item.time} ({item.date})
                            </p>
                          </div>
                          <span className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-[#9f1521] dark:text-rose-400 text-[11px] font-black rounded-xl border border-rose-200/80 dark:border-rose-900/50 shrink-0 shadow-2xs">
                            {item.pic || "PIC"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      Belum ada agenda terkonfirmasi untuk ruangan ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium italic text-center sm:text-left">
                  Saran waktu berdasarkan pemesanan aktif instansi.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    handleOpenBooking(room);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-900/10 cursor-pointer"
                >
                  + Ajukan Reservasi Ruangan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(RoomCard);
