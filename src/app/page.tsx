"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Compass, ChevronLeft, ChevronRight, X, Info } from "lucide-react";

// Data lengkap dari seluruh halaman booklet
const allBookletCards = [
  {
    id: 1,
    title: "Pimpinan OJK Provinsi Sumatera Selatan",
    category: "Profil Pimpinan",
    description: "Kantor OJK Provinsi Sumatera Selatan dipimpin oleh Bapak Arifin Susanto selaku Kepala OJK Provinsi Sumatera Selatan, didukung oleh Achmad Fauzi (Kepala Direktorat Pengawasan LJK) dan Tito Adji Siswantoro (Kepala Direktorat Pengawasan Perilaku PUJK, Edukasi & Pelindungan Konsumen, dan LMSt)[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/4.png",
    badge: "Pimpinan",
    location: "KOPG Sumsel",
    detailInfo: "Kantor OJK Provinsi Sumatera Selatan berkomitmen memberikan pelayanan terbaik dalam pengawasan lembaga jasa keuangan serta perlindungan konsumen di wilayah Sumbagsel.",
  },
  {
    id: 2,
    title: "Sejarah & Profil Gedung KOPG",
    category: "Profil & Sejarah Kantor",
    description: "Sejak Oktober 2022, Kantor OJK Provinsi Sumatera Selatan berlokasi di Jl. Jend. Sudirman No. 1025. Gedung 8 lantai ini merupakan satu-satunya bangunan bersertifikat Green Building kategori Gold di Sumatera Selatan dengan total 113 pegawai[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/6.png",
    badge: "Fasilitas Utama",
    location: "Jl. Jend. Sudirman No. 1025",
  },
  {
    id: 3,
    title: "Work-Life Balance Area (Lantai 8)",
    category: "Fasilitas Internal KOPG",
    description: "Fasilitas rekreasi insan OJK di lantai 8 yang dilengkapi mini golf dengan pemandangan Kota Palembang, ruang gym lengkap, studio band CETO, hingga area billiard dan tenis meja[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/7.png",
    badge: "Area Rekreasi",
    location: "Lantai 8 Gedung KOPG",
    detailInfo: "Disediakan untuk menjaga kebugaran dan kesehatan mental pegawai setelah jam kerja, termasuk latihan musik rutin setiap hari Jumat.",
  },
  {
    id: 4,
    title: "Sultan Muda Sumsel Center (SMSC)",
    category: "Pusat Kolaborasi",
    description: "Berada di lantai 3 sebagai ruang khusus business matching dan pusat inkubasi pembelajaran pengusaha muda di Sumatera Selatan hasil kolaborasi program ekonomi daerah[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/5.png",
    badge: "Lantai 3 KOPG",
    location: "Kandang Kolaborasi",
  },
  {
    id: 5,
    title: "Alternatif Transportasi dari Bandara",
    category: "Panduan Transportasi",
    description: "Setibanya di Bandara SMB II, pengunjung dapat memilih Taksi Bluebird/Balido, Taksi Online (Grab Lounge tersedia), atau menggunakan LRT Sumsel menuju Stasiun Bumi Sriwijaya dengan tarif terjangkau[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/10.png",
    badge: "Transportasi",
    location: "Bandara SMB II - Palembang",
  },
  {
    id: 6,
    title: "Wisata Kuliner Pindang Legendaris",
    category: "Kuliner Khas",
    description: "Makan siang wajib mencoba Pindang khas Palembang dengan bumbu serai, kunyit, lengkuas, dan asam kandis. Rekomendasi tempat: Pindang Sarinande, Pindang Musi Rawas, dan Pindang Umak[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/11.png",
    badge: "Wajib Coba",
    location: "Berbagai Lokasi",
  },
  {
    id: 7,
    title: "Destinasi Wisata Sejarah & Ikon",
    category: "Destinasi Wisata",
    description: "Menjelajahi Jembatan Ampera, Benteng Kuto Besak (BKB), Museum Balaputra Dewa (rumah limas pecahan Rp10.000), Pulau Kemaro, hingga Masjid Agung Palembang[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/13.png",
    badge: "Ikon Kota",
    location: "Pusat Kota Palembang",
  },
  {
    id: 8,
    title: "Jakabaring Sport City (JSC)",
    category: "Wisata Olahraga",
    description: "Kawasan olahraga terpadu bertaraf internasional (eks SEA Games & Asian Games) yang dilengkapi danau buatan, jogging track, dan ikon enam rumah ibadah berdampingan[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/14.png",
    badge: "Kawasan Terpadu",
    location: "Seberang Ulu, Palembang",
  },
  {
    id: 9,
    title: "Wisata Modern & Kopi Lokal",
    category: "Spot Modern",
    description: "Menikmati suasana heritage di Van Den Berg (sejak 1926) atau mencicipi kopi khas Tanah Venesia dari Timur di kedai Kopi Agam Pisan & Beskabean Coffee[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/16.png",
    badge: "Cafe & Heritage",
    location: "Sudut Kota Palembang",
  },
  {
    id: 10,
    title: "Surga Durian & Buah Duku",
    category: "Kuliner Musiman",
    description: "Menikmati durian segar langsung di tempat atau mampir ke sentra durian seperti Darman Durian, Pasar Duren Kuto, dan Dapoer Duren, serta mencicipi buah duku lokal khas Palembang[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/17.png",
    badge: "Durian & Duku",
    location: "Demang Lebar Daun & Kuto",
  },
  {
    id: 11,
    title: "Kuliner Dekat Kantor OJK",
    category: "Kuliner Sekitar Kantor",
    description: "Cuma jalan kaki 5 menit dari kantor OJK Sumsel, Anda bisa mencicipi Martabak HAR Simpang Sekip, Mie Celor H.M. Syafei Z., hingga Pempek Vico & Beringin[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/18.png",
    badge: "Kuliner Cepat",
    location: "Jl. Jend. Sudirman",
  },
  {
    id: 12,
    title: "Kamus Bahaso Palembang Doken",
    category: "Edukasi Lokal",
    description: "Yuk kenali bahasa lokal: Wong (Orang), Iwak (Ikan), Cindo (Cantik), Belagak (Tampan), Peh (Ayo), Balek (Pulang), Kagek (Nanti), dan Cacaknyo (Sepertinya)[cite: 1].",
    image: "/Cetak-Booklet Wisata Palembang/23.png",
    badge: "Wong Kito Galo",
    location: "Kearifan Lokal",
  },
];

