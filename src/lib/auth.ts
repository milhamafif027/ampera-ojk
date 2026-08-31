// src/lib/auth.ts
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  Car,
  Hotel,
  HelpCircle,
  Users, // <-- Jangan lupa import ikon Users
} from "lucide-react";

export interface LocalUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "internal_kopg" | "eksternal" | string;
  nip?: string;
}

export const navItemsConfig = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboardUtama",
    icon: LayoutDashboard,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  {
    key: "kalender",
    label: "Kalender Kegiatan",
    href: "/kalender",
    icon: Calendar,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  {
    key: "agenda",
    label: "Daftar Agenda",
    href: "/agenda",
    icon: ClipboardList,
    roles: ["admin", "internal_kopg"],
  },
  {
    key: "ruangan",
    label: "Manajemen Ruangan",
    href: "/ruangan",
    icon: Building2,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  {
    key: "kendaraan",
    label: "Manajemen Kendaraan",
    href: "/kendaraan",
    icon: Car,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  {
    key: "partner",
    label: "Hotel Rekanan",
    href: "/partner",
    icon: Hotel,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  {
    key: "bantuan",
    label: "Pusat Bantuan & Vendor",
    href: "/bantuan",
    icon: HelpCircle,
    roles: ["admin", "internal_kopg", "eksternal"],
  },
  // Tambahkan menu khusus Admin di sini
  {
    key: "kelolaAkun",
    label: "Kelola Akun & Akses",
    href: "/kelolaAkun",
    icon: Users,
    roles: ["admin"], // <-- Hanya bisa diakses oleh admin
  },
];

export function getFilteredNavItems(role?: string) {
  if (!role) return [];

  // Normalisasi role ke lowercase untuk menghindari masalah perbedaan huruf besar/kecil
  const normalizedRole = role.trim().toLowerCase();

  // Filter menu berdasarkan role yang dimiliki user
  return navItemsConfig.filter((item) => item.roles.includes(normalizedRole));
}
