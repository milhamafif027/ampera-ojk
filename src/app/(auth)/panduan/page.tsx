"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  ArrowLeft,
  Download,
  Building,
  Car,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function PanduanPage() {
  const [openAccordion, setExpandedAccordion] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setExpandedAccordion(openAccordion === index ? null : index);
  };

  const faqList = [
    {
      q: "Bagaimana alur peminjaman ruang rapat di Kantor OJK Sumsel?",
      a: 'Peminjaman dilakukan dengan masuk ke portal internal AMPERA > pilih menu "Ruangan" > klik "+ Reservasi Ruangan" > isi formulir 4 langkah (PIC, detail acara, pilihan ruangan & layout) > kirim pengajuan. Pengajuan akan ditinjau oleh Admin TIM LMSt.',
      icon: Building,
    },
    {
      q: "Berapa lama batas waktu pengajuan reservasi ruangan sebelum acara?",
      a: "Pengajuan reservasi ruangan disarankan dilakukan minimal H-1 sebelum kegiatan berlangsung agar TIM LMSt dapat mempersiapkan penataan layout, kebersihan, dan perlengkapan audio/video.",
      icon: Clock,
    },
    {
      q: "Bagaimana prosedur peminjaman kendaraan dinas?",
      a: 'Pegawai mengakses menu "Kendaraan" di portal internal > memeriksa ketersediaan jadwal armada pada kalender > mengisi form peminjaman (tujuan, kegiatan, tanggal, daftar penumpang, dan bagasi) > kirim pengajuan. Notifikasi persetujuan akan dikirimkan via WhatsApp.',
      icon: Car,
    },
    {
      q: "Bagaimana jika terjadi bentrok jadwal ruangan atau armada?",
      a: "Sistem AMPERA secara otomatis menolak pengajuan yang memiliki irisan waktu dengan jadwal yang sudah disetujui (termasuk jeda pembersihan 1 jam). Jika terdesak, silakan koordinasi langsung dengan Tim Protokol / Admin LMSt.",
      icon: ShieldAlert,
    },
    {
      q: "Bagaimana cara membatalkan atau mengedit pengajuan yang sudah dibuat?",
      a: 'Pengaju dapat melihat status pengajuannya di bagian "Pengajuan Pending" pada Dashboard. Selama status masih Pending, tombol "Edit" dan "Batalkan" tersedia pada kartu pengajuan tersebut.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors shadow-sm"
              title="Kembali ke Login"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Panduan System & SOP
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Operasional AMPERA — OJK Provinsi Sumatera Selatan
              </p>
            </div>
          </div>

          <a
            href="/rating-harga-ojk.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/10 shrink-0"
          >
            <Download size={15} /> Unduh PDF SOP
          </a>
        </div>

        {/* Quick Info Banner */}
        <div className="bg-gradient-to-r from-[#9f1521] to-[#7a1019] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-white/20 border border-white/30 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-rose-200">
              PUSAT INFORMASI PEGAWAI
            </span>
            <h2 className="text-xl md:text-2xl font-bold leading-snug">
              Butuh Bantuan Akses atau Penggunaan Sistem?
            </h2>
            <p className="text-xs text-rose-100 font-medium max-w-lg leading-relaxed">
              Pelajari petunjuk penggunaan atau hubungi Layanan Helpdesk TIM
              LMSt Kantor OJK Provinsi Sumatera Selatan.
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-md"
          >
            Lihat Landing Page
          </Link>
        </div>

        {/* Accordion FAQ Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-red-50 text-red-700 rounded-xl">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Pertanyaan Sering Diajukan (FAQ)
              </h3>
              <p className="text-xs text-slate-400">
                Petunjuk umum alur peminjaman fasilitas kantor
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const Icon = item.icon;
              const isOpen = openAccordion === idx;

              return (
                <div
                  key={idx}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isOpen
                      ? "border-red-200 bg-red-50/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isOpen ? "bg-red-700 text-white" : "bg-slate-100 text-slate-500"}`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-bold text-xs md:text-sm text-slate-800">
                        {item.q}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-red-700" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-red-100/50">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Viewer Preview Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Dokumen SOP Resmi OJK Sumsel
                </h3>
                <p className="text-xs text-slate-400">
                  Standar Operasional Prosedur Pengelolaan Fasilitas
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-red-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  SOP Peminjaman Ruang & Kendaraan Dinas.pdf
                </p>
                <p className="text-[10px] text-slate-400">
                  Dokumen Regulasi Internal Kantor OJK Prov. Sumsel
                </p>
              </div>
            </div>
            <a
              href="/rating-harga-ojk.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              Buka Dokumen
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">
          © 2026 Tim LMSt • Kantor OJK Provinsi Sumatera Selatan
        </p>
      </div>
    </div>
  );
}
