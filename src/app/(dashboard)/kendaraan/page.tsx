"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Car, Plus, CheckCircle2, Calendar, X, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import VehicleCard from "@/components/dashboard/VehicleCard";
import VehicleBookingModal from "@/components/dashboard/VehicleBookingModal";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
}

interface VehicleBooking {
  id: string | number;
  vehicleName: string;
  destination: string;
  borrower: string;
  dept: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Disetujui" | "Selesai" | string;
  passengers?: string | number;
  notes?: string;
  userId?: string | number;
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
  dept?: string;
}

export default function KendaraanPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<VehicleBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal Peminjaman
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Modal Tambah Kendaraan (Khusus Admin)
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    name: "",
    plate_number: "",
    type: "7 Penumpang",
    status: "Tersedia",
  });

  // State Modal Persetujuan Admin (Approval Modal)
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    vehicleName: string;
    userId?: string | number;
  }>({ isOpen: false, bookingId: null, vehicleName: "", userId: undefined });

  const [approvalForm, setApprovalForm] = useState({
    totalPassengers: "1",
    notes: "Disetujui untuk kegiatan kedinasan.",
  });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // State Modal Sukses & Pesannya
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    vehicleName: "",
    destination: "",
    borrower: "",
    dept: "",
    startDate: "",
    endDate: "",
    purpose: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch data dari /api/kendaraan
  const fetchVehicleData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/kendaraan");
      const result = await res.json();

      if (res.ok) {
        if (result.vehicles && result.vehicles.length > 0) {
          const mappedVehicles: Vehicle[] = result.vehicles.map((v: any) => ({
            id: String(v.id),
            name: v.name || v.nama_kendaraan,
            plateNumber: v.plate_number || v.no_plat || "BG OJK",
            capacity: v.type || v.kapasitas || "7 Penumpang",
            status: v.status || "Tersedia",
          }));
          setVehicles(mappedVehicles);
        }

        if (result.bookings) {
          const mappedBookings: VehicleBooking[] = result.bookings.map(
            (b: any) => ({
              id: String(b.id),
              vehicleName: b.nama_kendaraan || b.vehicle_name || b.vehicleName,
              destination: b.tujuan || b.destination,
              borrower: b.peminjam || b.borrower,
              dept: b.satker || b.dept,
              startDate: b.tanggal_mulai
                ? b.tanggal_mulai.split("T")[0]
                : b.start_date
                  ? b.start_date.split("T")[0]
                  : b.startDate,
              endDate: b.tanggal_selesai
                ? b.tanggal_selesai.split("T")[0]
                : b.end_date
                  ? b.end_date.split("T")[0]
                  : b.endDate,
              status: b.status || "Pending",
              passengers: b.total_passengers || b.passengers || "-",
              notes: b.approval_notes || b.notes || "-",
              userId: b.user_id || b.userId,
            }),
          );
          setBookings(mappedBookings);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data kendaraan dari MySQL:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Inisialisasi User & Panggil Data
  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      const storedUser = localStorage.getItem("local_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setFormData((prev) => ({
            ...prev,
            borrower: parsedUser.name || "", // <--- Bagian ini yang membuat "Tamu Eksternal OJK" muncul
            dept: parsedUser.dept || "",
          }));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
        }
      }
      fetchVehicleData();
    };
    initData();
  }, [fetchVehicleData]);

  // ---> TAMBAHAN: Kalkulasi Status Dinamis berdasarkan Jadwal Booking <---
  const vehiclesWithStatus = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return vehicles.map((v) => {
      const isBooked = bookings.some(
        (b) =>
          b.vehicleName === v.name &&
          b.status === "Disetujui" &&
          today >= b.startDate &&
          today <= b.endDate,
      );

      return {
        ...v,
        status:
          v.status === "Perawatan"
            ? "Perawatan"
            : isBooked
              ? "Terpakai"
              : "Tersedia",
      };
    });
  }, [vehicles, bookings]);

  const isAdmin = user?.role === "admin";

  const isExternalUser = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || "").toLowerCase();
    const deptLower = (user.dept || "").toLowerCase();
    const nameLower = (user.name || "").toLowerCase();
    return (
      roleLower.includes("eksternal") ||
      deptLower.includes("eksternal") ||
      nameLower.includes("eksternal") ||
      roleLower.includes("tamu")
    );
  }, [user]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (isExternalUser && user) {
      return bookings.filter(
        (b) =>
          b.borrower.toLowerCase() === user.name.toLowerCase() ||
          b.borrower.toLowerCase().includes("tamu eksternal"),
      );
    }
    return bookings;
  }, [bookings, isExternalUser, user]);

  const handleOpenModal = (vehicle?: Vehicle) => {
    setFormData((prev) => ({
      ...prev,
      vehicleName: vehicle ? vehicle.name : "",
      borrower: "",
      dept: "",
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isAdminUser = user?.role === "admin";

      const res = await fetch("/api/kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_kendaraan: formData.vehicleName,
          tujuan: formData.destination,
          peminjam: formData.borrower,
          satker: formData.dept,
          tanggal_mulai: formData.startDate,
          tanggal_selesai: formData.endDate,
          keperluan: formData.purpose,
          status: isAdminUser ? "Disetujui" : "Pending",
          user_id: user?.id || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan pengajuan peminjaman");
      }

      // Kirim Notifikasi otomatis ke sistem
      try {
        await fetch("/api/notifikasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user?.id || 1,
            title: isAdminUser
              ? "Peminjaman Kendaraan Disetujui"
              : "Pengajuan Kendaraan Baru",
            type: "vehicle",
            status: isAdminUser ? "Disetujui" : "Pending",
            info: `Kendaraan: ${formData.vehicleName} (${formData.destination}) oleh ${formData.borrower}`,
          }),
        });
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi:", notifErr);
      }

      setIsModalOpen(false);
      setFormData({
        vehicleName: "",
        destination: "",
        borrower: user?.name || "",
        dept: user?.dept || "",
        startDate: "",
        endDate: "",
        purpose: "",
      });

      setSuccessMessage(
        "Pengajuan peminjaman kendaraan berhasil disimpan ke database!",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim pengajuan peminjaman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_vehicle",
          ...newVehicleData,
        }),
      });

      if (!res.ok) throw new Error("Gagal menambah kendaraan baru");

      setIsAddVehicleModalOpen(false);
      setNewVehicleData({
        name: "",
        plate_number: "",
        type: "7 Penumpang",
        status: "Tersedia",
      });

      setSuccessMessage(
        "Armada kendaraan baru telah berhasil disimpan ke database.",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal menambah kendaraan baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenApprovalModal = (
    bookingId: string | number,
    vehicleName: string,
    targetUserId?: string | number,
  ) => {
    setApprovalModal({
      isOpen: true,
      bookingId: String(bookingId),
      vehicleName,
      userId: targetUserId,
    });
    setApprovalForm({
      totalPassengers: "1",
      notes: "Disetujui untuk kegiatan kedinasan.",
    });
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModal.bookingId) return;

    setIsSubmittingApproval(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_booking",
          id: approvalModal.bookingId,
          total_passengers: approvalForm.totalPassengers,
          approval_notes: approvalForm.notes,
          status: "Disetujui",
        }),
      });

      if (!res.ok) throw new Error("Gagal menyetujui peminjaman kendaraan");

      // Kirim Notifikasi bahwa booking disetujui kepada pemohon
      if (approvalModal.userId) {
        try {
          await fetch("/api/notifikasi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: approvalModal.userId,
              title: "Peminjaman Kendaraan Disetujui",
              type: "vehicle",
              status: "Disetujui",
              info: `Pengajuan ${approvalModal.vehicleName} telah disetujui. Catatan: ${approvalForm.notes}`,
            }),
          });
        } catch (notifErr) {
          console.error("Gagal mengirim notifikasi approval:", notifErr);
        }
      }

      setApprovalModal({
        isOpen: false,
        bookingId: null,
        vehicleName: "",
        userId: undefined,
      });
      setSuccessMessage(
        "Peminjaman kendaraan berhasil diverifikasi dan disetujui.",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal memproses persetujuan peminjaman.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="text-[#9f1521]" size={22} /> Layanan Armada &
            Kendaraan Dinas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Kelola dan ajukan peminjaman kendaraan operasional dinas Kantor OJK
            Sumsel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchVehicleData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddVehicleModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} /> Tambah Kendaraan
            </button>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-900/10 cursor-pointer"
          >
            <Plus size={16} /> Ajukan Peminjaman Mobil
          </button>
        </div>
      </div>

      {/* KATALOG ARMADA KENDARAAN (Menggunakan vehiclesWithStatus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehiclesWithStatus.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>

      {/* RIWAYAT & PENGAJUAN KENDARAAN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Calendar size={18} className="text-[#9f1521]" /> Daftar Pengajuan
          Kendaraan
        </h2>

        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                  <th className="p-3">Kendaraan</th>
                  <th className="p-3">Tujuan / Keperluan</th>
                  <th className="p-3">Peminjam</th>
                  <th className="p-3">Tanggal Penugasan</th>
                  <th className="p-3">Info Tambahan (Admin)</th>
                  <th className="p-3 text-center">Status</th>
                  {isAdmin && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {b.vehicleName}
                    </td>
                    <td className="p-3">{b.destination}</td>
                    <td className="p-3">
                      {b.borrower} ({b.dept || "Umum"})
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {b.startDate} s.d {b.endDate}
                    </td>
                    <td className="p-3 text-slate-500">
                      {b.status === "Disetujui" ? (
                        <div>
                          <p>
                            👥 Penumpang: <strong>{b.passengers} orang</strong>
                          </p>
                          <p className="italic text-[11px]">
                            💬 Catatan: {b.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">
                          Menunggu verifikasi
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          b.status === "Disetujui"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-center">
                        {b.status === "Pending" ? (
                          <button
                            onClick={() =>
                              handleOpenApprovalModal(
                                b.id,
                                b.vehicleName,
                                b.userId,
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            Setujui
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">
                            Selesai Diverifikasi
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Belum ada catatan peminjaman kendaraan aktif saat ini.
          </p>
        )}
      </div>

      {/* MODAL TAMBAH KENDARAAN BARU (KHUSUS ADMIN) */}
      {isAddVehicleModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                Tambah Armada Kendaraan Baru
              </h3>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddVehicleSubmit}
              className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100"
            >
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                  Nama Kendaraan / Model
                </label>
                <input
                  type="text"
                  value={newVehicleData.name}
                  onChange={(e) =>
                    setNewVehicleData({
                      ...newVehicleData,
                      name: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  placeholder="Contoh: Toyota Fortuner VRZ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Nomor Plat
                  </label>
                  <input
                    type="text"
                    value={newVehicleData.plate_number}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        plate_number: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                    placeholder="Contoh: BG 1025 OJK"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Kapasitas / Jenis
                  </label>
                  <input
                    type="text"
                    value={newVehicleData.type}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        type: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                    placeholder="Contoh: 7 Penumpang"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                  Status Awal
                </label>
                <select
                  value={newVehicleData.status}
                  onChange={(e) =>
                    setNewVehicleData({
                      ...newVehicleData,
                      status: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Terpakai">Terpakai</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kendaraan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL PERSETUJUAN / VERIFIKASI ADMIN */}
      {approvalModal.isOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  VERIFIKASI ADMIN
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Setujui Peminjaman Kendaraan
                </h3>
              </div>
              <button
                onClick={() =>
                  setApprovalModal({
                    isOpen: false,
                    bookingId: null,
                    vehicleName: "",
                    userId: undefined,
                  })
                }
                disabled={isSubmittingApproval}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleConfirmApproval}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Kendaraan Dipinjam
                </label>
                <input
                  type="text"
                  value={approvalModal.vehicleName}
                  disabled
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Jumlah Orang yang Ikut (Penumpang)
                </label>
                <input
                  type="number"
                  min="1"
                  value={approvalForm.totalPassengers}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      totalPassengers: e.target.value,
                    })
                  }
                  disabled={isSubmittingApproval}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium disabled:opacity-50"
                  placeholder="Contoh: 4"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Catatan / Instruksi Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={approvalForm.notes}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, notes: e.target.value })
                  }
                  disabled={isSubmittingApproval}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium resize-none disabled:opacity-50"
                  placeholder="Contoh: Harap berkumpul di lobi 15 menit sebelum keberangkatan."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setApprovalModal({
                      isOpen: false,
                      bookingId: null,
                      vehicleName: "",
                      userId: undefined,
                    })
                  }
                  disabled={isSubmittingApproval}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingApproval
                    ? "Menyimpan..."
                    : "Konfirmasi & Setujui"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Berhasil!
              </h3>
              <p className="text-xs text-slate-500 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}

      {/* MODAL RESERVASI KENDARAAN */}
      <VehicleBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        vehicles={vehicles}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
}
