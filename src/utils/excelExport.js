import * as XLSX from 'xlsx';
import moment from 'moment';

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getSmuValues = (timesheet, item) => {
  const smuStart = toNumber(item?.smustart ?? timesheet?.smustart);
  const smuFinish = toNumber(item?.smufinish ?? timesheet?.smufinish ?? smuStart);
  const used = toNumber(item?.usedsmu ?? timesheet?.usedhmkm ?? (smuFinish - smuStart));
  return { smuStart, smuFinish, used };
};

const calculateActivityDuration = (starttime, endtime) => {
  if (!starttime || !endtime) return '0.00';

  const startMoment = moment(starttime);
  const endMoment = moment(endtime);

  if (!startMoment.isValid() || !endMoment.isValid()) return '0.00';

  const durationMinutes = endMoment.diff(startMoment, 'minutes');
  const durationHours = (durationMinutes / 60).toFixed(2);

  return durationHours;
};

export const generateHeavyEquipmentTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  const rows = [];

  const headers = [
    'Tanggal',
    'Kategori',
    'Nama penyewa',
    'Tools',
    'Kode equipment',
    'Shift kerja',
    'KTP',
    'Nama operator/driver',
    'HM start',
    'HM finish',
    'HM total',
    'Lokasi kerja',
    'Block sequences',
    'Jam start',
    'Jam finish',
    'Istirahat',
    'Total jam',
    'Keterangan',
    'Kegiatan kerja',
    'Nama material',
    'Nama pengawas',
    'Kode timesheet',
    'Created At'
  ];

  rows.push(headers);

  data.forEach(timesheet => {
    const items = timesheet.items || [];

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
      const namaPenyewa = timesheet.penyewa?.nama || '-';
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        timesheet.mainact || '-',
        namaPenyewa,
        '-',
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || '-',
        timesheet.karyawan?.nama || '-',
        smuStart,
        smuFinish,
        used,
        '-',
        '-',
        '-',
        '-',
        1,
        '-',
        timesheet.keterangan || '-',
        timesheet.material?.nama || '-',
        timesheet.approvedByKaryawan?.nama || '-',
        timesheet.id || '-',
        timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        const tools = getToolsName(timesheet?.equipment?.tipe, item.kegiatan_id);
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
        const namaPenyewa = timesheet.penyewa?.nama || '-';
        const activityDuration = calculateActivityDuration(item.starttime, item.endtime);
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          timesheet.mainact || '-',
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || '-',
          timesheet.karyawan?.nama || '-',
          smuStart,
          smuFinish,
          used,
          item.lokasi?.nama || '-',
          item.seq || '-',
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          1,
          activityDuration,
          timesheet.keterangan || '-',
          item.kegiatan?.nama || '-',
          item.material?.nama || '-',
          timesheet.approvedByKaryawan?.nama || '-',
          timesheet.id || '-',
          timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 12 },   // Tanggal
    { wch: 12 },   // Kategori
    { wch: 20 },   // Nama penyewa
    { wch: 10 },   // Tools
    { wch: 15 },   // Kode equipment
    { wch: 12 },   // Shift kerja
    { wch: 20 },   // KTP
    { wch: 25 },   // Nama operator/driver
    { wch: 10 },   // HM start
    { wch: 10 },   // HM finish
    { wch: 10 },   // HM total
    { wch: 20 },   // Lokasi kerja
    { wch: 15 },   // Block sequences
    { wch: 18 },   // Jam start
    { wch: 18 },   // Jam finish
    { wch: 10 },   // Istirahat
    { wch: 10 },   // Total jam
    { wch: 30 },   // Keterangan
    { wch: 20 },   // Kegiatan kerja
    { wch: 25 },   // Nama material
    { wch: 20 },   // Nama pengawas
    { wch: 15 },   // Kode timesheet
    { wch: 20 }    // Created At
  ];
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet HE');

  const timestamp = moment().format('YYYYMMDD_HHmmss');
  const finalFilename = filename || `Timesheet_HE_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

function getShiftName(shiftId) {
  if (shiftId === 1) return 'Pagi';
  if (shiftId === 2) return 'Malam';
  return '-';
}

function getToolsName(equipmentType, kegiatanId) {
  
  const isExcavator = (equipmentType || '').toLowerCase() === 'excavator';

  if (isExcavator) {
    if (kegiatanId === 15 || kegiatanId === 24) {
      return 'breaker';
    }
    return 'bucket';
  }

  return equipmentType || 'bucket';
}

export const generateDumptruckTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  const rows = [];

  const headers = [
    'Tanggal',
    'Nama penyewa',
    'Kode equipment',
    'Shift',
    'KTP',
    'Nama driver',
    'KM start',
    'KM finish',
    'KM used',
    'Waktu start',
    'Waktu finish',
    'Total jam',
    'Keterangan',
    'Lokasi awal',
    'Lokasi finish',
    'Sequence',
    'Ritase',
    'Kegiatan kerja',
    'Nama material',
    'Nama pengawas',
    'Kode timesheet',
    'Created At'
  ];

  rows.push(headers);

  data.forEach(timesheet => {
    const items = timesheet.items || [];

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
      const namaPenyewa = timesheet.penyewa?.nama || '-';
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        namaPenyewa,
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || '-',
        timesheet.karyawan?.nama || '-',
        smuStart,
        smuFinish,
        used,
        '-',
        '-',
        '-',
        timesheet.keterangan || '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        timesheet.material?.nama || '-',
        timesheet.approvedByKaryawan?.nama || '-',
        timesheet.id || '-',
        timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
        const namaPenyewa = timesheet.penyewa?.nama || '-';
        const activityDuration = calculateActivityDuration(item.starttime, item.endtime);
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          namaPenyewa,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || '-',
          timesheet.karyawan?.nama || '-',
          smuStart,
          smuFinish,
          used,
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          activityDuration,
          timesheet.keterangan || '-',
          item.lokasi?.nama || '-',
          item.lokasiTujuan?.nama || '-',
          item.seq || '-',
          item.ritase || 0,
          item.kegiatan?.nama || '-',
          item.material?.nama || '-',
          timesheet.approvedByKaryawan?.nama || '-',
          timesheet.id || '-',
          timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 12 },   // Tanggal
    { wch: 20 },   // Nama penyewa
    { wch: 15 },   // Kode equipment
    { wch: 10 },   // Shift
    { wch: 20 },   // KTP
    { wch: 25 },   // Nama driver
    { wch: 10 },   // KM start
    { wch: 10 },   // KM finish
    { wch: 10 },   // KM used
    { wch: 18 },   // Waktu start
    { wch: 18 },   // Waktu finish
    { wch: 10 },   // Total jam
    { wch: 30 },   // Keterangan
    { wch: 20 },   // Lokasi awal
    { wch: 20 },   // Lokasi finish
    { wch: 10 },   // Sequence
    { wch: 10 },   // Ritase
    { wch: 20 },   // Kegiatan kerja
    { wch: 15 },   // Nama material
    { wch: 20 },   // Nama pengawas
    { wch: 15 },   // Kode timesheet
    { wch: 20 }    // Created At
  ];
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet DT');

  const timestamp = moment().format('YYYYMMDD_HHmmss');
  const finalFilename = filename || `Timesheet_DT_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};

