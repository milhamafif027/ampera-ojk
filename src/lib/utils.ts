export function getSmartStatus(agenda: {
  date: string;
  endDate?: string;
  time: string;
  status: string;
  type?: string;
}) {
  if (agenda.status === "Pending") return "Pending";
  if (agenda.status === "Ditolak") return "Ditolak";

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
        [y, m, d] = parts;
      }
    } else if (agenda.date.includes("/")) {
      const parts = agenda.date.split("/");
      if (parts.length === 3) {
        [d, m, y] = parts;
      }
    }

    if (!y || !m || !d || isNaN(Number(y)) || Number(y) < 2000) {
      return agenda.status || "Disetujui";
    }

    // Bersihkan teks WIB dan format waktu
    const cleanTime = (agenda.time || "").replace(/wib/gi, "").trim();

    const timeStr =
      cleanTime && cleanTime.includes(" - ") ? cleanTime : "00:00 - 23:59";

    const [rawStartT, rawEndT] = timeStr.split(" - ");
    const startT = (rawStartT || "00:00").trim().slice(0, 5);
    const endT = (rawEndT || "23:59").trim().slice(0, 5);

    const now = new Date();
    const startTime = new Date(
      `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${startT}:00`,
    );

    let endTime: Date;

    const hasValidEndDate =
      agenda.endDate &&
      typeof agenda.endDate === "string" &&
      agenda.endDate.trim() !== "" &&
      agenda.endDate.slice(0, 10) !== agenda.date.slice(0, 10);

    if (hasValidEndDate && agenda.endDate) {
      let ey = "",
        em = "",
        ed = "";
      if (agenda.endDate.includes("-")) {
        const parts = agenda.endDate.split("T")[0].split("-");
        if (parts.length === 3) [ey, em, ed] = parts;
      } else if (agenda.endDate.includes("/")) {
        const parts = agenda.endDate.split("/");
        if (parts.length === 3) [ed, em, ey] = parts;
      }

      if (ey && em && ed) {
        endTime = new Date(
          `${ey}-${em.padStart(2, "0")}-${ed.padStart(2, "0")}T${endT}:00`,
        );
      } else {
        endTime = new Date(
          `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${endT}:00`,
        );
      }
    } else {
      endTime = new Date(
        `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${endT}:00`,
      );
    }

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return agenda.status || "Disetujui";
    }

    if (now < startTime) return "Disetujui";
    if (now >= startTime && now <= endTime) return "Sedang Berlangsung";
    if (now > endTime) return "Selesai";
  } catch {
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
      [y, m, d] = parts;
    }
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      [d, m, y] = parts;
    }
  }

  if (!d || !m || isNaN(Number(m)) || Number(m) < 1 || Number(m) > 12) {
    return dateStr;
  }

  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

// PERBAIKAN: Format Tanggal Indonesia Sesuai Kaidah (Hari, Tanggal Bulan Tahun)
export function formatAgendaDate(
  dateStr?: string,
  endDateStr?: string,
): string {
  if (!dateStr) return "-";

  try {
    const cleanStart = String(dateStr).split("T")[0].trim();
    const cleanEnd = endDateStr
      ? String(endDateStr).split("T")[0].trim()
      : cleanStart;

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    const startDateObj = new Date(cleanStart);
    if (isNaN(startDateObj.getTime())) return cleanStart;

    const formattedStart = startDateObj.toLocaleDateString("id-ID", options);

    if (!cleanEnd || cleanStart === cleanEnd) {
      return formattedStart;
    }

    const endDateObj = new Date(cleanEnd);
    if (isNaN(endDateObj.getTime())) return `${cleanStart} s.d. ${cleanEnd}`;

    const formattedEnd = endDateObj.toLocaleDateString("id-ID", options);
    return `${formattedStart} s.d. ${formattedEnd}`;
  } catch {
    return dateStr;
  }
}
