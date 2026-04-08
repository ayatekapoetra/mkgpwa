"use client";

import React, { useMemo, useState } from 'react';
import moment from 'moment';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Refresh, RestartAlt, PictureAsPdf, GridOn } from '@mui/icons-material';
import OptionOperatorDriver from 'components/OptionOperatorDriver';
import postTimesheetReconcil from 'api/timesheet-reconcil';
import Link from 'next/link';
import { utils as xlsxUtils, writeFile as writeXlsxFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useUser from 'hooks/useUser';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: num % 1 === 0 ? 0 : 2 });
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatDate = (value) => (value ? moment(value).format('DD-MM-YYYY') : '-');
const formatTime = (value) => (value ? moment(value).format('HH:mm') : '-');

const defaultRange = () => {
  const end = moment();
  const start = moment().subtract(6, 'days');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

const TimesheetReconcil = () => {
  const user = useUser();
  const isOprDrv = ['operator', 'driver'].includes(user.role)
  const [filters, setFilters] = useState(() => ({ ...defaultRange(), karyawan_id: isOprDrv ? user.employee_id:'' , karyawan: null }));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [expanded, setExpanded] = useState({});

  const handleField = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = async () => {
    setError('');
    setApplied(false);
    setRows([]);

    if (!filters.startDate || !filters.endDate) {
      setError('Silakan isi tanggal mulai dan tanggal akhir.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        karyawan_id: filters.karyawan_id || undefined,
      };

      const data = await postTimesheetReconcil(payload);

      if (data?.diagnostic?.error) {
        setError(data.diagnostic.error);
        setRows([]);
        setApplied(false);
      } else {
        setRows(data?.rows || []);
        setApplied(true);
      }
    } catch (err) {
      const message = err?.message || 'Gagal memuat data';
      setError(message);
      setApplied(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ ...defaultRange(), karyawan_id: '', karyawan: null });
    setRows([]);
    setError('');
    setApplied(false);
  };

  const totals = useMemo(() => {
    const count = rows?.length || 0;
    const grand = rows?.reduce((sum, r) => sum + Number(r?.grandtotal_earning || 0), 0) || 0;
    return { count, grand };
  }, [rows]);

  const agg = useMemo(() => {
    return rows.reduce((acc, r) => {
      const workFromItems = (r?.items || []).reduce((sum, item) => sum + Number(item?.workhours || 0), 0);

      return {
        usedsmu: acc.usedsmu + Number(r?.usedsmu || 0),
        rest: acc.rest + Number(r?.totresttime || 0),
        work: acc.work + workFromItems,
        overtime: acc.overtime + Number(r?.totovertime || 0),
        trip: acc.trip + Number(r?.totritasetrip || 0),
        overtimeEarn: acc.overtimeEarn + Number(r?.totovertime_earning || 0),
        bonusTrip: acc.bonusTrip + Number(r?.totbonustrip || 0),
      };
    }, { usedsmu: 0, rest: 0, work: 0, overtime: 0, trip: 0, overtimeEarn: 0, bonusTrip: 0 });
  }, [rows]);

  const handleExportExcel = () => {
    if (!rows.length) return;
    const shiftLabel = (id) => (id === 1 ? 'pagi' : id === 2 ? 'siang' : id === 3 ? 'malam' : '');

    let totalHM = 0
    const data = rows.flatMap((r) => {
      const items = r.items && r.items.length ? r.items : [{}];
      totalHM += items?.reduce((a, b) => a + Number(b.workhours || 0), 0);
      return items.map((it) => ({
        Tanggal: formatDate(r.date_ops),
        Shift: shiftLabel(it.shift_id),
        Rent: it.nmpenyewa || '',
        Unit: it.kdequipment || '',
        Nama: r.nmkaryawan,
        Start: it.starttime ? moment(it.starttime).format('YYYY-MM-DD HH:mm') : '',
        Finish: it.endtime ? moment(it.endtime).format('YYYY-MM-DD HH:mm') : '',
        'Durasi Kerja': it.opsduration || '',
        Break: it.resthours || '',
        Total: it.workhours || '',
        Overtime: it.overtime || '',
        Material: it.nmmaterial || '',
        Kegiatan: it.nmkegiatan || '',
        'Lokasi Awal': it.startlokasi || '',
        'Lokasi Akhir': it.endlokasi || '',
        Ritase: it.ritasetrip || '',
        Bonus: it.bonusritase || '',
        'Tot.Ritase': it.ritasetrip + it.bonusritase || '',
        Group: it.mainact || '',
        Longshift: it.longshift || '',
        Nmbisnis: it.kdcorp || '',
        Nmsite: it.nmsite || '',
        'Pesan Error': r.errmsg || '',
      }));
    });

    
    const infoRows = [
      ['Nama Karyawan', filters.karyawan?.nama || 'Semua'],
      ['Jam Kerja', parseFloat(agg.work)],
      ['Bonus Lembur (jam)', parseFloat(agg.overtime)],
      ['Total Jam', parseFloat(totalHM)],
      ['Ritase', formatNumber(agg.trip - agg.bonusTrip, 0)],
      ['Bonus Ritase', formatNumber(agg.bonusTrip, 0)],
      ['Total Ritase + Bonus Ritase', formatNumber(agg.trip, 0)],
      [],
    ];

    const header = Object.keys(data[0] || {});
    const dataRows = data.map((row) => header.map((h) => row[h]));
    const sheet = xlsxUtils.aoa_to_sheet([...infoRows, header, ...dataRows]);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, sheet, 'Reconcil');
    writeXlsxFile(wb, `timesheet-reconcil-${filters.startDate}-${filters.endDate}.xlsx`);
  };

  const handleExportPdf = () => {
    if (!rows.length) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(12);
    doc.text(`Timesheet Reconcil ${filters.startDate} s/d ${filters.endDate}`, 20, 24);

    let cursorY = 40;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 40;

    rows.forEach((r, idx) => {
      const items = r.items || [];

      // Summary table per row
      autoTable(doc, {
        head: [[
          'Tanggal', 'Karyawan', 'Jam', 'Smu Start', 'Smu Finish', 'Smu Used', 'Rest', 'Work', 'OT', 'Trip', 'Status',
        ]],
        body: [[
          formatDate(r.date_ops),
          r.nmkaryawan,
          `${formatTime(r.starttime)} - ${formatTime(r.endtime)}`,
          r.smustart,
          r.smufinish,
          r.usedsmu,
          formatNumber(r.totresttime, 2),
          formatNumber(r.totworktime, 2),
          formatNumber(r.totovertime, 2),
          r.totritasetrip,
          r.iserr || '',
        ]],
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        theme: 'striped',
        startY: cursorY,
        margin: { left: 20, right: 20 },
      });

      cursorY = doc.lastAutoTable.finalY + 10;

      // Check space before items table
      if (cursorY > pageHeight - bottomMargin) {
        doc.addPage();
        cursorY = 40;
      }

      autoTable(doc, {
        head: [['#', 'Equipment', 'Kategori', 'Kegiatan', 'Material', 'Start', 'Finish', 'Lokasi Start', 'Lokasi Finish', 'Work', 'Rest', 'OT', 'Trip']],
        body: items.map((it, i) => [
          i + 1,
          it.kdequipment || '-',
          it.kategori || '-',
          it.nmkegiatan || '-',
          it.nmmaterial || '-',
          `${formatDate(it.starttime)} ${formatTime(it.starttime)}`,
          `${formatDate(it.endtime)} ${formatTime(it.endtime)}`,
          it.startlokasi || '-',
          it.endlokasi || '-',
          it.workhours || '-',
          it.resthours || '-',
          it.overtime || '-',
          it.totritasetrip || 0,
        ]),
        startY: cursorY,
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [226, 239, 255], textColor: 20 },
        margin: { left: 20, right: 20 },
      });

      cursorY = doc.lastAutoTable.finalY + 16;

      // add spacing between groups, add page if running out of space
      if (cursorY > pageHeight - bottomMargin && idx < rows.length - 1) {
        doc.addPage();
        cursorY = 40;
      }
    });

    // Footer summary totals
    const footerData = [[
      'TOTAL',
      '',
      '',
      '',
      '',
      formatNumber(agg.usedsmu, 2),
      formatNumber(agg.rest, 2),
      formatNumber(agg.work, 2),
      formatNumber(agg.overtime, 2),
      formatNumber(agg.trip - agg.bonusTrip, 0),
      formatNumber(agg.bonusTrip, 0),
      formatNumber(agg.trip, 0),
    ]];

    if (cursorY > pageHeight - bottomMargin) {
      doc.addPage();
      cursorY = 40;
    }

    autoTable(doc, {
      head: [[
        'Total', '', '', '', '', 'Smu Used', 'Rest', 'Work', 'OT', 'Trip', 'Bonus', 'Trip+Bonus',
      ]],
      body: footerData,
      styles: { fontSize: 9, cellPadding: 4, fontStyle: 'bold' },
      headStyles: { fillColor: [4, 180, 19], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      startY: cursorY,
      margin: { left: 20, right: 20 },
    });

    doc.save(`timesheet-reconcil-${filters.startDate}-${filters.endDate}.pdf`);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRow = (row) => {
    const isOpen = expanded[row.id];
    const countRitase = row?.items?.reduce((total, item) => total + item.ritasetrip, 0);
    return (
      <>
        <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell padding="checkbox">
            <IconButton size="small" onClick={() => toggleExpand(row.id)}>
              {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>{formatDate(row.date_ops)}</TableCell>
          <TableCell>
            <Stack spacing={0.5}>
              <Typography fontWeight={700}>{row.nmkaryawan}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            {`${formatTime(row.starttime)} - ${formatTime(row.endtime)}`}
          </TableCell>
          <TableCell>{row.smustart}</TableCell>
          <TableCell>{row.smufinish}</TableCell>
          <TableCell>{row.usedsmu}</TableCell>
          <TableCell>{formatNumber(row.totresttime, 2)} jam</TableCell>
          <TableCell>
            <Stack spacing={0.3}>
              <Typography variant="subtitle1">{formatNumber(row.totworktime, 2)} Jam</Typography>
            </Stack>
          </TableCell>
          <TableCell>{formatNumber(row.totovertime, 2)} Jam</TableCell>
          <TableCell align="center">{(Number(row.totritasetrip || 0)) - (Number(row.totbonustrip || 0))}</TableCell>
          <TableCell align="center">{row.totbonustrip || 0}</TableCell>
          <TableCell align="center">{(Number(row.totritasetrip || 0))}</TableCell>
          <TableCell>
            <Stack spacing={0.5}>
              {row.iserr && (
                <Chip
                  size="small"
                  label={row.iserr}
                  color={row.iserr === 'A' ? 'success' : 'error'}
                  variant="outlined"
                />
              )}
            </Stack>
          </TableCell>
          <TableCell align="right">
            <Button component={Link} href={`/timesheet-reconcil/${row.id}`} size="small" variant="outlined">
              Show
            </Button>
          </TableCell>
        </TableRow>

        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={15}>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detail Items ({row.items?.length || 0})
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 1100 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Equipment</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Kategori</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>Material & Kegiatan</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Waktu Start</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Waktu Finish</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Lokasi Start</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Lokasi Finish</TableCell>
                        <TableCell align="right">WorkHour</TableCell>
                        <TableCell align="right">Rest</TableCell>
                        <TableCell align="right">OT</TableCell>
                        <TableCell align="right">TripRit</TableCell>
                        <TableCell align="right">BonusRit</TableCell>
                        <TableCell align="right">Tot.Ritase</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(row.items || []).map((item, idx) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Stack spacing={0.3}>
                              <Typography fontWeight={700}>{item.kdequipment || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">#{item.tsitem_id || ''}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{item.kategori || '-'}</TableCell>
                          <TableCell>
                            <Stack spacing={0.3}>
                              <Typography variant="body2">{item.nmkegiatan || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.nmmaterial || '-'}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{`${formatDate(item.starttime)} ${formatTime(item.starttime)}`}</TableCell>
                          <TableCell>{`${formatDate(item.endtime)} ${formatTime(item.endtime)}`}</TableCell>
                          <TableCell>{item.startlokasi || '-'}</TableCell>
                          <TableCell>{item.endlokasi || '-'}</TableCell>
                          <TableCell align="right">{formatNumber(item.workhours, 2)}</TableCell>
                          <TableCell align="right">{formatNumber(item.resthours, 2)}</TableCell>
                          <TableCell align="right">{formatNumber(item.overtime, 2)}</TableCell>
                          <TableCell align="right">{item.ritasetrip || 0}</TableCell>
                          <TableCell align="right">{item.bonusritase || 0}</TableCell>
                          <TableCell align="right">{item.totritasetrip || 0}</TableCell>
                        </TableRow>
                      ))}
                      {row.items?.length ? (
                        <TableRow>
                          <TableCell colSpan={8} align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totworktime, 2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totresttime, 2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{formatNumber(row.totovertime, 2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{countRitase}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{row.totbonustrip}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{parseInt(row.totbonustrip) + parseInt(countRitase)}</TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {`Home > Timesheet-Reconcil`}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
        <TextField
          label="Tanggal Mulai"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) => handleField('startDate', e.target.value)}
        />
        <TextField
          label="Tanggal Akhir"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={(e) => handleField('endDate', e.target.value)}
        />
        <Box sx={{ flex: 1, minWidth: 360 }}>
          <OptionOperatorDriver
            value={filters.karyawan_id}
            setFieldValue={(name, value) => handleField(name, value)}
            name="karyawan_id"
            objValue="karyawan"
            label="Pilih Karyawan"
          />
        </Box>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
        <Stack direction={{ xs: 'row', md: 'row' }} spacing={1}>
          <Button variant="contained" startIcon={<Refresh />} onClick={handleApply} disabled={loading}>
            Terapkan
          </Button>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} disabled={loading}>
            Reset
          </Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress />}

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {applied && !loading && rows?.length === 0 && !error && (
        <Alert severity="info">Tidak ada data untuk filter yang dipilih.</Alert>
      )}

      {applied && rows?.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
            <Stack spacing={0.2}>
              <Typography variant="h6">Rekonsiliasi Timesheet</Typography>
              <Typography variant="body2" color="text.secondary">
                Periode {formatDate(filters.startDate)} s/d {formatDate(filters.endDate)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Baris: ${totals.count} rows`} color="primary" variant="outlined" />
              <Button size="small" variant="outlined" startIcon={<GridOn />} onClick={handleExportExcel} disabled={!rows.length}>
                Excel
              </Button>
              <Button size="small" variant="contained" color="error" startIcon={<PictureAsPdf />} onClick={handleExportPdf} disabled={!rows.length}>
                PDF
              </Button>
            </Stack>
          </Stack>

          <TableContainer component={Box} sx={{ overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1650 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ minWidth: 120 }}>Tanggal</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Karyawan</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Jam</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Smu Start</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Smu Finish</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Smu Used</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Rest</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>WorkHours</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Overtime</TableCell>
                  <TableCell sx={{ minWidth: 90 }} align="center">Trip</TableCell>
                  <TableCell sx={{ minWidth: 90 }} align="center">Bonus</TableCell>
                  <TableCell sx={{ minWidth: 140 }} align="center">Total Trip+Bonus</TableCell>
                  <TableCell sx={{ width: 70 }}>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    {renderRow(row)}
                  </React.Fragment>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell />
                  <TableCell>Totals</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell sx={{ fontWeight: 700 }}>{formatNumber(agg.usedsmu, 2)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatNumber(agg.rest, 2)} jam</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatNumber(agg.work, 2)} jam</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatNumber(agg.overtime, 2)} jam</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{formatNumber(agg.trip - agg.bonusTrip, 0)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{formatNumber(agg.bonusTrip, 0)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{formatNumber(agg.trip, 0)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  );
};

export default TimesheetReconcil;
