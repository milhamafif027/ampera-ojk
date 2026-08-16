export type StatusPengajuan =
  | "Pending"
  | "Disetujui"
  | "Ditolak"
  | "Sedang Berlangsung"
  | "Selesai";

export interface RoomGalleryItem {
  url: string;
  caption?: string;
}

export interface Room {
  id: string;
  name: string;
  category?: "Ruang Rapat" | "Ruang Pertemuan";
  capacity?: string;
  loc?: string;
  address?: string;
  img: string;
  desc?: string;
  gallery?: (string | RoomGalleryItem)[];
  isLayoutLocked?: boolean;
  agendas?: Agenda[];
}

export interface Agenda {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  room: string;
  pic: string;
  dept?: string;
  email?: string;
  phone?: string;
  userEmail?: string;
  jumlahOrang?: string;
  konsumsi?: string;
  layout?: string;
  tools?: string;
  notes?: string;
  status: StatusPengajuan;
  smartStatus?: StatusPengajuan;
  type?: "single" | "Multi-hari";
  createdAt?: any;
}

export interface Vehicle {
  id: string;
  pic: string;
  departemen: string;
  phone?: string;
  email?: string;
  kegiatan: string;
  tujuan: string;
  startDate: string;
  endDate?: string;
  jumlahOrang?: string;
  penumpang?: string;
  jenisPerjalanan?: string;
  beratBagasi?: string;
  status: StatusPengajuan;
}

export interface Hotel {
  id: number;
  name: string;
  area: string;
  stars: number;
  rating: number;
  address: string;
  phone: string;
  facilities: string;
  ojkNotes: string;
  img: string;
  website: string;
}
