"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Room, Agenda } from "@/types";

export interface RoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCustomAlert: (alert: {
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "success";
  }) => void;
  selectedRoom?: Room | null;
  editData?: Agenda | null;
  agendas?: Agenda[];
  rooms?: Room[];
  onSuccess?: () => void;
}

// Helper untuk membaca Layout dari JSON database atau aturan default nama ruangan
const getRoomLayouts = (room: any): string[] => {
  if (!room) return ["Ruang Rapat"];

  // 1. Coba baca dari kolom layout_config (jika ada di database)
  if (room.layout_config) {
    try {
      const config =
        typeof room.layout_config === "string"
          ? JSON.parse(room.layout_config)
          : room.layout_config;
      const keys = Object.keys(config);
      if (keys.length > 0) return keys;
    } catch (e) {
      console.error("Gagal parse layout_config:", e);
    }
  }

  // 2. Fallback cerdas berdasarkan nama ruangan (jika layout_config kosong/belum ter-fetch)
  const name = (room.name || "").trim().toLowerCase();
  if (name.includes("ballroom")) {
    return ["Theater", "Klasikal", "U-Shape", "Round Table"];
  }
  if (name.includes("komunal")) {
    return ["Theater", "Klasikal", "U-Shape", "Round Table"];
  }
  if (name.includes("auditorium")) {
    return ["Theater"];
  }
  return ["Ruang Rapat"];
};

// Helper untuk membaca Kapasitas spesifik per layout
const getRoomCapacity = (room: any, layout: string): string | number => {
  if (!room) return "-";

  if (room.layout_config) {
    try {
      const config =
        typeof room.layout_config === "string"
          ? JSON.parse(room.layout_config)
          : room.layout_config;
      if (config[layout]) return `${config[layout]} Orang`;
      const firstVal = Object.values(config)[0];
      if (firstVal) return `${firstVal} Orang`;
    } catch (e) {
      // Abaikan error parse
    }
  }

  return room.capacity ? `${room.capacity} Orang` : "-";
};

