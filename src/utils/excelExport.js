import * as XLSX from 'xlsx';
import moment from 'moment';

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

  console.log('Excel Export - Sample Data:', data[0]);
  console.log('Excel Export - kdunit:', data[0]?.kdunit);
  console.log('Excel Export - penyewa:', data[0]?.penyewa);
  console.log('Excel Export - equipment:', data[0]?.equipment);

  const rows = [];

  const headers = [
    'Tanggal',
    'Kategori',
    'Nama penyewa',
    'Tools',
    'Kode equipment',
    'Shift kerja',
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
      
      const row = [
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        timesheet.mainact || '-',
        namaPenyewa,
        '-',
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.nama || '-',
        timesheet.smustart || 0,
        timesheet.smufinish || 0,
        timesheet.usedhmkm || 0,
        '-',
        '-',
        '-',
        '-',
        1,
        '-',
        timesheet.material?.nama || '-' || '-',
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
        const tools = getToolsName(item.kegiatan_id);
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
        const namaPenyewa = timesheet.penyewa?.nama || '-';
        const activityDuration = calculateActivityDuration(item.starttime, item.endtime);

        const row = [
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          timesheet.mainact || '-',
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.nama || '-',
          timesheet.smustart || 0,
          timesheet.smufinish || 0,
          timesheet.usedhmkm || 0,
          item.lokasi?.nama || '-',
          item.seq || '-',
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          1,
          activityDuration,
          item.kegiatan?.nama || '-',
          timesheet.material?.nama || '-' || '-',
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
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 25 },  // Nama material
    { wch: 20 },  // Nama pengawas
    { wch: 12 },  // Kode timesheet
    { wch: 18 }   // Created At
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

function getToolsName(kegiatanId) {
  if (kegiatanId === 15 || kegiatanId === 24) {
    return 'breaker';
  }
  return 'bucket';
}

export const generateDumptruckTimesheetExcel = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export');
  }

  console.log('Dumptruck Excel Export - Sample Data:', data[0]);
  console.log('Dumptruck Excel Export - kdunit:', data[0]?.kdunit);
  console.log('Dumptruck Excel Export - penyewa:', data[0]?.penyewa);
  console.log('Dumptruck Excel Export - equipment:', data[0]?.equipment);

  const rows = [];

  const headers = [
    'Tanggal',
    'Nama penyewa',
    'Kode equipment',
    'Shift',
    'Nama driver',
    'KM start',
    'KM finish',
    'KM used',
    'Waktu start',
    'Waktu finish',
    'Total jam',
    'Lokasi awal',
    'Lokasi finish',
    'Sequence',
    'Ritase',
    'Kegiatan kerja',
    'Nama material',
    'Nama pengawas',
    'Created At'
  ];

  rows.push(headers);

  data.forEach(timesheet => {
    const items = timesheet.items || [];

    if (items.length === 0) {
      const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
      const namaPenyewa = timesheet.penyewa?.nama || '-';
      
      const row = [
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        namaPenyewa,
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.nama || '-',
        timesheet.smustart || 0,
        timesheet.smufinish || 0,
        timesheet.usedhmkm || 0,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        timesheet.material?.nama || '-' || '-',
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

        const row = [
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          namaPenyewa,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.nama || '-',
          timesheet.smustart || 0,
          timesheet.smufinish || 0,
          timesheet.usedhmkm || 0,
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          activityDuration,
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
    { wch: 12 },  // Tanggal
    { wch: 20 },  // Nama penyewa
    { wch: 15 },  // Kode equipment
    { wch: 10 },  // Shift
    { wch: 20 },  // Nama driver
    { wch: 10 },  // KM start
    { wch: 10 },  // KM finish
    { wch: 10 },  // KM used
    { wch: 12 },  // Waktu start
    { wch: 12 },  // Waktu finish
    { wch: 10 },  // Total jam
    { wch: 20 },  // Lokasi awal
    { wch: 20 },  // Lokasi finish
    { wch: 10 },  // Sequence
    { wch: 10 },  // Ritase
    { wch: 20 },  // Kegiatan kerja
    { wch: 15 },  // Nama material
    { wch: 20 },  // Nama pengawas
    { wch: 12 },  // Kode timesheet
    { wch: 18 }   // Created At
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

  console.log('All Excel Export - Sample Data:', data[0]);
  console.log('All Excel Export - kdunit:', data[0]?.kdunit);
  console.log('All Excel Export - penyewa:', data[0]?.penyewa);
  console.log('All Excel Export - equipment:', data[0]?.equipment);

  const rows = [];

  const headers = [
    'Kategori Equipment',
    'Tanggal',
    'Kategori Aktivitas',
    'Nama penyewa',
    'Tools',
    'Kode equipment',
    'Shift kerja',
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
      
      const row = [
        timesheet.equipment?.kategori || '-',
        timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
        timesheet.mainact || '-',
        namaPenyewa,
        '-',
        kdunit,
        getShiftName(timesheet.shift_id),
        timesheet.karyawan?.nama || '-',
        timesheet.smustart || 0,
        timesheet.smufinish || 0,
        timesheet.usedhmkm || 0,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        isHE ? 1 : '-',
        timesheet.material?.nama || '-' || '-',
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
        const tools = isHE ? getToolsName(item.kegiatan_id) : '-';
        const lokasiTujuan = !isHE ? (item.lokasiTujuan?.nama || '-') : '-';
        const ritase = !isHE ? (item.ritase || 0) : '-';
        const istirahat = isHE ? 1 : '-';
        const kdunit = timesheet.kdunit || timesheet.equipment?.kode || '-';
        const namaPenyewa = timesheet.penyewa?.nama || '-';
        const activityDuration = calculateActivityDuration(item.starttime, item.endtime);

        const row = [
          timesheet.equipment?.kategori || '-',
          timesheet.date_ops ? moment(timesheet.date_ops).format('DD-MM-YYYY') : '-',
          timesheet.mainact || '-',
          namaPenyewa,
          tools,
          kdunit,
          getShiftName(timesheet.shift_id),
          timesheet.karyawan?.nama || '-',
          timesheet.smustart || 0,
          timesheet.smufinish || 0,
          timesheet.usedhmkm || 0,
          item.lokasi?.nama || '-',
          lokasiTujuan,
          item.seq || '-',
          ritase,
          item.starttime ? moment(item.starttime).format('DD-MM-YY HH:mm') : '-',
          item.endtime ? moment(item.endtime).format('DD-MM-YY HH:mm') : '-',
          istirahat,
          activityDuration,
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
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 25 },  // Kegiatan kerja
    { wch: 15 },  // Nama material
    { wch: 20 },  // Nama pengawas
    { wch: 12 },  // Kode timesheet
    { wch: 18 }   // Created At
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
