export function getSmartStatus(agenda: {
  date: string;
  endDate?: string;
  time: string;
  status: string;
  type?: string;
}) {
  if (agenda.status === "Pending") return "Pending";
  if (agenda.status === "Ditolak") return "Ditolak";
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

    if (!y || !m || !d) return agenda.status;

    const [startT, endT] = agenda.time.split(" - ");
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

    if (now < startTime) return "Disetujui";
    if (now >= startTime && now <= endTime) return "Sedang Berlangsung";
    if (now > endTime) return "Selesai";
  } catch (e) {
    return agenda.status;
  }
  return agenda.status;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "";
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
    m = "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      [, m, d] = parts; // YYYY-MM-DD -> ambil bulan dan hari
    }
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      [d, m] = parts; // DD/MM/YYYY -> ambil hari dan bulan
    }
  }

  if (!d || !m) return dateStr;
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}