export default function RoomBookingModal({
  isOpen,
  onClose,
  setCustomAlert,
  selectedRoom,
  editData,
  agendas = [],
  rooms = [],
  onSuccess,
}: RoomBookingModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    pic: "",
    dept: "",
    phone: "",
    total_participants: "1",
    meeting_leader: "",
    room_id: "",
    roomName: "",
    date: "",
    startTime: "08:00",
    endTime: "10:00",
    layout: "",
    notes: "",
  });

  // Inisialisasi Data saat Modal Dibuka
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);

        const activeRoom =
          selectedRoom ||
          (editData &&
            rooms.find(
              (r) => String(r.id) === String((editData as any).room_id),
            )) ||
          (rooms.length > 0 ? rooms[0] : null);

        const validLayouts = getRoomLayouts(activeRoom);
        const initialLayout =
          (editData as any)?.layout &&
          validLayouts.includes((editData as any).layout)
            ? (editData as any).layout
            : validLayouts[0];

        setFormData({
          title: editData?.title || "",
          pic: editData?.pic || "",
          dept: (editData as any)?.dept || "",
          phone:
            (editData as any)?.phone || (editData as any)?.phone_pemohon || "",
          total_participants: String(
            (editData as any)?.total_participants || "1",
          ),
          meeting_leader: (editData as any)?.meeting_leader || "",
          room_id: activeRoom ? String(activeRoom.id) : "",
          roomName: activeRoom?.name || "",
          date: editData?.date || "",
          startTime: editData?.time?.split(" - ")[0] || "08:00",
          endTime:
            editData?.time?.split(" - ")[1]?.replace(" WIB", "") || "10:00",
          layout: initialLayout,
          notes: (editData as any)?.notes || (editData as any)?.note || "",
        });

        setStep(1);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedRoom, editData, rooms]);

  // Cari objek ruangan aktif
  const currentRoom = useMemo(() => {
    return (
      rooms.find(
        (r) =>
          String(r.id) === String(formData.room_id) ||
          r.name.trim().toLowerCase() ===
            formData.roomName.trim().toLowerCase(),
      ) || null
    );
  }, [rooms, formData.room_id, formData.roomName]);

  // Daftar layout yang tersedia untuk ruangan aktif
  const availableLayouts = useMemo(() => {
    return getRoomLayouts(currentRoom);
  }, [currentRoom]);

  // Kapasitas spesifik untuk layout yang dipilih
  const currentCapacityInfo = useMemo(() => {
    return getRoomCapacity(currentRoom, formData.layout);
  }, [currentRoom, formData.layout]);

  // Cek jadwal bentrok
  useEffect(() => {
    const fetchBookingsForConflictCheck = async () => {
      if (!formData.date || !formData.roomName) return;

      setIsCheckingConflict(true);
      try {
        const res = await fetch(
          `/api/agendas?date=${formData.date}&room=${encodeURIComponent(formData.roomName)}`,
        );
        const result = await res.json();
        if (res.ok && result.data) {
          const activeBookings = result.data.filter(
            (item: any) =>
              item.status !== "Ditolak" &&
              (!editData?.id || item.id !== editData.id),
          );
          setExistingBookings(activeBookings);
        }
      } catch (error) {
        console.error("Gagal memeriksa ketersediaan jadwal:", error);
      } finally {
        setIsCheckingConflict(false);
      }
    };

    if (formData.date && formData.roomName) {
      fetchBookingsForConflictCheck();
    }
  }, [formData.date, formData.roomName, editData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "room_id") {
      const selected = rooms.find((r) => String(r.id) === String(value));
      const layouts = getRoomLayouts(selected);

      setFormData((prev) => ({
        ...prev,
        room_id: value,
        roomName: selected ? selected.name : prev.roomName,
        layout: layouts[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const checkTimeConflict = () => {
    if (!formData.startTime || !formData.endTime) return false;

    return existingBookings.some((booking) => {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;
      return (
        formData.startTime < existingEnd && formData.endTime > existingStart
      );
    });
  };

  const hasConflict = checkTimeConflict();

  const isStep1Valid = Boolean(
    formData.title &&
    formData.pic &&
    formData.dept &&
    formData.phone &&
    formData.total_participants &&
    formData.meeting_leader,
  );

  const isStep2Valid = Boolean(
    (formData.room_id || formData.roomName) &&
    formData.date &&
    formData.startTime &&
    formData.endTime &&
    !hasConflict &&
    !isCheckingConflict,
  );

  const handleSubmit = async () => {
    if (hasConflict) {
      setCustomAlert({
        isOpen: true,
        title: "Jadwal Bentrok!",
        message:
          "Ruangan sudah dipesan pada rentang waktu tersebut. Silakan pilih jam lain.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const storedUser = localStorage.getItem("local_user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const isAdmin = currentUser?.role === "admin";
      const finalStatus = isAdmin ? "Disetujui" : "Pending";

      let cleanDate = formData.date;
      if (cleanDate) {
        if (cleanDate.includes("T")) {
          cleanDate = cleanDate.split("T")[0];
        } else if (cleanDate.length >= 10) {
          cleanDate = cleanDate.slice(0, 10);
        }
      }

      const payload = {
        id: editData?.id,
        title: formData.title,
        pic: formData.pic,
        dept: formData.dept,
        phone: formData.phone,
        total_participants: Number(formData.total_participants) || 1,
        meeting_leader: formData.meeting_leader,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        room_name: formData.roomName,
        date: cleanDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        layout: formData.layout,
        notes: formData.notes,
        status: finalStatus,
        user_id: currentUser?.id || null,
      };

      const method = editData?.id ? "PUT" : "POST";
      const res = await fetch("/api/agendas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan ke database server.");

      // 1. Kirim notifikasi untuk Admin (masuk ke notifikasi_admin)
      await fetch("/api/notifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          title: "Reservasi Diajukan",
          type: "room",
          status: finalStatus,
          info: `Reservasi ${formData.roomName} oleh ${formData.pic} tanggal ${cleanDate} sedang diproses.`,
        }),
      });

      // 2. Kirim notifikasi personal untuk User yang bersangkutan (jika login)
      if (currentUser?.id) {
        await fetch("/api/notifikasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            role: currentUser.role || "eksternal",
            title: "Pengajuan Diterima Sistem",
            type: "room",
            status: finalStatus,
            info: `Pengajuan ruangan ${formData.roomName} Anda berhasil dikirim.`,
          }),
        });
      }

      // Tampilkan popup sukses tanpa langsung menutup modal induk secara prematur
      setShowSuccessPopup(true);
    } catch (error: any) {
      setCustomAlert({
        isOpen: true,
        title: "Gagal!",
        message: error.message || "Terjadi kesalahan saat menghubungi server.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#9f1521] outline-none text-slate-800 dark:text-slate-100 shadow-sm transition-colors disabled:opacity-50";
  const labelClassName =
    "text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1.5 block tracking-wider uppercase";

  const isViewMode = Boolean(editData && editData.id);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={() => {
          if (!showSuccessPopup && !isSubmitting) onClose();
        }}
      />

      {showSuccessPopup ? (
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center space-y-4 z-10 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-1">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Reservasi Berhasil!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pengajuan jadwal ruangan rapat Anda telah berhasil disimpan dan
              tercatat di database.
            </p>
          </div>
          <button
            onClick={() => {
              setShowSuccessPopup(false);
              if (onSuccess) onSuccess();
              onClose();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all mt-2 cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10">
          {/* Header Modal */}
          <div className="px-8 py-6 bg-gradient-to-br from-[#9f1521] to-[#7a1019] text-white flex justify-between items-start shrink-0">
            <div>
              {!isViewMode && (
                <span className="text-rose-200 text-[10px] font-black tracking-widest uppercase mb-1 block">
                  Langkah {step} dari 2
                </span>
              )}
              <h2 className="text-2xl font-black tracking-tight">
                {isViewMode ? "Detail Agenda / Kegiatan" : "Reservasi Ruangan"}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-full transition-colors bg-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-8 overflow-y-auto flex-1 space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className={labelClassName}>
                    Nama Kegiatan / Acara
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={inputClassName}
                    placeholder="Contoh: Rapat Koordinasi Satker"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Nama Pemesan (PIC)</label>
                    <input
                      name="pic"
                      value={formData.pic}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      placeholder="Contoh: Muhammad Fadli"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Satker / Uker</label>
                    <input
                      name="dept"
                      value={formData.dept}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      placeholder="Contoh: OJK Sumsel"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>
                    Nomor WhatsApp / HP Pemohon (Untuk Konfirmasi Status)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={inputClassName}
                    placeholder="Contoh: 081234567890"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>
                      Jumlah Peserta (Orang)
                    </label>
                    <input
                      type="number"
                      min="1"
                      name="total_participants"
                      value={formData.total_participants}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      placeholder="Contoh: 15"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      Pimpinan Rapat / Pimpinan
                    </label>
                    <input
                      type="text"
                      name="meeting_leader"
                      value={formData.meeting_leader}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      placeholder="Contoh: Kepala Kantor OJK"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      className={labelClassName}
                      style={{ marginBottom: 0 }}
                    >
                      Pilih Ruangan
                    </label>
                    {currentCapacityInfo !== "-" && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                        Kapasitas Maksimal ({formData.layout}):{" "}
                        {currentCapacityInfo}
                      </span>
                    )}
                  </div>

                  {rooms.length > 0 ? (
                    <select
                      name="room_id"
                      value={formData.room_id}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      required
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} - Kapasitas: {r.capacity || "-"} Orang
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="roomName"
                      value={formData.roomName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      placeholder="Nama Ruangan"
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClassName}>Tanggal</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Jam Mulai</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Jam Selesai</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>

                {isCheckingConflict && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2 text-slate-500">
                    <Loader2
                      size={14}
                      className="animate-spin text-[#9f1521]"
                    />
                    <span>Memeriksa ketersediaan jadwal ruangan...</span>
                  </div>
                )}

                {hasConflict && !isCheckingConflict && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>
                      Ruangan sudah terisi/dipesan pada rentang jam tersebut di
                      tanggal ini.
                    </span>
                  </div>
                )}

                <div>
                  <label className={labelClassName}>
                    Tata Letak / Layout Ruangan
                  </label>
                  <select
                    name="layout"
                    value={formData.layout}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={inputClassName}
                  >
                    {availableLayouts.map((lay, idx) => (
                      <option key={idx} value={lay}>
                        {lay}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={2}
                    className={inputClassName}
                    placeholder="Kebutuhan mic, proyektor, dll."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer Modal */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 text-xs cursor-pointer"
              >
                Kembali
              </button>
            )}
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid || isSubmitting}
                className="px-8 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep2Valid || isSubmitting || hasConflict}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Mengirim Reservasi..." : "Kirim Reservasi"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
