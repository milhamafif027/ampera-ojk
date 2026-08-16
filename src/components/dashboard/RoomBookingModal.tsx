"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
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
    total_participants: "1",
    meeting_leader: "",
    room_id: "",
    roomName: "",
    date: "",
    startTime: "08:00",
    endTime: "10:00",
    layout: "U-Shape",
    notes: "",
  });

  useEffect(() => {
    const initModalForm = async () => {
      await Promise.resolve();

      if (isOpen) {
        setShowSuccessPopup(false);

        setFormData({
          title: editData?.title || "",
          pic: editData?.pic || "",
          dept: (editData as any)?.dept || "",
          total_participants: String(
            (editData as any)?.total_participants || "1",
          ),
          meeting_leader: (editData as any)?.meeting_leader || "",
          room_id: selectedRoom?.id
            ? String(selectedRoom.id)
            : (editData as any)?.room_id
              ? String((editData as any).room_id)
              : "",
          roomName:
            selectedRoom?.name ||
            (editData as any)?.room_name ||
            editData?.room ||
            "",
          date: editData?.date || "",
          startTime: editData?.time?.split(" - ")[0] || "08:00",
          endTime:
            editData?.time?.split(" - ")[1]?.replace(" WIB", "") || "10:00",
          layout: (editData as any)?.layout || "U-Shape",
          notes: (editData as any)?.notes || (editData as any)?.note || "",
        });
        setStep(1);
      }
    };

    initModalForm();
  }, [isOpen, selectedRoom, editData]);

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
      const foundRoom = rooms.find((r) => String(r.id) === value);
      setFormData((prev) => ({
        ...prev,
        room_id: value,
        roomName: foundRoom ? foundRoom.name : prev.roomName,
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
      const newStart = formData.startTime;
      const newEnd = formData.endTime;

      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const hasConflict = checkTimeConflict();

  const isStep1Valid = Boolean(
    formData.title &&
    formData.pic &&
    formData.dept &&
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

      const responseText = await res.text();
      let result: any = {};

      try {
        if (responseText) {
          result = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("Gagal memparsing respons server ke JSON:", responseText);
      }

      if (!res.ok) {
        throw new Error(
          result.message ||
            result.error ||
            `Terjadi kesalahan pada server (Status: ${res.status}).`,
        );
      }

      setShowSuccessPopup(true);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Booking Error:", error);
      setCustomAlert({
        isOpen: true,
        title: "Gagal!",
        message: error.message || "Terjadi kesalahan saat menghubungi server.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    setShowSuccessPopup(false);
    setIsSubmitting(false);
    onClose();
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

      {/* MODAL POP-UP KETIKA BERHASIL PESAN */}
      {showSuccessPopup ? (
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200 z-10">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-1">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Reservasi Berhasil!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pengajuan jadwal ruangan rapat Anda telah berhasil disimpan dan
              tercatat di database sistem.
            </p>
          </div>
          <button
            onClick={handleFinishSuccess}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all mt-2 cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      ) : (
        /* MODAL UTAMA FORMULIR */
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
              className="p-2 hover:bg-white/20 rounded-full transition-colors bg-white/10 cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-8 overflow-y-auto flex-1 space-y-4">
            {isViewMode && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#9f1521]">
                    Informasi Agenda
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editData.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p>
                      <strong>Tanggal:</strong> {editData.date}
                    </p>
                    <p>
                      <strong>Waktu:</strong> {editData.time}
                    </p>
                    <p>
                      <strong>Ruangan:</strong> {editData.room}
                    </p>
                    <p>
                      <strong>PIC:</strong> {editData.pic} (
                      {editData.dept || "-"})
                    </p>
                    <p>
                      <strong>Jumlah Peserta:</strong>{" "}
                      {(editData as any).total_participants || "-"} Orang
                    </p>
                    <p>
                      <strong>Pimpinan Rapat:</strong>{" "}
                      {(editData as any).meeting_leader || "-"}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Status Pengajuan:
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                        editData.smartStatus === "Disetujui"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : editData.smartStatus === "Sedang Berlangsung"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {editData.smartStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!isViewMode && step === 1 && (
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

            {!isViewMode && step === 2 && (
              <>
                <div>
                  <label className={labelClassName}>Pilih Ruangan</label>
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
                          {r.name} (Kapasitas: {r.capacity || "-"})
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
                      tanggal ini. Silakan pilih waktu lain.
                    </span>
                  </div>
                )}

                {existingBookings.length > 0 && !isCheckingConflict && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Jadwal Terisi pada Tanggal Ini:
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {existingBookings.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {b.title}
                          </span>
                          <span className="text-rose-600 font-bold">
                            {b.start_time} - {b.end_time} WIB
                          </span>
                        </div>
                      ))}
                    </div>
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
                    <option value="U-Shape">U-Shape</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Theater">Theater</option>
                    <option value="Round Table">Round Table</option>
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
            {isViewMode ? (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#9f1521] hover:bg-[#7a1019] text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            ) : (
              <>
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 text-xs cursor-pointer disabled:opacity-50"
                  >
                    Kembali
                  </button>
                )}
                {step === 1 ? (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="px-8 py-2.5 bg-[#9f1521] text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isStep2Valid || isSubmitting || hasConflict}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {isSubmitting ? "Mengirim Reservasi..." : "Kirim Reservasi"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