export const generateAllTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  const rows = [];

  const headers = [
    'Kategori Equipment',
    'Tanggal',
    'Kategori Aktivitas',
    'Nama penyewa',
    'Tools',
    'Kode equipment',
    'Shift kerja',
    'KTP',
    'Nama operator/driver',
    'HM/KM start',
    'HM/KM finish',
    'HM/KM total',
    'Lokasi kerja',
    'Lokasi tujuan',
    'Block sequences',
    'Ritase',
    'Jam start',
    'Jam finish',
    'Istirahat',
    'Total jam',
    'Keterangan',
    'Kegiatan kerja',
    'Nama material',
    'Nama pengawas',
    'Kode timesheet',
    'Created At'
  ];

  rows.push(headers);

  data.forEach(timesheet => {
    const items = timesheet.items || [];
    const isHE = timesheet.equipment?.kategori === 'HE';

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
      const namaPenyewa = timesheet.penyewa?.nama || '-';
      const { smuStart, smuFinish, used } = getSmuValues(timesheet);

      const row = [
        timesheet.equipment?.kategori || '-',
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        timesheet.mainact || '-',
        namaPenyewa,
        '-',
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.ktp || '-',
        timesheet.karyawan?.nama || '-',
        smuStart,
        smuFinish,
        used,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        isHE ? 1 : '-',
        timesheet.keterangan || '-',
        timesheet.material?.nama || '-',
        '-',
        timesheet.approvedByKaryawan?.nama || '-',
        timesheet.id || '-',
        timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
      ];
      rows.push(row);
    } else {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = a.starttime ? new Date(a.starttime).getTime() : 0;
        const timeB = b.starttime ? new Date(b.starttime).getTime() : 0;
        return timeA - timeB;
      });

      sortedItems.forEach((item, index) => {
        
        const tools = getToolsName(timesheet?.equipment?.tipe, item.kegiatan_id);
        const lokasiTujuan = !isHE ? (item.lokasiTujuan?.nama || '-') : '-';
        const ritase = !isHE ? (item.ritase || 0) : '-';
        const istirahat = isHE ? 1 : '-';
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
        const namaPenyewa = timesheet.penyewa?.nama || '-';
        const activityDuration = calculateActivityDuration(item.starttime, item.endtime);
        const { smuStart, smuFinish, used } = getSmuValues(timesheet, item);

        const row = [
          timesheet.equipment?.kategori || '-',
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          timesheet.mainact || '-',
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.ktp || '-',
          timesheet.karyawan?.nama || '-',
          smuStart,
          smuFinish,
          used,
          item.lokasi?.nama || '-',
          lokasiTujuan,
          item.seq || '-',
          ritase,
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          istirahat,
          activityDuration,
          timesheet.keterangan || '-',
          item.kegiatan?.nama || '-',
          item.material?.nama || '-',
          timesheet.approvedByKaryawan?.nama || '-',
          timesheet.id || '-',
          timesheet.created_at ? moment(timesheet.created_at).format('DD-MM-YYYY HH:mm:ss') : '-'
        ];
        rows.push(row);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 15 },   // Kategori Equipment
    { wch: 12 },   // Tanggal
    { wch: 15 },   // Kategori Aktivitas
    { wch: 20 },   // Nama penyewa
    { wch: 10 },   // Tools
    { wch: 15 },   // Kode equipment
    { wch: 12 },   // Shift kerja
    { wch: 20 },   // KTP
    { wch: 25 },   // Nama operator/driver
    { wch: 12 },   // HM/KM start
    { wch: 12 },   // HM/KM finish
    { wch: 12 },   // HM/KM total
    { wch: 20 },   // Lokasi kerja
    { wch: 20 },   // Lokasi tujuan
    { wch: 15 },   // Block sequences
    { wch: 10 },   // Ritase
    { wch: 18 },   // Jam start
    { wch: 18 },   // Jam finish
    { wch: 10 },   // Istirahat
    { wch: 10 },   // Total jam
    { wch: 30 },   // Keterangan
    { wch: 25 },   // Kegiatan kerja
    { wch: 15 },   // Nama material
    { wch: 20 },   // Nama pengawas
    { wch: 15 },   // Kode timesheet
    { wch: 20 }    // Created At
  ];
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet All');

  const timestamp = moment().format('YYYYMMDD_HHmmss');
  const finalFilename = filename || `Timesheet_All_${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};
