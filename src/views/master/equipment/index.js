'use client';

// REACT
import { useState } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from 'components/@extended/IconButton';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import { GridOn, PictureAsPdf } from '@mui/icons-material';

// EXPORT
import { utils as xlsxUtils, writeFile as writeXlsxFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// COMPONENTS
import MainCard from 'components/MainCard';
import CardListEquipment from './listcard';
import ListTableEquipment from './listtable';

// HOOK
import { endpoints, useGetEquipment } from 'api/equipment';
import axiosServices from 'utils/axios';
import Paginate from 'components/Paginate';
import FilterEquipment from './filter';

const EXPORT_HEADERS = ['No', 'Kode', 'Kategori', 'Model', 'Tipe', 'Serial Number', 'Manufaktur', 'Tahun', 'Cabang'];

const mapEquipmentRows = (list = []) =>
  list.map((r, i) => ({
    No: i + 1,
    Kode: r.kode || '',
    Kategori: r.kategori || '',
    Model: r.model || '',
    Tipe: r.tipe || '',
    'Serial Number': r.identity || '',
    Manufaktur: r.manufaktur || '',
    Tahun: r.tahun || '',
    Cabang: r.cabang?.nama || r.cabang || ''
  }));

const countByField = (rows, field) => {
  const map = new Map();
  rows.forEach((r) => {
    const key = r[field] || '-';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => [name, count])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
};

const buildSummaryGroups = (rows) => {
  const map = new Map();
  rows.forEach((r) => {
    const model = r.Model || '-';
    const tipe = r.Tipe || '-';
    const manufaktur = r.Manufaktur || '-';
    const cabang = r.Cabang || '-';
    const key = `${model}||${tipe}||${manufaktur}||${cabang}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [model, tipe, manufaktur, cabang] = key.split('||');
      return [model, tipe, manufaktur, cabang, count];
    })
    .sort((a, b) => a.join('|').localeCompare(b.join('|')));
};

const parseEquipmentList = (payload) => {
  const rowsData = payload?.rows ?? payload;
  if (rowsData && Array.isArray(rowsData.data)) return rowsData.data;
  if (Array.isArray(rowsData)) return rowsData;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const fetchAllEquipment = async (filters = {}) => {
  const { page, perPages, ...rest } = filters;
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v != null)),
    page: '1',
    perPages: '100000'
  });
  const res = await axiosServices.get(`${endpoints.key}/list?${query}`);
  return parseEquipmentList(res.data);
};

const EquipmentScreen = () => {
  const [isCard, setIsCard] = useState(true);
  const [openFilter, setOpenFilter] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 30,
    kode: '',
    cabang_id: '',
    kategori: '',
    manufaktur: '',
    tipe: '',
    partner_id: ''
  });
  const { data, dataLoading, dataError, page, perPage, total, lastPage } = useGetEquipment(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const list = await fetchAllEquipment(params);
      if (!list.length) return;
      const rows = mapEquipmentRows(list);
      const ws = xlsxUtils.json_to_sheet(rows, { header: EXPORT_HEADERS });
      const wb = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(wb, ws, 'Equipment');
      writeXlsxFile(wb, 'equipment.xlsx');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const list = await fetchAllEquipment(params);
      if (!list.length) return;
      const rows = mapEquipmentRows(list);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const tableOpts = {
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        theme: 'striped',
        margin: { left: 40, right: 40 }
      };

      doc.setFontSize(14);
      doc.text('Daftar Equipment', 40, 32);
      autoTable(doc, {
        ...tableOpts,
        head: [EXPORT_HEADERS],
        body: rows.map((r) => EXPORT_HEADERS.map((h) => r[h])),
        startY: 48
      });

      doc.addPage();
      let cursorY = 40;
      doc.setFontSize(14);
      doc.text('Summary Equipment', 40, cursorY);
      cursorY += 16;
      doc.setFontSize(10);
      doc.text(`Total Unit: ${rows.length}`, 40, cursorY);
      cursorY += 20;

      const summaryBody = buildSummaryGroups(rows);
      autoTable(doc, {
        ...tableOpts,
        head: [['No', 'Model', 'Tipe', 'Manufaktur', 'Cabang', 'Jumlah']],
        body: summaryBody.map((row, i) => [i + 1, ...row]),
        startY: cursorY,
        foot: [['', '', '', '', 'Total', rows.length]],
        footStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: 'bold' }
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      const fieldSummaries = [
        { title: 'Summary per Model', field: 'Model' },
        { title: 'Summary per Tipe', field: 'Tipe' },
        { title: 'Summary per Manufaktur', field: 'Manufaktur' },
        { title: 'Summary per Cabang', field: 'Cabang' }
      ];

      fieldSummaries.forEach(({ title, field }) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (cursorY > pageHeight - 120) {
          doc.addPage();
          cursorY = 40;
        }
        doc.setFontSize(11);
        doc.text(title, 40, cursorY);
        cursorY += 8;
        const body = countByField(rows, field);
        autoTable(doc, {
          ...tableOpts,
          head: [['No', field, 'Jumlah']],
          body: body.map((row, i) => [i + 1, row[0], row[1]]),
          startY: cursorY,
          foot: [['', 'Total', rows.length]],
          footStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: 'bold' }
        });
        cursorY = doc.lastAutoTable.finalY + 24;
      });

      doc.save('equipment.pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/equipment/create`}>
          Add Equipment
        </Button>
      }
      secondary={
        <Stack direction="row" gap={1} alignItems="center">
          <Button size="small" variant="outlined" startIcon={<GridOn />} onClick={handleExportExcel} disabled={exporting || dataLoading}>
            Excel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPdf}
            disabled={exporting || dataLoading}
          >
            PDF
          </Button>
          <IconButton aria-label="settings" variant="dashed" color="secondary" onClick={() => setIsCard(!isCard)}>
            <AutoAwesomeMosaicIcon />
          </IconButton>
          <IconButton aria-label="settings" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      }
      content={false}
    >
      <Stack spacing={2}>
        <FilterEquipment data={params} setData={setParams} open={openFilter} count={total || data?.total} onClose={toggleFilterHandle} />

        {dataError ? (
          <Typography variant="body2" color="error">
            Error fetching data
          </Typography>
        ) : null}

        {dataLoading ? <Typography variant="body2">Loading...</Typography> : null}

        {!dataError && (
          <>
            {isCard ? <CardListEquipment data={data} /> : <ListTableEquipment data={data} />}

            <Stack sx={{ p: 2 }}>
              <Paginate
                page={page || params.page}
                total={total ?? data?.rows?.length ?? 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.perPages}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
      </Stack>
    </MainCard>
  );
};

export default EquipmentScreen;
