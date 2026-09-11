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
  user,
  getRoomLiveStatus,
  handleOpenBooking,
  handleOpenEditModal,
  handleDeleteRoom,
  agendas = [],
  cardVariants,
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

  const defaultImage =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";

  const roomImgs = (room as any).imgs;
  const roomImages: string[] =
    roomImgs && Array.isArray(roomImgs) && roomImgs.length > 0
      ? roomImgs.filter(Boolean)
      : [defaultImage];

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

  // Handler Navigasi Tombol Kiri/Kanan pada Card (Menggeser Scroll Banner)
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

  // Fungsi helper internal untuk menangani edit dengan aman & menyertakan existingImgs jika form submit induk membutuhkan FormData
  const handleEditClick = () => {
    // Jika room.imgs berisi string JSON atau array, pastikan aman dikirim
    let existingImages = roomImages;
    if (typeof roomImgs === "string") {
      try {
        existingImages = JSON.parse(roomImgs);
      } catch {
        existingImages = [defaultImage];
      }
    }

    // Inject atau pastikan properti existingImgs terbawa ke modal edit
    const roomWithExistingImgs = {
      ...room,
      existingImgs: existingImages,
    };

    handleOpenEditModal(roomWithExistingImgs as Room);
  };

  // Filter Jadwal Berdasarkan Ruangan Ini (Hanya menampilkan yang Sedang Berlangsung atau Akan Datang)
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

  // Helper untuk Menghitung Slot Waktu Kosong (Available Slots) secara Dinamis
  const getAvailableSlotsForDate = (targetDateStr: string) => {
    const operationalStart = "08:00";
    const operationalEnd = "17:00";

    // Ambil agenda di tanggal tersebut untuk ruangan ini
    const agendasOnDate = roomAgendas
      .filter((a) => a.date === targetDateStr && a.time)
      .map((a) => {
        // Ambil format "HH:mm - HH:mm"
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md w-full relative">
      <div>
        {/* Banner Galeri Foto (Dengan Ref Scroll & Tombol Navigasi) */}
        <div className="relative h-28 sm:h-32 w-full bg-slate-950 overflow-hidden group">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-zoom-in"
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
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          {/* Tombol Panah Navigasi Kiri / Kanan pada Card */}
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
            <div className="min-w-0 flex-1">
              <h3
                className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate"
                title={room.name}
              >
                {room.name}
              </h3>
              {roomLayout && (
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-[#9f1521] dark:text-rose-400 text-[9px] font-black rounded-md border border-rose-200 dark:border-rose-900/50 truncate max-w-full">
                  Layout: {roomLayout}
                </span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
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
            <Users size={12} className="text-[#9f1521] shrink-0" /> Kapasitas:{" "}
            <strong className="text-slate-700 dark:text-slate-200 truncate">
              {room.capacity}
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

      {/* Tombol Akses Bawah (Cek Jadwal & Pesan Ruangan) */}
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

      {/* MODAL LIGHTBOX / ZOOM GAMBAR */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center"
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

      {/* MODAL CEK JADWAL RUANGAN (Dengan Slot Kosong Dinamis) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-5 my-auto border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  DETAIL JADWAL RUANGAN
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {room.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Slot waktu kosong & acara terkonfirmasi (Hari ini - Besok).
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 text-xs">
              {/* Saran Waktu Booking (Dinamis Berdasarkan Jadwal Terisi) */}
              <div className="space-y-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>{" "}
                  Saran Slot Kosong (08:00 - 17:00)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Hari Ini */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>HARI INI</span>
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {formattedToday}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {todayAvailableSlots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-center py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold border border-emerald-200 text-[11px] flex items-center justify-center gap-1"
                        >
                          <Clock size={12} /> {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Besok */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>BESOK</span>
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {formattedTomorrow}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {tomorrowAvailableSlots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-center py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold border border-emerald-200 text-[11px] flex items-center justify-center gap-1"
                        >
                          <Clock size={12} /> {slot}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Jadwal Terisi (Approved) */}
              <div className="space-y-2 pt-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9f1521]"></span>{" "}
                  Jadwal Terisi (Approved)
                </span>

                {roomAgendas.length > 0 ? (
                  <div className="space-y-2">
                    {roomAgendas.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl flex justify-between items-center gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            🕒 {item.time} ({item.date})
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-white dark:bg-slate-800 text-[#9f1521] text-[10px] font-bold rounded-lg border border-rose-200 shrink-0">
                          {item.pic || "PIC"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    Belum ada agenda terkonfirmasi untuk ruangan ini.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 italic">
                Saran waktu untuk reservasi ruangan hari ini dan besok.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  handleOpenBooking(room);
                }}
                className="px-5 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                + Ajukan Reservasi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default memo(RoomCard);
