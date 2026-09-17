"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Car,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import VehicleBookingModal from "@/components/dashboard/VehicleBookingModal";

interface Vehicle {
  id: string | number;
  name: string;
  plateNumber: string;
  capacity: string;
  status: "Tersedia" | "Terpakai" | "Perawatan" | string;
  category?: "Khusus Pimpinan" | "Operasional" | string;
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
  phone?: string; // Menyimpan nomor HP pemohon
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  nip?: string;
  dept?: string;
  phone?: string;
}

export default function KendaraanPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<VehicleBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<
    string | number | null
  >(null);
  const [newVehicleData, setNewVehicleData] = useState({
    name: "",
    plate_number: "",
    type: "7 Penumpang",
    status: "Tersedia",
    category: "Operasional",
  });

  // State Modal Persetujuan Admin (Approval & Plotting) dengan dukungan Phone
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    vehicleName: string;
    userId?: string | number;
    phone?: string;
  }>({
    isOpen: false,
    bookingId: null,
    vehicleName: "",
    userId: undefined,
    phone: "",
  });

  // State form untuk Admin mem-plotting kendaraan
  const [approvalForm, setApprovalForm] = useState({
    selectedVehicle: "",
    totalPassengers: "1",
    notes: "Disetujui, kendaraan dan driver telah disiapkan.",
  });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    vehicleName: string;
    borrowerName: string;
  }>({ isOpen: false, bookingId: null, vehicleName: "", borrowerName: "" });
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    vehicleName: "Menunggu Plotting Admin",
    destination: "",
    borrower: "",
    dept: "",
    startDate: "",
    endDate: "",
    purpose: "",
    passengers: "1",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
            category: v.category || "Operasional",
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
              phone: b.phone || "",
            }),
          );
          setBookings(mappedBookings);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data kendaraan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await Promise.resolve();
      const storedUser = sessionStorage.getItem("local_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setFormData((prev) => ({
            ...prev,
            dept: parsedUser.dept || "OJK Sumsel",
            phone: parsedUser.phone || parsedUser.no_hp || "",
          }));
        } catch (err) {
          console.error("Gagal membaca session user:", err);
        }
      }
      fetchVehicleData();
    };
    initData();
  }, [fetchVehicleData]);

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

  const handleOpenModal = () => {
    const defaultDept = user && !isExternalUser ? "OJK Sumsel" : "";
    const defaultPhone = user?.phone || "";

    setFormData({
      vehicleName: "Menunggu Plotting Admin",
      destination: "",
      borrower: "", // Blank agar menjadi placeholder sugestif
      dept: defaultDept,
      startDate: "",
      endDate: "",
      purpose: "",
      passengers: "1",
      phone: defaultPhone,
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingVehicleId(null);
    setNewVehicleData({
      name: "",
      plate_number: "",
      type: "7 Penumpang",
      status: "Tersedia",
      category: "Operasional",
    });
    setIsAddVehicleModalOpen(true);
  };

  const handleAddOrUpdateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingVehicleId ? "PUT" : "POST";
      const payload = editingVehicleId
        ? { action: "update_vehicle", id: editingVehicleId, ...newVehicleData }
        : { action: "add_vehicle", ...newVehicleData };

      const res = await fetch("/api/kendaraan", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data kendaraan");

      setIsAddVehicleModalOpen(false);
      setEditingVehicleId(null);
      setNewVehicleData({
        name: "",
        plate_number: "",
        type: "7 Penumpang",
        status: "Tersedia",
        category: "Operasional",
      });

      setSuccessMessage(
        editingVehicleId
          ? "Data kendaraan berhasil diperbarui."
          : "Armada kendaraan baru telah berhasil disimpan ke database.",
      );
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data kendaraan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_kendaraan: "Menunggu Plotting Admin",
          tujuan: formData.destination,
          peminjam: formData.borrower,
          satker: formData.dept,
          tanggal_mulai: formData.startDate,
          tanggal_selesai: formData.endDate,
          keperluan: formData.purpose,
          total_passengers: formData.passengers,
          phone: formData.phone,
          status: "Pending",
          user_id: user?.id || null,
          role: user?.role || "eksternal",
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan pengajuan peminjaman");
      }

      setIsModalOpen(false);
      setSuccessMessage(
        "Request peminjaman kendaraan berhasil dikirim! Menunggu plotting dari Admin.",
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

  const handleOpenApprovalModal = (
    bookingId: string | number,
    vehicleName: string,
    targetUserId?: string | number,
    passengers?: string | number,
    borrowerPhone?: string,
  ) => {
    setApprovalModal({
      isOpen: true,
      bookingId: String(bookingId),
      vehicleName,
      userId: targetUserId,
      phone: borrowerPhone || "",
    });
    setApprovalForm({
      selectedVehicle:
        vehicleName !== "Menunggu Plotting Admin" ? vehicleName : "",
      totalPassengers: passengers ? String(passengers) : "1",
      notes: "Disetujui, kendaraan dan driver telah disiapkan.",
    });
  };

  // Helper untuk membuka WhatsApp otomatis saat disetujui
  const sendWhatsAppNotification = (
    phoneNum: string,
    borrowerName: string,
    destination: string,
    assignedVehicle: string,
    notes: string,
  ) => {
    if (!phoneNum) return;

    let cleanPhone = phoneNum.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const message = `Halo ${borrowerName || "Bapak/Ibu"},

Pengajuan peminjaman Kendaraan Dinas OJK Sumsel dengan tujuan *${destination}* telah *DISETUJUI ✅*.

🚗 *Armada / Driver:* ${assignedVehicle}
📝 *Catatan / Instruksi:* ${notes}

Silakan bersiap sesuai jadwal penugasan. Terima kasih.\n_Bagian Layanan Manajemen Strategis Kantor OJK Sumatera Selatan_`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModal.bookingId) return;

    if (!approvalForm.selectedVehicle) {
      alert("Silakan pilih/plotting armada kendaraan terlebih dahulu.");
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_booking",
          id: approvalModal.bookingId,
          nama_kendaraan: approvalForm.selectedVehicle,
          total_passengers: approvalForm.totalPassengers,
          approval_notes: approvalForm.notes,
          status: "Disetujui",
        }),
      });

      if (!res.ok) throw new Error("Gagal menyetujui peminjaman kendaraan");

      const currentBooking = bookings.find(
        (b) => String(b.id) === String(approvalModal.bookingId),
      );

      // Otomatis kirim WhatsApp ke pemohon
      if (approvalModal.phone && currentBooking) {
        sendWhatsAppNotification(
          approvalModal.phone,
          currentBooking.borrower,
          currentBooking.destination,
          approvalForm.selectedVehicle,
          approvalForm.notes,
        );
      }

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
              info: `Pengajuan disetujui. Kendaraan: ${approvalForm.selectedVehicle}. Catatan: ${approvalForm.notes}`,
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
        phone: "",
      });
      setSuccessMessage(
        "Peminjaman kendaraan berhasil di-plotting dan disetujui.",
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

  const handleOpenDeleteModal = (
    id: string | number,
    vehicleName: string,
    borrowerName: string,
  ) => {
    setDeleteModal({
      isOpen: true,
      bookingId: String(id),
      vehicleName,
      borrowerName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.bookingId) return;

    setIsDeletingBooking(true);
    try {
      const res = await fetch(`/api/kendaraan?id=${deleteModal.bookingId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus pengajuan kendaraan");

      setDeleteModal({
        isOpen: false,
        bookingId: null,
        vehicleName: "",
        borrowerName: "",
      });
      setSuccessMessage("Pengajuan peminjaman kendaraan berhasil dihapus.");
      setShowSuccessModal(true);
      fetchVehicleData();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data pengajuan.");
    } finally {
      setIsDeletingBooking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto w-full pb-12"
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

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="text-[#9f1521] shrink-0" size={22} /> Layanan Armada
            & Kendaraan Dinas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Kelola dan ajukan request peminjaman kendaraan operasional dinas
            Kantor OJK Sumsel.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap sm:flex-nowrap justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchVehicleData}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Refresh Data"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} /> Tambah Kendaraan
              </button>
            )}

            <button
              onClick={() => handleOpenModal()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-900/10 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} /> Request Kendaraan Dinas
            </button>
          </div>
        </div>
      </div>

      {/* RIWAYAT & PENGAJUAN KENDARAAN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Calendar size={18} className="text-[#9f1521]" /> Daftar Pengajuan
          Kendaraan
        </h2>

        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider">
                  <th className="p-3">Armada / Mobil</th>
                  <th className="p-3">Tujuan & Penumpang</th>
                  <th className="p-3">Peminjam</th>
                  <th className="p-3">Tanggal Penugasan</th>
                  <th className="p-3">Catatan Admin</th>
                  <th className="p-3 text-center">Status</th>
                  {isAdmin && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {b.vehicleName === "Menunggu Plotting Admin" ||
                      !b.vehicleName ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-md text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                          Menunggu Plotting Admin
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {b.vehicleName}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 font-bold">
                          <MapPin size={12} className="text-[#9f1521]" />
                          {b.destination}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <User size={12} /> {b.passengers} Penumpang
                        </span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold">{b.borrower}</span>
                      <br />
                      <span className="text-[10px] text-slate-400">
                        {b.dept || "Umum"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {b.startDate} s.d {b.endDate}
                    </td>
                    <td className="p-3 text-slate-500">
                      {b.status === "Disetujui" ? (
                        <p className="italic text-[11px]">💬 {b.notes}</p>
                      ) : (
                        <span className="italic text-slate-400">
                          Menunggu verifikasi
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
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
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {b.status === "Pending" && (
                            <button
                              onClick={() =>
                                handleOpenApprovalModal(
                                  b.id,
                                  b.vehicleName,
                                  b.userId,
                                  b.passengers,
                                  b.phone,
                                )
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer text-[11px]"
                            >
                              Plotting & Setujui
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleOpenDeleteModal(
                                b.id,
                                b.vehicleName,
                                b.borrower,
                              )
                            }
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Pengajuan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-4 text-center border-t border-dashed border-slate-200 dark:border-slate-800">
            Belum ada catatan request peminjaman kendaraan aktif saat ini.
          </p>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT KENDARAAN (KHUSUS ADMIN) */}
      {isAddVehicleModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col my-auto"
          >
            <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingVehicleId
                  ? "Edit Data Kendaraan"
                  : "Tambah Armada Kendaraan Baru"}
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
              onSubmit={handleAddOrUpdateVehicleSubmit}
              className="p-6 space-y-4 text-xs font-medium text-slate-800 dark:text-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="Contoh: 7 Penumpang / Sepeda Motor"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Status Kendaraan
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
                    <option value="Perawatan">Perawatan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1 block">
                    Kategori Kendaraan
                  </label>
                  <select
                    value={newVehicleData.category}
                    onChange={(e) =>
                      setNewVehicleData({
                        ...newVehicleData,
                        category: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Khusus Pimpinan">Khusus Pimpinan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kendaraan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL PLOTTING & VERIFIKASI ADMIN */}
      {approvalModal.isOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4 my-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  VERIFIKASI & PLOTTING ADMIN
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Plotting Kendaraan
                </h3>
              </div>
              <button
                onClick={() =>
                  setApprovalModal({
                    isOpen: false,
                    bookingId: null,
                    vehicleName: "",
                    userId: undefined,
                    phone: "",
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
                  Pilih Kendaraan (Plotting)
                </label>
                <select
                  value={approvalForm.selectedVehicle}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      selectedVehicle: e.target.value,
                    })
                  }
                  disabled={isSubmittingApproval}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold cursor-pointer disabled:opacity-50 text-slate-800 dark:text-slate-100"
                  required
                >
                  <option value="">-- Pilih Armada / Kendaraan --</option>
                  {vehicles
                    .filter((v) => v.status === "Tersedia")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name} ({v.plateNumber}) - {v.capacity}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-amber-600 mt-1 italic">
                  * Hanya menampilkan kendaraan dengan status
                  &quot;Tersedia&quot;
                </p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 mb-1 block">
                  Jumlah Penumpang Terverifikasi
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
                  Catatan / Instruksi Supir (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={approvalForm.notes}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, notes: e.target.value })
                  }
                  disabled={isSubmittingApproval}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium resize-none disabled:opacity-50"
                  placeholder="Contoh: Supir Bpk. Budi, standby jam 08:00 di Lobi."
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setApprovalModal({
                      isOpen: false,
                      bookingId: null,
                      vehicleName: "",
                      userId: undefined,
                      phone: "",
                    })
                  }
                  disabled={isSubmittingApproval}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingApproval ? "Memproses..." : "Plotting & Setujui"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PENGAJUAN KENDARAAN */}
      {deleteModal.isOpen && isAdmin && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hapus Pengajuan Kendaraan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan menghapus permanen data request ke{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.vehicleName}
                </strong>{" "}
                oleh{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.borrowerName}
                </strong>
                . Apakah Anda yakin?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    bookingId: null,
                    vehicleName: "",
                    borrowerName: "",
                  })
                }
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingBooking}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-75"
              >
                {isDeletingBooking ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
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

      {/* MODAL RESERVASI / REQUEST KENDARAAN */}
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
