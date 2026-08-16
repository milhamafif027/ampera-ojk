import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Tambahkan Metadata Viewport & Theme Color
export const viewport: Viewport = {
  themeColor: "#9f1521",
  width: "device-width",
  initialScale: 1,
};

// 2. Metadata Aplikasi Lengkap (Favicon & SEO)
export const metadata: Metadata = {
  title: "AMPERA - Kantor OJK Provinsi Sumatera Selatan",
  description: "Aplikasi Manajemen Peminjaman Ruangan & Kendaraan",
  icons: {
    icon: "/favicon.ico",
  },
};

// 3. Tambahkan Tipe TypeScript untuk Props (children)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // Ubah bahasa utama ke Indonesia ('id')
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Menghindari warning hydration jika menggunakan ekstensi browser
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
