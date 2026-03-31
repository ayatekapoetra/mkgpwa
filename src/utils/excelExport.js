import * as XLSX from "xlsx";
import moment from "moment";

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getSmuValues = (timesheet, item) => {
  const smuStart = toNumber(item?.smustart ?? timesheet?.smustart);
  const smuFinish = toNumber(
    item?.smufinish ?? timesheet?.smufinish ?? smuStart,
  );
  const used = toNumber(
    item?.usedsmu ?? timesheet?.usedhmkm ?? smuFinish - smuStart,
  );
  return { smuStart, smuFinish, used };
};

const calculateActivityDuration = (starttime, endtime) => {
  if (!starttime || !endtime) return "0.00";

  const startMoment = moment(starttime);
  const endMoment = moment(endtime);

  if (!startMoment.isValid() || !endMoment.isValid()) return "0.00";

  const durationMinutes = endMoment.diff(startMoment, "minutes");
  const durationHours = (durationMinutes / 60).toFixed(2);

  return durationHours;
};

export const generateHeavyEquipmentTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk di-export");
  }

  const rows = [];

  const headers = [
    "Tanggal",
    "Kategori",
    "Nama penyewa",
    "Tools",
    "Kode equipment",
    "Shift kerja",
    "KTP",
    "Nama operator/driver",
    "HM start",
    "HM finish",
    "HM total",
    "Lokasi kerja",
    "Block sequences",
    "Jam start",
    "Jam finish",
    "Istirahat",
    "Total jam",
    "Keterangan",
    "Kegiatan kerja",
    "Nama material",
    "Nama pengawas",
    "Kode timesheet",
    "Created At",
  ];

  rows.push(headers);

  data.forEach((timesheet) => {
    const items = timesheet.items || [];

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
      const namaPenyewa = timesheet.penyewa?.nama || "-";
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.date_ops
          ? moment(timesheet.date_ops).format("DD-MM-YYYY")
          : "-",
        timesheet.mainact || "-",
        namaPenyewa,
        "-",
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || "-",
        timesheet.karyawan?.nama || "-",
        smuStart,
        smuFinish,
        used,
        "-",
        "-",
        "-",
        "-",
        1,
        "-",
        timesheet.keterangan || "-",
        timesheet.material?.nama || "-",
        timesheet.approvedByKaryawan?.nama || "-",
        timesheet.id || "-",
        timesheet.created_at
          ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
          : "-",
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        const tools = getToolsName(
          timesheet?.equipment?.tipe,
          item.kegiatan_id,
        );
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
        const namaPenyewa = timesheet.penyewa?.nama || "-";
        const activityDuration = calculateActivityDuration(
          item.starttime,
          item.endtime,
        );
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.date_ops
            ? moment(timesheet.date_ops).format("DD-MM-YYYY")
            : "-",
          timesheet.mainact || "-",
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || "-",
          timesheet.karyawan?.nama || "-",
          smuStart,
          smuFinish,
          used,
          item.lokasi?.nama || "-",
          item.seq || "-",
          item.starttime
            ? moment(item.starttime).format("DD-MM-YY HH:mm")
            : "-",
          item.endtime ? moment(item.endtime).format("DD-MM-YY HH:mm") : "-",
          1,
          activityDuration,
          timesheet.keterangan || "-",
          item.kegiatan?.nama || "-",
          item.material?.nama || "-",
          timesheet.approvedByKaryawan?.nama || "-",
          timesheet.id || "-",
          timesheet.created_at
            ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
            : "-",
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 12 }, // Tanggal
    { wch: 12 }, // Kategori
    { wch: 20 }, // Nama penyewa
    { wch: 10 }, // Tools
    { wch: 15 }, // Kode equipment
    { wch: 12 }, // Shift kerja
    { wch: 20 }, // KTP
    { wch: 25 }, // Nama operator/driver
    { wch: 10 }, // HM start
    { wch: 10 }, // HM finish
    { wch: 10 }, // HM total
    { wch: 20 }, // Lokasi kerja
    { wch: 15 }, // Block sequences
    { wch: 18 }, // Jam start
    { wch: 18 }, // Jam finish
    { wch: 10 }, // Istirahat
    { wch: 10 }, // Total jam
    { wch: 30 }, // Keterangan
    { wch: 20 }, // Kegiatan kerja
    { wch: 25 }, // Nama material
    { wch: 20 }, // Nama pengawas
    { wch: 15 }, // Kode timesheet
    { wch: 20 }, // Created At
  ];
  ws["!cols"] = colWidths;

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet HE");

  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const finalFilename = filename || `Timesheet_HE_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

function getShiftName(shiftId) {
  if (shiftId === 1) return "Pagi";
  if (shiftId === 2) return "Malam";
  return "-";
}

function getToolsName(equipmentType, kegiatanId) {
  const isExcavator = (equipmentType || "").toLowerCase() === "excavator";

  if (isExcavator) {
    if (kegiatanId === 15 || kegiatanId === 24) {
      return "breaker";
    }
    return "bucket";
  }

  return equipmentType || "bucket";
}

export const generateDumptruckTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk di-export");
  }

  const rows = [];

  const headers = [
    "Tanggal",
    "Nama penyewa",
    "Kode equipment",
    "Shift",
    "KTP",
    "Nama driver",
    "KM start",
    "KM finish",
    "KM used",
    "Waktu start",
    "Waktu finish",
    "Total jam",
    "Keterangan",
    "Lokasi awal",
    "Lokasi finish",
    "Sequence",
    "Ritase",
    "Kegiatan kerja",
    "Nama material",
    "Nama pengawas",
    "Kode timesheet",
    "Created At",
  ];

  rows.push(headers);

  data.forEach((timesheet) => {
    const items = timesheet.items || [];

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
      const namaPenyewa = timesheet.penyewa?.nama || "-";
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.date_ops
          ? moment(timesheet.date_ops).format("DD-MM-YYYY")
          : "-",
        namaPenyewa,
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || "-",
        timesheet.karyawan?.nama || "-",
        smuStart,
        smuFinish,
        used,
        "-",
        "-",
        "-",
        timesheet.keterangan || "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        timesheet.material?.nama || "-",
        timesheet.approvedByKaryawan?.nama || "-",
        timesheet.id || "-",
        timesheet.created_at
          ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
          : "-",
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
        const namaPenyewa = timesheet.penyewa?.nama || "-";
        const activityDuration = calculateActivityDuration(
          item.starttime,
          item.endtime,
        );
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.date_ops
            ? moment(timesheet.date_ops).format("DD-MM-YYYY")
            : "-",
          namaPenyewa,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || "-",
          timesheet.karyawan?.nama || "-",
          smuStart,
          smuFinish,
          used,
          item.starttime
            ? moment(item.starttime).format("DD-MM-YY HH:mm")
            : "-",
          item.endtime ? moment(item.endtime).format("DD-MM-YY HH:mm") : "-",
          activityDuration,
          timesheet.keterangan || "-",
          item.lokasi?.nama || "-",
          item.lokasiTujuan?.nama || "-",
          item.seq || "-",
          item.ritase || 0,
          item.kegiatan?.nama || "-",
          item.material?.nama || "-",
          timesheet.approvedByKaryawan?.nama || "-",
          timesheet.id || "-",
          timesheet.created_at
            ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
            : "-",
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 12 }, // Tanggal
    { wch: 20 }, // Nama penyewa
    { wch: 15 }, // Kode equipment
    { wch: 10 }, // Shift
    { wch: 20 }, // KTP
    { wch: 25 }, // Nama driver
    { wch: 10 }, // KM start
    { wch: 10 }, // KM finish
    { wch: 10 }, // KM used
    { wch: 18 }, // Waktu start
    { wch: 18 }, // Waktu finish
    { wch: 10 }, // Total jam
    { wch: 30 }, // Keterangan
    { wch: 20 }, // Lokasi awal
    { wch: 20 }, // Lokasi finish
    { wch: 10 }, // Sequence
    { wch: 10 }, // Ritase
    { wch: 20 }, // Kegiatan kerja
    { wch: 15 }, // Nama material
    { wch: 20 }, // Nama pengawas
    { wch: 15 }, // Kode timesheet
    { wch: 20 }, // Created At
  ];
  ws["!cols"] = colWidths;

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet DT");

  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const finalFilename = filename || `Timesheet_DT_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

