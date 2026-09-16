import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// 1. Inisialisasi Font Plus Jakarta Sans
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap", // Membuat loading font lebih mulus
});

// 2. Tambahkan Metadata Viewport & Theme Color
export const viewport: Viewport = {
  themeColor: "#9f1521",
  width: "device-width",
  initialScale: 1,
};

// 3. Metadata Aplikasi Lengkap (Favicon & SEO)
export const metadata: Metadata = {
  title: "AMPERA - Kantor OJK Provinsi Sumatera Selatan",
  description: "Aplikasi Manajemen Peminjaman Ruangan & Kendaraan",
  icons: {
    icon: "/favicon.ico",
  },
};

// 4. Tambahkan Tipe TypeScript untuk Props (children)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // Ubah bahasa utama ke Indonesia ('id')
      // Masukkan variabel font jakarta ke dalam tag html
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning // Menghindari warning hydration jika menggunakan ekstensi browser
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