export default function SlidingCardsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // Efek Auto-Scroll / Berjalan Otomatis
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    const scrollSpeed = 0.8; // Kecepatan geser otomatis

    const autoScroll = () => {
      if (!isPaused && container) {
        container.scrollLeft += scrollSpeed;
        // Jika sudah mentok ke ujung kanan, putar balik ke awal secara mulus
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const scrollByAmount = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full py-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521] dark:text-rose-400 flex items-center gap-1.5">
            <Compass size={14} /> EKSPLORASI OJK & BOOKLET WISATA PALEMBANG
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-0.5">
            Panduan Lengkap Kantor & Destinasi Wong Kito Galo
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByAmount(-300)}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            title="Geser Kiri"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollByAmount(300)}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
            title="Geser Kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Container Card Berjalan dengan Auto-Pause saat Hover */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 custom-scrollbar px-1 snap-x scroll-smooth cursor-grab active:cursor-grabbing"
      >
        {allBookletCards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between shrink-0 snap-start group cursor-pointer"
          >
            <div>
              {/* Thumbnail Gambar */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#9f1521] dark:text-rose-400 rounded-full shadow-sm">
                  {card.badge}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-[10px] text-white font-medium flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <Info size={12} /> Klik untuk lihat detail
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  {card.category}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-[#9f1521] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[180px]">
                <MapPin size={12} className="text-[#9f1521] shrink-0" />
                {card.location}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">
                OJK Sumsel
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL POP-UP DETAIL INFORMASI CARD */}
      {selectedCard && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9f1521]">
                  {selectedCard.category}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                <Image
                  src={selectedCard.image}
                  alt={selectedCard.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-medium">{selectedCard.description}</p>
                {selectedCard.detailInfo && (
                  <p className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-slate-700 dark:text-rose-200">
                    💡 {selectedCard.detailInfo}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs shrink-0">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <MapPin size={14} className="text-[#9f1521]" /> {selectedCard.location}
              </span>
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 bg-[#9f1521] hover:bg-[#7a1019] text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}