export const generateAllTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk di-export");
  }

  const rows = [];

  const headers = [
    "Kategori Equipment",
    "Tanggal",
    "Kategori Aktivitas",
    "Nama penyewa",
    "Tools",
    "Kode equipment",
    "Shift kerja",
    "KTP",
    "Nama operator/driver",
    "HM/KM start",
    "HM/KM finish",
    "HM/KM total",
    "Lokasi kerja",
    "Lokasi tujuan",
    "Block sequences",
    "Ritase",
    "Jam start",
    "Jam finish",
    "Istirahat",
    "Total jam",
    "Keterangan",
    "Kegiatan kerja",
    "Nama material",
    "Nama pengawas",
    "Kode timesheet",
    "Created At",
  ];

  rows.push(headers);

  data.forEach((timesheet) => {
    const items = timesheet.items || [];
    const isHE = timesheet.equipment?.kategori === "HE";

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
      const namaPenyewa = timesheet.penyewa?.nama || "-";
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.equipment?.kategori || "-",
        timesheet.date_ops
          ? moment(timesheet.date_ops).format("DD-MM-YYYY")
          : "-",
        timesheet.mainact || "-",
        namaPenyewa,
        "-",
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || "-",
        timesheet.karyawan?.nama || "-",
        smuStart,
        smuFinish,
        used,
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        isHE ? 1 : "-",
        timesheet.keterangan || "-",
        timesheet.material?.nama || "-",
        "-",
        timesheet.approvedByKaryawan?.nama || "-",
        timesheet.id || "-",
        timesheet.created_at
          ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
          : "-",
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        const tools = getToolsName(
          timesheet?.equipment?.tipe,
          item.kegiatan_id,
        );
        const lokasiTujuan = !isHE ? item.lokasiTujuan?.nama || "-" : "-";
        const ritase = !isHE ? item.ritase || 0 : "-";
        const istirahat = isHE ? 1 : "-";
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || "-";
        const namaPenyewa = timesheet.penyewa?.nama || "-";
        const activityDuration = calculateActivityDuration(
          item.starttime,
          item.endtime,
        );
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.equipment?.kategori || "-",
          timesheet.date_ops
            ? moment(timesheet.date_ops).format("DD-MM-YYYY")
            : "-",
          timesheet.mainact || "-",
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || "-",
          timesheet.karyawan?.nama || "-",
          smuStart,
          smuFinish,
          used,
          item.lokasi?.nama || "-",
          lokasiTujuan,
          item.seq || "-",
          ritase,
          item.starttime
            ? moment(item.starttime).format("DD-MM-YY HH:mm")
            : "-",
          item.endtime ? moment(item.endtime).format("DD-MM-YY HH:mm") : "-",
          istirahat,
          activityDuration,
          timesheet.keterangan || "-",
          item.kegiatan?.nama || "-",
          item.material?.nama || "-",
          timesheet.approvedByKaryawan?.nama || "-",
          timesheet.id || "-",
          timesheet.created_at
            ? moment(timesheet.created_at).format("DD-MM-YYYY HH:mm:ss")
            : "-",
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 15 }, // Kategori Equipment
    { wch: 12 }, // Tanggal
    { wch: 15 }, // Kategori Aktivitas
    { wch: 20 }, // Nama penyewa
    { wch: 10 }, // Tools
    { wch: 15 }, // Kode equipment
    { wch: 12 }, // Shift kerja
    { wch: 20 }, // KTP
    { wch: 25 }, // Nama operator/driver
    { wch: 12 }, // HM/KM start
    { wch: 12 }, // HM/KM finish
    { wch: 12 }, // HM/KM total
    { wch: 20 }, // Lokasi kerja
    { wch: 20 }, // Lokasi tujuan
    { wch: 15 }, // Block sequences
    { wch: 10 }, // Ritase
    { wch: 18 }, // Jam start
    { wch: 18 }, // Jam finish
    { wch: 10 }, // Istirahat
    { wch: 10 }, // Total jam
    { wch: 30 }, // Keterangan
    { wch: 25 }, // Kegiatan kerja
    { wch: 15 }, // Nama material
    { wch: 20 }, // Nama pengawas
    { wch: 15 }, // Kode timesheet
    { wch: 20 }, // Created At
  ];
  ws["!cols"] = colWidths;

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet All");

  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const finalFilename = filename || `Timesheet_All_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

export const generateDailyEquipmentActivityExcel = (data, filename, options = {}) => {
  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk di-export");
  }

  const isDT = (options?.ctg || '').toUpperCase() === 'DT';

  if (isDT) {
    // Khusus format Dumptruck (DT): kolom JOB (gabungan kegiatan + lokasi + material), NO, Kode, Driver, Status, Keterangan
    const headers = ["JOB", "NO", "ID DT", "DRIVER", "STATUS", "KET"];
    const rows = [headers];

    // Grouping berdasarkan kegiatan + lokasi awal + lokasi tujuan + material
    const groups = {};
    const order = [];
    data.forEach((activity) => {
      const kegiatan = activity.kegiatan?.nama || '-';
      const lokasiAwal = activity.lokasi?.nama || '-';
      const lokasiTujuan = activity.lokasiTujuan?.nama || '-';
      const material = activity.material?.nama || activity.kegiatan?.material?.nama || '-';
      const key = `${kegiatan}|${lokasiAwal}|${lokasiTujuan}|${material}`;
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(activity);
    });

    // Susun rows dan catat merge job
    const merges = [];
    let currentRow = 1; // header di row 0 (aoa), tapi XLSX merge pakai index 0-based di sheet setelah aoa_to_sheet +1 untuk header

    order.forEach((key) => {
      const [kegiatan, lokasiAwal, lokasiTujuan, material] = key.split('|');
      const jobText = `${kegiatan}\n${lokasiAwal} - ${lokasiTujuan}\n${material}`;
      const items = groups[key];
      items.forEach((activity, idx) => {
        const row = [
          idx === 0 ? jobText : '',
          idx + 1,
          activity.equipment?.kode || `EQ-${activity.equipment_id}` || '-',
          activity.karyawan?.nama || '-',
          activity.status || '-',
          activity.keterangan || '-',
        ];
        rows.push(row);
      });

      if (items.length > 1) {
        // merge kolom JOB untuk grup ini
        const start = currentRow; // row index di aoa mulai 1
        const end = currentRow + items.length - 1;
        merges.push({ s: { r: start, c: 0 }, e: { r: end, c: 0 } });
      }
      currentRow += items.length;
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 40 }, // JOB
      { wch: 5 },  // NO
      { wch: 12 }, // ID DT
      { wch: 25 }, // DRIVER
      { wch: 15 }, // STATUS
      { wch: 40 }, // KET
    ];

    if (merges.length) ws['!merges'] = merges;

    // Style header
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D3D3D3' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }

    // Style status (warna breakdown/beroperasi)
    const statusColIndex = 4; // 0-based kolom STATUS pada array row (JOB,NO,ID,DRIVER,STATUS,KET)
    const statusColors = {
      BREAKDOWN: 'F5B0B0', // merah
      BEROPERASI: 'DCEAF6', // biru muda
    };
    for (let r = 1; r < rows.length; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c: statusColIndex });
      const statusVal = ws[cellAddr]?.v?.toString().toUpperCase?.() || '';
      const color = statusColors[statusVal];
      if (color) {
        ws[cellAddr].s = {
          fill: { fgColor: { rgb: color } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Equipment Activity DT');
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const finalFilename = filename || `Daily_Equipment_Activity_DT_${timestamp}.xlsx`;
    XLSX.writeFile(wb, finalFilename);
    return;
  }

  // Default format (umum)
  const rows = [];

  const headers = [
    "No",
    "Cabang",
    "Tanggal",
    "Shift",
    "Kegiatan",
    "Material",
    "Lokasi Asal",
    "Lokasi Tujuan",
    "Kode Equipment",
    "Nama Driver/Operator",
    "Status",
    "Keterangan",
  ];

  rows.push(headers);

  data.forEach((activity, index) => {
    const row = [
      index + 1,
      activity.cabang?.nama || "-",
      activity.date_ops ? moment(activity.date_ops).format("DD-MM-YYYY") : "-",
      activity.shift || "-",
      activity.kegiatan?.nama || "-",
      activity.material?.nama || "-",
      activity.lokasi?.nama || "-",
      activity.lokasiTujuan?.nama || "-",
      activity.equipment?.kode || `EQ-${activity.equipment_id}` || "-",
      activity.karyawan?.nama || "-",
      activity.status || "-",
      activity.keterangan || "-",
    ];
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [
    { wch: 5 },  // No
    { wch: 20 }, // Cabang
    { wch: 18 }, // Tanggal
    { wch: 12 }, // Shift
    { wch: 25 }, // Kegiatan
    { wch: 25 }, // Material
    { wch: 25 }, // Lokasi Asal
    { wch: 25 }, // Lokasi Tujuan
    { wch: 18 }, // Kode Equipment
    { wch: 25 }, // Nama Driver/Operator
    { wch: 15 }, // Status
    { wch: 40 }, // Keterangan
  ];

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily Equipment Activity");

  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const finalFilename =
    filename || `Daily_Equipment_Activity_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

