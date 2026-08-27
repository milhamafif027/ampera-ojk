"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Room, Agenda, StatusPengajuan } from "@/types";
import { getSmartStatus } from "@/lib/utils";
import RoomBookingModal from "@/components/dashboard/RoomBookingModal";
import RoomCard from "@/components/dashboard/RoomCard";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  X,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
}

export default function RuanganPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] =
    useState<Room | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resRooms, resAgendas] = await Promise.all([
        fetch("/api/ruangan"),
        fetch("/api/agendas"),
      ]);

      const resultRooms = await resRooms.json();
      const resultAgendas = await resAgendas.json();

      if (resRooms.ok && resultRooms.data) {
        const mappedRooms: Room[] = resultRooms.data.map((r: any) => {
          let parsedImgs = [];
          try {
            parsedImgs = r.imgs ? JSON.parse(r.imgs) : [];
          } catch {
            parsedImgs = [];
          }

          return {
            id: String(r.id),
            name: r.name,
            capacity: String(r.capacity) + " Orang",
            type:
              r.type ||
              (r.name.toLowerCase().includes("ballroom")
                ? "pertemuan"
                : "rapat"),
            imgs: parsedImgs.filter(Boolean),
            description:
              r.description || "Perlengkapan: Proyektor | Sound System | AC",
          };
        });
        setRooms(mappedRooms);
      } else {
        setRooms([]);
      }

      if (resAgendas.ok && resultAgendas.data) {
        const mappedAgendas: Agenda[] = resultAgendas.data
          .filter((item: any) => item.status !== "Ditolak")
          .map((item: any) => {
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
              status: item.status || "Pending",
              user_id: item.user_id || null,
            };

            return {
              ...agendaItem,
              smartStatus: getSmartStatus(agendaItem) as StatusPengajuan,
            };
          });

        setAgendas(mappedAgendas);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
        }
      }
      await fetchData();
    };
    initData();
  }, [fetchData]);

  const isAdmin = user?.role === "admin";

  const filteredRooms = useMemo(() => {
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.capacity.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [rooms, searchTerm]);

  const conferenceRooms = useMemo(
    () => filteredRooms.filter((r: any) => r.type === "pertemuan"),
    [filteredRooms],
  );

  const meetingRooms = useMemo(
    () => filteredRooms.filter((r: any) => r.type === "rapat" || !r.type),
    [filteredRooms],
  );

  const getRoomLiveStatus = useCallback(
    (roomName: string) => {
      const activeAgenda = agendas.find(
        (a) =>
          a.room.toLowerCase() === roomName.toLowerCase() &&
          a.smartStatus === "Sedang Berlangsung",
      );
      return activeAgenda
        ? { isUsed: true, agenda: activeAgenda }
        : { isUsed: false };
    },
    [agendas],
  );

  const handleOpenBooking = (room?: Room) => {
    if (room) setSelectedRoomForBooking(room);
    setIsBookingOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingRoom({
      id: "",
      name: "",
      capacity: "",
      type: "pertemuan",
      description: "",
      imgs: [],
      newFiles: [],
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (room: any) => {
    setEditingRoom({
      ...room,
      imgs:
        room.imgs && room.imgs.length > 0 ? [...room.imgs].filter(Boolean) : [],
      newFiles: [],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const currentImgs = editingRoom.imgs
      ? editingRoom.imgs.filter(Boolean)
      : [];
    if (
      currentImgs.length === 0 &&
      (!editingRoom.newFiles || editingRoom.newFiles.length === 0)
    ) {
      setCustomAlert({
        isOpen: true,
        title: "Perhatian",
        message: "Harap sertakan minimal 1 foto untuk ruangan ini.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    if (editingRoom.id) formData.append("id", editingRoom.id);
    formData.append("name", editingRoom.name);
    formData.append("capacity", editingRoom.capacity.replace(/\D/g, ""));
    formData.append("description", editingRoom.description || "");
    formData.append("type", editingRoom.type || "rapat");
    formData.append("floor", editingRoom.floor || "Lantai 2");
    formData.append("status", editingRoom.status || "Tersedia");

    const existingImgs = currentImgs.filter(
      (img: string) => img && !img.startsWith("blob:"),
    );
    formData.append("existingImgs", JSON.stringify(existingImgs));

    if (editingRoom.newFiles && editingRoom.newFiles.length > 0) {
      editingRoom.newFiles.forEach((file: File) => {
        formData.append("images", file);
      });
    }

    try {
      const method = editingRoom.id ? "PUT" : "POST";
      const res = await fetch("/api/ruangan", {
        method: method,
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setIsEditModalOpen(false);
        await fetchData();
        setCustomAlert({
          isOpen: true,
          title: "Berhasil!",
          message: result.message || `Data ruangan berhasil disimpan.`,
          type: "success",
        });
      } else {
        setCustomAlert({
          isOpen: true,
          title: "Gagal!",
          message: result.error || "Gagal menyimpan data ruangan.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      setCustomAlert({
        isOpen: true,
        title: "Terjadi Kesalahan",
        message: "Koneksi ke server bermasalah.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditingRoom((prev: any) => {
      const cleanImgs = prev.imgs ? prev.imgs.filter(Boolean) : [];
      const newImgs = cleanImgs.filter((_: any, i: number) => i !== index);
      return { ...prev, imgs: newImgs };
    });
  };

  return (
    <div className="space-y-6 pb-12 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full">
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

      {/* POPUP ALERT */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-slate-100 dark:border-slate-800">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                customAlert.type === "success"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              }`}
            >
              {customAlert.type === "success" ? (
                <CheckCircle2 size={28} />
              ) : (
                <AlertCircle size={28} />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {customAlert.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {customAlert.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setCustomAlert({
                  isOpen: false,
                  title: "",
                  message: "",
                  type: "success",
                })
              }
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-sm ${
                customAlert.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* HEADER BAR - Responsive Perfect Alignment */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-[#9f1521] shrink-0" size={22} /> Katalog
            Ruang Pertemuan & Rapat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Kelola dan lihat daftar ketersediaan ruang pertemuan serta rapat di
            Gedung OJK Sumsel.
          </p>
        </div>

        {/* Baris Tombol Aksi yang Responsif dan Rapi */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap sm:flex-nowrap justify-between">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} /> Tambah Ruangan
              </button>
            )}

            <button
              onClick={() => handleOpenBooking()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-900/10 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} /> Reservasi Ruangan
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Cari nama ruangan atau kapasitas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] text-slate-800 dark:text-slate-100 shadow-sm"
        />
      </div>

      {/* SECTION 1: RUANGAN PERTEMUAN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Ruangan Pertemuan ({conferenceRooms.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {conferenceRooms.length > 0 ? (
            conferenceRooms.map((room: any) => (
              <RoomCard
                key={room.id}
                room={room}
                isAdmin={isAdmin}
                user={user}
                getRoomLiveStatus={getRoomLiveStatus}
                handleOpenBooking={handleOpenBooking}
                handleOpenEditModal={handleOpenEditModal}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              {isLoading
                ? "Memuat data ruangan pertemuan..."
                : "Tidak ada data ruangan pertemuan di database."}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: RUANGAN RAPAT */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Ruangan Rapat ({meetingRooms.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {meetingRooms.length > 0 ? (
            meetingRooms.map((room: any) => (
              <RoomCard
                key={room.id}
                room={room}
                isAdmin={isAdmin}
                user={user}
                getRoomLiveStatus={getRoomLiveStatus}
                handleOpenBooking={handleOpenBooking}
                handleOpenEditModal={handleOpenEditModal}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              {isLoading
                ? "Memuat data ruangan rapat..."
                : "Tidak ada data ruangan rapat di database."}
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT DATA RUANGAN */}
      {isEditModalOpen && editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  PENGATURAN RUANGAN
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {editingRoom.id
                    ? `Edit Ruangan: ${editingRoom.name}`
                    : "Tambah Ruangan Baru"}
                </h3>
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="Contoh: Ruang Rapat Merdeka"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kapasitas Ruangan
                  </label>
                  <input
                    type="text"
                    value={editingRoom.capacity}
                    onChange={(e) =>
                      setEditingRoom({
                        ...editingRoom,
                        capacity: e.target.value,
                      })
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="Contoh: 30 Orang"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe / Kategori
                  </label>
                  <select
                    value={editingRoom.type || "pertemuan"}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, type: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] disabled:opacity-50"
                  >
                    <option value="pertemuan">
                      Ruangan Pertemuan / Ballroom
                    </option>
                    <option value="rapat">Ruangan Rapat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fasilitas / Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={editingRoom.description || ""}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      description: e.target.value,
                    })
                  }
                  placeholder="Contoh: Perlengkapan: Proyektor | Sound System"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#9f1521] disabled:opacity-50"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Galeri Foto Ruangan
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Maksimal ukuran file: <strong>2 MB</strong> per foto
                    </span>
                  </div>
                  <label
                    className={`px-3 py-1.5 bg-[#9f1521] text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm w-fit ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <Upload size={13} /> Pilih Foto
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/jpg, image/webp"
                      multiple
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;

                        const MAX_SIZE_MB = 2;
                        const validFiles: File[] = [];
                        let hasErrorSize = false;

                        Array.from(files).forEach((file) => {
                          const sizeInMB = file.size / (1024 * 1024);
                          if (sizeInMB > MAX_SIZE_MB) {
                            hasErrorSize = true;
                          } else {
                            validFiles.push(file);
                          }
                        });

                        if (hasErrorSize) {
                          setCustomAlert({
                            isOpen: true,
                            title: "Ukuran File Terlalu Besar",
                            message: `Beberapa file melebihi batas maksimal ${MAX_SIZE_MB} MB dan tidak diikutkan.`,
                            type: "error",
                          });
                        }

                        if (validFiles.length > 0) {
                          const previewUrls = validFiles.map((file) =>
                            URL.createObjectURL(file),
                          );
                          setEditingRoom((prev: any) => ({
                            ...prev,
                            imgs: [...(prev.imgs || []), ...previewUrls].filter(
                              Boolean,
                            ),
                            newFiles: [...(prev.newFiles || []), ...validFiles],
                          }));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {editingRoom.imgs &&
                  editingRoom.imgs.filter(Boolean).length > 0 ? (
                    editingRoom.imgs
                      .filter(Boolean)
                      .map((imgSrc: string, idx: number) => (
                        <div
                          key={idx}
                          className="relative h-20 rounded-xl overflow-hidden border bg-slate-950"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt="Preview"
                            width={120}
                            height={80}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-90"
                          />
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                            title="Hapus Foto"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-2 sm:col-span-3 py-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                      <span>Belum ada foto yang dipilih.</span>
                      <span className="text-[10px] text-rose-600 font-bold">
                        Wajib menyertakan minimal 1 foto ruangan.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#9f1521] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RoomBookingModal
        key={selectedRoomForBooking?.id || "new-booking"}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedRoomForBooking(null);
        }}
        selectedRoom={selectedRoomForBooking}
        rooms={rooms}
        agendas={agendas}
        onSuccess={fetchData}
        setCustomAlert={(alert: any) => setCustomAlert(alert)}
      />
    </div>
  );
}
