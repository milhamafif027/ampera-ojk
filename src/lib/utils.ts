export function getSmartStatus(agenda: {
  date: string;
  endDate?: string;
  time: string;
  status: string;
  type?: string;
}) {
  if (agenda.status === "Pending") return "Pending";
  if (agenda.status === "Ditolak") return "Ditolak";

  // Jika string date tidak ada atau terindikasi bukan tanggal yang valid (misal teks bebas),
  // langsung kembalikan status aslinya tanpa menjalankan kalkulasi waktu.
  if (!agenda.date || typeof agenda.date !== "string") {
    return agenda.status || "Disetujui";
  }

  try {
    let y = "",
      m = "",
      d = "";

    // Deteksi apakah format date YYYY-MM-DD atau DD/MM/YYYY
    if (agenda.date.includes("-")) {
      const parts = agenda.date.split("T")[0].split("-");
      if (parts.length === 3) {
        [y, m, d] = parts; // Format: YYYY-MM-DD
      }
    } else if (agenda.date.includes("/")) {
      const parts = agenda.date.split("/");
      if (parts.length === 3) {
        [d, m, y] = parts; // Format: DD/MM/YYYY
      }
    }

    // Validasi tambahan: pastikan tahun berupa angka (mencegah teks non-tanggal lolos)
    if (!y || !m || !d || isNaN(Number(y)) || Number(y) < 2000) {
      return agenda.status || "Disetujui";
    }

    // Jika format waktu kosong / berupa teks non-waktu, beri default aman
    const timeStr =
      agenda.time && agenda.time.includes(" - ")
        ? agenda.time
        : "00:00 - 23:59";
    const [startT, endT] = timeStr.split(" - ");
    const now = new Date();

    const startTime = new Date(`${y}-${m}-${d}T${startT || "00:00"}`);
    let endTime: Date;

    if (agenda.type === "Multi-hari" && agenda.endDate) {
      let ey = "",
        em = "",
        ed = "";
      if (agenda.endDate.includes("-")) {
        [ey, em, ed] = agenda.endDate.split("T")[0].split("-");
      } else if (agenda.endDate.includes("/")) {
        [ed, em, ey] = agenda.endDate.split("/");
      }
      endTime = new Date(`${ey}-${em}-${ed}T${endT || "23:59"}`);
    } else {
      endTime = new Date(`${y}-${m}-${d}T${endT || "23:59"}`);
    }

    // Jika tanggal invalid (Invalid Date), fallback ke status aman
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return agenda.status || "Disetujui";
    }

    if (now < startTime) return "Disetujui";
    if (now >= startTime && now <= endTime) return "Sedang Berlangsung";
    if (now > endTime) return "Selesai";
  } catch (e) {
    return agenda.status || "Disetujui";
  }
  return agenda.status || "Disetujui";
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  let d = "",
    m = "",
    y = "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      [y, m, d] = parts; // YYYY-MM-DD
    }
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      [d, m, y] = parts; // DD/MM/YYYY
    }
  }

  // Jika format bukan tanggal valid, kembalikan string aslinya daripada error / kosong
  if (!d || !m || isNaN(Number(m)) || Number(m) < 1 || Number(m) > 12) {
    return dateStr;
  }

  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}