// Generate PDF khusus Dumptruck (DT) mengikuti format tabel contoh (JOB, NO, ID DT, DRIVER, STATUS, KET)
export const generateDailyEquipmentActivityPdfDT = async (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const statusTextColors = {
    BREAKDOWN: [211, 47, 47],
    BEROPERASI: [46, 125, 50],
    STANDBY: [2, 136, 209],
    'NO JOB': [237, 108, 2],
    'NO OPERATOR': [156, 39, 176],
    'NO DRIVER': [156, 39, 176]
  };

  // group by date_ops + shift + cabang
  const topGroups = {};
  const topOrder = [];
  data.forEach((activity) => {
    const dateKey = activity.date_ops || '-';
    const shiftKey = activity.shift || '-';
    const cabangName = activity.cabang?.nama || '-';
    const topKey = `${dateKey}|${shiftKey}|${cabangName}`;
    if (!topGroups[topKey]) {
      topGroups[topKey] = [];
      topOrder.push(topKey);
    }
    topGroups[topKey].push(activity);
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
  const leftMargin = 14;
  const lineHeight = 14;
  let startY = 30;

  topOrder.forEach((topKey, groupIdx) => {
    const [dateKey, shiftKey, cabangName] = topKey.split('|');
    const activities = topGroups[topKey] || [];

    // Page break di awal setiap grup baru (kecuali grup pertama)
    if (groupIdx > 0) {
      doc.addPage();
      startY = 30;
    }

    // group by kegiatan+lokasiAwal+lokasiTujuan+material
    const jobGroups = {};
    const jobOrder = [];
    activities.forEach((activity) => {
      const kegiatan = activity.kegiatan?.nama || '-';
      const lokasiAwal = activity.lokasi?.nama || '-';
      const lokasiTujuan = activity.lokasiTujuan?.nama || '-';
      const material = activity.material?.nama || activity.kegiatan?.material?.nama || '-';
      const key = `${kegiatan}|${lokasiAwal}|${lokasiTujuan}|${material}`;
      if (!jobGroups[key]) {
        jobGroups[key] = [];
        jobOrder.push(key);
      }
      jobGroups[key].push(activity);
    });

    const body = [];
    jobOrder.forEach((key) => {
      const [kegiatan, lokasiAwal, lokasiTujuan, material] = key.split('|');
      const jobText = `${kegiatan}\n${lokasiAwal} - ${lokasiTujuan}\n${material}`;
      jobGroups[key].forEach((activity, idx) => {
        body.push([
          idx === 0 ? jobText : '',
          idx + 1,
          activity.equipment?.kode || `EQ-${activity.equipment_id}` || '-',
          activity.karyawan?.nama || '-',
          activity.status || '-',
          activity.keterangan || '-',
        ]);
      });
    });

    const formattedDate = moment(dateKey).isValid() ? moment(dateKey).format('DD MMM YYYY') : dateKey;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('MONITORING PEKERJAAN DUMPTRUCK', leftMargin, startY);

    // Meta table (cabang, tanggal, shift)
    const metaStart = startY + lineHeight * 0.9;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Cabang: ${cabangName}`, leftMargin, metaStart);
    doc.text(`Tanggal: ${formattedDate}`, leftMargin, metaStart + lineHeight * 0.8);
    doc.text(`Shift: ${shiftKey}`, leftMargin, metaStart + lineHeight * 1.6);

    const tableStartY = metaStart + lineHeight * 2.0;

    autoTable(doc, {
      head: [['JOB', 'NO', 'ID UNIT', 'NAMA DRIVER', 'STATUS', 'KET']],
      body,
      startY: tableStartY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        valign: 'middle',
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [230, 236, 245],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      columnStyles: {
        0: { cellWidth: 200 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 60, halign: 'center' },
        3: { cellWidth: 120 },
        4: { cellWidth: 70, halign: 'center' },
        5: { cellWidth: 330 },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 4) {
          const val = (dataCell.cell.raw || '').toString().toUpperCase();
          const color = statusTextColors[val];
          if (color) dataCell.cell.styles.textColor = color;
          dataCell.cell.styles.halign = 'center';
        }
        if (dataCell.section === 'body' && dataCell.column.index === 0) {
          dataCell.cell.styles.valign = 'top';
        }
      },
      margin: { left: leftMargin, right: 10 },
    });

    // Summary per status
    const counts = {};
    activities.forEach((a) => {
      const key = (a.status || '-').toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    const lastY = doc.lastAutoTable?.finalY || tableStartY;
    const summaryTitleY = lastY + 12;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Monitoring:', leftMargin, summaryTitleY);

    const summaryRows = Object.keys(counts).map((statusKey) => [statusKey, `${counts[statusKey]} Unit`]);

    autoTable(doc, {
      head: [['STATUS', 'JUMLAH']],
      body: summaryRows,
      startY: summaryTitleY + 4,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [230, 236, 245],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { cellWidth: 90, halign: 'center' },
      },
      margin: { left: leftMargin, right: 10 },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 0) {
          const val = (dataCell.cell.raw || '').toString().toUpperCase();
          const color = statusTextColors[val];
          if (color) dataCell.cell.styles.textColor = color;
        }
      },
    });

    startY = (doc.lastAutoTable?.finalY || summaryTitleY) + 10;
    if (startY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      startY = 30;
    }
  });

  const timestamp = moment().format('YYYYMMDD_HHmmss');
  const finalFilename = filename || `Daily_Equipment_Activity_DT_${timestamp}.pdf`;
  doc.save(finalFilename);
};

// Generate PDF khusus HE (Alat Berat) mengikuti format: JOB (kegiatan + material), NO, ID ALAT, OPERATOR, AREA KERJA, STATUS, KET
export const generateDailyEquipmentActivityPdfHE = async (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const statusTextColors = {
    BREAKDOWN: [211, 47, 47],
    BEROPERASI: [46, 125, 50],
    STANDBY: [2, 136, 209],
    'NO JOB': [237, 108, 2],
    'NO OPERATOR': [156, 39, 176],
    'NO DRIVER': [156, 39, 176]
  };

  // group by date_ops + shift + cabang
  const topGroups = {};
  const topOrder = [];
  data.forEach((activity) => {
    const dateKey = activity.date_ops || '-';
    const shiftKey = activity.shift || '-';
    const cabangName = activity.cabang?.nama || '-';
    const topKey = `${dateKey}|${shiftKey}|${cabangName}`;
    if (!topGroups[topKey]) {
      topGroups[topKey] = [];
      topOrder.push(topKey);
    }
    topGroups[topKey].push(activity);
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
  const leftMargin = 14;
  const lineHeight = 14;
  let startY = 30;

  topOrder.forEach((topKey, groupIdx) => {
    const [dateKey, shiftKey, cabangName] = topKey.split('|');
    const activities = topGroups[topKey] || [];

    // Page break per group
    if (groupIdx > 0) {
      doc.addPage();
      startY = 30;
    }

    // group by kegiatan + material (tanpa lokasi tujuan)
    const jobGroups = {};
    const jobOrder = [];
    activities.forEach((activity) => {
      const kegiatan = activity.kegiatan?.nama || '-';
      const material = activity.material?.nama || activity.kegiatan?.material?.nama || '-';
      const key = `${kegiatan}|${material}`;
      if (!jobGroups[key]) {
        jobGroups[key] = [];
        jobOrder.push(key);
      }
      jobGroups[key].push(activity);
    });

    const body = [];
    jobOrder.forEach((key) => {
      const [kegiatan, material] = key.split('|');
      const jobText = `${kegiatan}\n${material}`;
      jobGroups[key].forEach((activity, idx) => {
        body.push([
          idx === 0 ? jobText : '',
          idx + 1,
          activity.equipment?.kode || `EQ-${activity.equipment_id}` || '-',
          activity.karyawan?.nama || '-',
          activity.lokasi?.nama || '-', // Area kerja / lokasi awal
          activity.status || '-',
          activity.keterangan || '-',
        ]);
      });
    });

    const formattedDate = moment(dateKey).isValid() ? moment(dateKey).format('DD MMM YYYY') : dateKey;

    // Header
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('MONITORING PEKERJAAN ALAT BERAT', leftMargin, startY);

    const metaStart = startY + lineHeight * 1.0;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Cabang: ${cabangName}`, leftMargin, metaStart);
    doc.text(`Tanggal: ${formattedDate}`, leftMargin, metaStart + lineHeight * 0.9);
    doc.text(`Shift: ${shiftKey}`, leftMargin, metaStart + lineHeight * 1.8);

    const tableStartY = metaStart + lineHeight * 2.2;

    autoTable(doc, {
      head: [['JOB', 'NO', 'ID ALAT', 'OPERATOR', 'AREA KERJA', 'STATUS', 'KET']],
      body,
      startY: tableStartY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4.5,
        valign: 'middle',
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [230, 236, 245],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      columnStyles: {
        0: { cellWidth: 160 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 70, halign: 'center' },
        3: { cellWidth: 140 },
        4: { cellWidth: 140 },
        5: { cellWidth: 80, halign: 'center' },
        6: { cellWidth: 200 },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 5) {
          const val = (dataCell.cell.raw || '').toString().toUpperCase();
          const color = statusTextColors[val];
          if (color) dataCell.cell.styles.textColor = color;
          dataCell.cell.styles.halign = 'center';
        }
        if (dataCell.section === 'body' && dataCell.column.index === 0) {
          dataCell.cell.styles.valign = 'top';
        }
      },
      margin: { left: leftMargin, right: 10 },
    });

    // Summary per status
    const counts = {};
    activities.forEach((a) => {
      const key = (a.status || '-').toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    const lastY = doc.lastAutoTable?.finalY || tableStartY;
    const summaryTitleY = lastY + 10;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Rekap Monitoring:', leftMargin, summaryTitleY);

    const summaryRows = Object.keys(counts).map((statusKey) => [statusKey, `${counts[statusKey]} Unit`]);

    autoTable(doc, {
      head: [['STATUS', 'JUMLAH']],
      body: summaryRows,
      startY: summaryTitleY + 6,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [230, 236, 245],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { cellWidth: 120, halign: 'center' },
      },
      margin: { left: leftMargin, right: 10 },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 0) {
          const val = (dataCell.cell.raw || '').toString().toUpperCase();
          const color = statusTextColors[val];
          if (color) dataCell.cell.styles.textColor = color;
        }
      },
    });

    startY = (doc.lastAutoTable?.finalY || summaryTitleY) + 8;
    if (startY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      startY = 30;
    }
  });

  const timestamp = moment().format('YYYYMMDD_HHmmss');
  const finalFilename = filename || `Daily_Equipment_Activity_HE_${timestamp}.pdf`;
  doc.save(finalFilename);
};
