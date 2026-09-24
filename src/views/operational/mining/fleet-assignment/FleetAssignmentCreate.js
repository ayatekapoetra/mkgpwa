'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import LoadingButton from 'components/@extended/LoadingButton';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { getDailyActivityMasters } from 'api/daily-activity';
import { openNotification } from 'api/notification';
import {
  createFleetStandbyBatch,
  fleetErrorMessage,
  useFleetAssignmentAccess,
  useFleetAssignmentOptions,
  useFleetEligibleEquipment
} from 'api/fleet-assignment';
import { localDate, statusLabel } from './shared';

const INITIAL_HEADER = {
  date_ops: localDate(),
  shift_id: '1',
  area: '',
  cabang_id: '',
  lokasi_site_id: '',
  lokasi_pit_id: '',
  kontraktor_id: '',
  cuaca: '',
  category_id: 'mining',
  notes: ''
};

const WEATHER = ['Cerah', 'Mendung', 'Hujan'];
const CATEGORIES = [
  { id: 'mining', nama: 'MINING' },
  { id: 'rental', nama: 'RENTAL' },
  { id: 'explorasi', nama: 'EXPLORASI' }
];
const EMPTY_MASTERS = { branches: [], sites: [], pits: [], contractors: [], _failed: [] };
const INPUT_SX = { '& .MuiInputBase-root': { height: 40 } };
const REASON_LABELS = {
  MOBILIZATION_NOT_ARRIVED: 'Mobilisasi belum tiba di tujuan',
  ALREADY_ASSIGNED: 'Sudah memiliki status pada shift ini',
  NOT_AT_SELECTED_SITE: 'Tidak berada pada penyewa terpilih'
};

const optionLabel = (option) => option?.nama || option?.name || option?.kode || option?.abbr || '';
const selectedOption = (options, id) => options.find((option) => String(option.id) === String(id)) || null;

function MasterAutocomplete({ label, options, value, onChange, required = false, disabled = false, loading = false, getOptionLabel = optionLabel, renderOption }) {
  return (
    <Autocomplete
      options={options}
      value={selectedOption(options, value)}
      onChange={(_, option) => onChange(option)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, current) => String(option.id) === String(current.id)}
      disabled={disabled}
      loading={loading}
      renderOption={renderOption}
      renderInput={(params) => <TextField {...params} size="small" label={label} required={required} sx={INPUT_SX} />}
    />
  );
}

function Metric({ label, value, color, icon }) {
  return (
    <Box sx={{ minWidth: 92, px: 1.4, py: 0.9, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ color, display: 'grid', placeItems: 'center', '& svg': { fontSize: 17 } }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.67)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</Typography>
          <Typography sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.1 }}>{value}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function EquipmentOption({ equipment, selected, onToggle }) {
  const eligible = equipment.eligible;
  const isBreakdown = equipment.default_status === 'breakdown';
  const isHE = equipment.kategori === 'HE';
  const Icon = isHE ? ConstructionOutlinedIcon : LocalShippingOutlinedIcon;
  const code = equipment.abbr || equipment.kode || equipment.id;
  const reason = equipment.reason_codes?.map((item) => item === 'ALREADY_ASSIGNED'
    ? `Sudah berstatus ${statusLabel(equipment.conflict?.status)}`
    : REASON_LABELS[item] || item).join(' · ');

  return (
    <Card
      variant="outlined"
      role={eligible ? 'checkbox' : undefined}
      aria-checked={eligible ? selected : undefined}
      tabIndex={eligible ? 0 : -1}
      onClick={eligible ? onToggle : undefined}
      onKeyDown={(event) => {
        if (eligible && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onToggle();
        }
      }}
      sx={{
        position: 'relative',
        p: 1.4,
        cursor: eligible ? 'pointer' : 'not-allowed',
        borderWidth: 1,
        borderColor: isBreakdown ? 'error.main' : selected ? 'primary.main' : 'divider',
        bgcolor: selected ? (isBreakdown ? 'error.lighter' : 'primary.lighter') : eligible ? 'background.paper' : 'action.disabledBackground',
        opacity: eligible ? 1 : 0.68,
        boxShadow: selected ? (isBreakdown ? '0 7px 18px rgba(211,47,47,0.16)' : '0 7px 18px rgba(24,118,210,0.14)') : 'none',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        '&:hover': eligible ? { transform: 'translateY(-2px)', borderColor: isBreakdown ? 'error.dark' : 'primary.main', boxShadow: isBreakdown ? '0 8px 20px rgba(211,47,47,0.16)' : '0 8px 20px rgba(35,52,68,0.1)' } : {},
        '&:focus-visible': { outline: '3px solid', outlineColor: isBreakdown ? 'error.light' : 'primary.light', outlineOffset: 2 }
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="flex-start">
        <Box sx={{ width: 38, height: 38, borderRadius: 1.5, flexShrink: 0, display: 'grid', placeItems: 'center', color: isHE ? '#8155c7' : '#2677b8', bgcolor: isHE ? '#f2ecfc' : '#eaf5fd' }}>
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900} noWrap>{code}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">{equipment.model || equipment.nama || 'Model tidak tersedia'}</Typography>
            </Box>
            <Checkbox checked={selected} disabled={!eligible} size="small" sx={{ p: 0.25 }} inputProps={{ 'aria-label': `Pilih ${code}` }} />
          </Stack>
          <Stack direction="row" spacing={0.65} alignItems="center" sx={{ mt: 1 }}>
            <Chip size="small" label={equipment.kategori} color={isHE ? 'secondary' : 'primary'} variant="outlined" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800 }} />
            {eligible ? (
              <Typography variant="caption" color={equipment.default_status === 'breakdown' ? 'error.main' : 'success.main'} fontWeight={700}>
                {equipment.default_status === 'breakdown' ? 'Breakdown' : 'Ready Operation'}
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.dark" noWrap title={reason}>{reason}</Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

export default function FleetAssignmentCreate() {
  const router = useRouter();
  const access = useFleetAssignmentAccess();
  const [header, setHeader] = useState(INITIAL_HEADER);
  const [masters, setMasters] = useState(EMPTY_MASTERS);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    let active = true;
    getDailyActivityMasters()
      .then((result) => { if (active) setMasters(result); })
      .catch((error) => { if (active) setMastersError(error); })
      .finally(() => { if (active) setMastersLoading(false); });
    return () => { active = false; };
  }, []);

  const areaOptions = useMemo(
    () => [...new Set((masters.branches || []).map((item) => String(item.area || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((area) => ({ id: area, nama: area })),
    [masters.branches]
  );
  const placementParams = useMemo(() => ({
    area: header.area,
    lokasi_site_id: header.lokasi_site_id
  }), [header.area, header.lokasi_site_id]);
  const placementQuery = useFleetAssignmentOptions(
    placementParams,
    access.permissions.read && Boolean(header.area)
  );

  const availabilityParams = useMemo(() => ({
    date_ops: header.date_ops,
    shift_id: header.shift_id,
    area: header.area,
    lokasi_site_id: header.lokasi_site_id,
    lokasi_pit_id: header.lokasi_pit_id
  }), [header.area, header.date_ops, header.shift_id, header.lokasi_pit_id, header.lokasi_site_id]);
  const contextComplete = Boolean(header.date_ops && header.shift_id && header.area && header.lokasi_site_id);
  const equipmentQuery = useFleetEligibleEquipment(availabilityParams, access.permissions.read && contextComplete);
  const equipment = useMemo(() => {
    const positionedIds = new Set(placementQuery.options.equipments.map((item) => String(item.id)));
    return equipmentQuery.availability.data.filter((item) => item.eligible && positionedIds.has(String(item.id)));
  }, [equipmentQuery.availability.data, placementQuery.options.equipments]);

  const visibleEquipment = useMemo(() => equipment.filter((item) => {
    if (categoryFilter !== 'ALL' && item.kategori !== categoryFilter) return false;
    if (!deferredSearch) return true;
    return [item.kode, item.abbr, item.nama, item.model].some((value) => String(value || '').toLowerCase().includes(deferredSearch));
  }), [categoryFilter, deferredSearch, equipment]);
  const visibleEligible = visibleEquipment.filter((item) => item.eligible);
  const allVisibleSelected = visibleEligible.length > 0 && visibleEligible.every((item) => selectedIds.includes(String(item.id)));
  const selectedRows = selectedIds.map((id) => selectedEquipment[id] || equipment.find((item) => String(item.id) === id)).filter(Boolean);
  const unavailableSelected = selectedRows.filter((item) => !equipment.some((available) => String(available.id) === String(item.id)));
  const heCount = selectedRows.filter((item) => item.kategori === 'HE').length;
  const dtCount = selectedRows.filter((item) => item.kategori === 'DT').length;

  const updateHeader = (patch) => setHeader((current) => ({ ...current, ...patch }));
  const toggleEquipment = (equipmentItem) => {
    const id = String(equipmentItem.id);
    setSelectedEquipment((current) => ({ ...current, [id]: equipmentItem }));
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const toggleAllVisible = () => {
    const visibleIds = visibleEligible.map((item) => String(item.id));
    setSelectedEquipment((current) => ({ ...current, ...Object.fromEntries(visibleEligible.map((item) => [String(item.id), item])) }));
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };

  const handleSave = async () => {
    const required = ['date_ops', 'shift_id', 'area', 'lokasi_site_id', 'lokasi_pit_id', 'kontraktor_id', 'cuaca', 'category_id'];
    if (required.some((field) => !header[field])) {
      openNotification({ message: 'Lengkapi seluruh informasi operasional terlebih dahulu.', type: 'warning' });
      return;
    }
    if (!selectedIds.length) {
      openNotification({ message: 'Pilih minimal satu equipment.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await createFleetStandbyBatch({ ...header, equipment_ids: selectedIds });
      openNotification({ message: `${selectedIds.length} equipment berhasil ditambahkan ke Fleet Assignment.`, type: 'success' });
      router.push(`/fleet-assignment?date_ops=${header.date_ops}&shift_id=${header.shift_id}&lokasi_site_id=${header.lokasi_site_id}`);
      router.refresh();
    } catch (error) {
      openNotification({ message: fleetErrorMessage(error, 'Gagal membuat Fleet Assignment.'), type: 'error' });
      await equipmentQuery.mutate();
    } finally {
      setSaving(false);
    }
  };

  if (access.accessLoading) return <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (access.accessError || !access.permissions.insert) return <Alert severity="warning">Anda tidak memiliki akses untuk membuat Fleet Assignment.</Alert>;

  return (
    <Box>
      <Breadcrumbs custom heading="Buat Fleet Assignment" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Fleet Assignment', to: '/fleet-assignment' }, { title: 'Add Data' }]} />

      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2.5, p: { xs: 2, md: 3 }, mb: 2, color: '#fff', background: 'linear-gradient(125deg, #182b3b 0%, #234f68 56%, #2c7582 100%)', boxShadow: '0 14px 34px rgba(24,52,70,0.2)' }}>
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', right: -80, top: -145, bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ position: 'relative' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center"><AddTaskOutlinedIcon /><Typography variant="h3" color="inherit">Standby Initialization</Typography></Stack>
            <Typography sx={{ mt: 0.7, color: 'rgba(255,255,255,0.72)', maxWidth: 650 }}>Pilih armada di lokasi penyewa. Unit baru disiapkan sebagai Standby, sementara unit dengan Daily Breakdown aktif tetap dilanjutkan sebagai Breakdown.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Metric label="Dipilih" value={selectedIds.length} color="#81d4fa" icon={<CheckCircleOutlineIcon />} />
            <Metric label="HE" value={heCount} color="#d1b3ff" icon={<ConstructionOutlinedIcon />} />
            <Metric label="DT" value={dtCount} color="#90caf9" icon={<LocalShippingOutlinedIcon />} />
          </Stack>
        </Stack>
      </Box>

      {(mastersError || masters._failed?.length > 0) && <Alert severity="warning" sx={{ mb: 2 }}>Sebagian master data gagal dimuat. Muat ulang halaman jika pilihan yang dibutuhkan tidak tersedia.</Alert>}
      {placementQuery.error && <Alert severity="error" sx={{ mb: 2 }}>{fleetErrorMessage(placementQuery.error, 'Gagal memuat site dan lokasi berdasarkan area.')}</Alert>}

      <MainCard title="Informasi Operasional" subheader="Konteks ini digunakan untuk mencari posisi terakhir equipment dan membentuk header Daily Activity.">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}><TextField fullWidth required size="small" type="date" label="Tanggal Operasional" value={header.date_ops} onChange={(event) => updateHeader({ date_ops: event.target.value })} InputLabelProps={{ shrink: true }} sx={INPUT_SX} /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FormControl fullWidth required size="small" sx={INPUT_SX}><InputLabel>Shift</InputLabel><Select label="Shift" value={header.shift_id} onChange={(event) => updateHeader({ shift_id: String(event.target.value) })}><MenuItem value="1">Siang</MenuItem><MenuItem value="2">Malam</MenuItem></Select></FormControl></Grid>
          <Grid item xs={12} sm={6} lg={6}><MasterAutocomplete required label="Area Cabang" options={areaOptions} value={header.area} disabled={mastersLoading} onChange={(option) => updateHeader({ area: String(option?.id || ''), cabang_id: '', lokasi_site_id: '', lokasi_pit_id: '' })} /></Grid>
          <Grid item xs={12} sm={6} lg={6}><MasterAutocomplete required label="Site Penyewa" options={placementQuery.options.sites} value={header.lokasi_site_id} disabled={!header.area || placementQuery.isLoading} loading={placementQuery.isLoading} onChange={(option) => updateHeader({ lokasi_site_id: String(option?.id || '') })} /></Grid>
          <Grid item xs={12} sm={6} lg={6}><MasterAutocomplete required label="Lokasi Pit" options={placementQuery.options.pits} value={header.lokasi_pit_id} disabled={!header.area || placementQuery.isLoading} loading={placementQuery.isLoading} onChange={(option) => updateHeader({ lokasi_pit_id: String(option?.id || ''), cabang_id: String(option?.cabang_id || '') })} /></Grid>
          <Grid item xs={12} sm={6} lg={4}><MasterAutocomplete required label="Kontraktor" options={masters.contractors || []} value={header.kontraktor_id} disabled={mastersLoading} onChange={(option) => updateHeader({ kontraktor_id: String(option?.id || '') })} /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FormControl fullWidth required size="small" sx={INPUT_SX}><InputLabel>Cuaca</InputLabel><Select label="Cuaca" value={header.cuaca} onChange={(event) => updateHeader({ cuaca: event.target.value })}>{WEATHER.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12} sm={6} lg={4}><MasterAutocomplete required label="Kategori Kegiatan" options={CATEGORIES} value={header.category_id} onChange={(option) => updateHeader({ category_id: option?.id || '' })} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Catatan Umum" value={header.notes} onChange={(event) => updateHeader({ notes: event.target.value })} /></Grid>
        </Grid>
      </MainCard>

      <MainCard
        sx={{ mt: 2 }}
        title="Pilih Equipment"
        subheader={contextComplete ? `${equipment.length} unit tersedia` : 'Lengkapi tanggal, shift, area, dan site penyewa untuk memuat equipment.'}
        secondary={contextComplete && <Chip icon={<LocationOnOutlinedIcon />} label={equipmentQuery.availability.site?.nama || 'Memuat lokasi...'} color="primary" variant="outlined" />}
      >
        {!contextComplete ? (
          <Box sx={{ py: 7, textAlign: 'center' }}><LocationOnOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} /><Typography color="text.secondary" sx={{ mt: 1 }}>Equipment akan muncul setelah tanggal, shift, area, dan site penyewa dipilih.</Typography></Box>
        ) : equipmentQuery.error ? (
          <Alert severity="error">{fleetErrorMessage(equipmentQuery.error, 'Gagal memuat equipment pada penyewa terpilih.')}</Alert>
        ) : (
          <>
            {unavailableSelected.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Unit berikut tetap dipilih, tetapi tidak tersedia pada Area dan Site saat ini:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {unavailableSelected.map((item) => (
                    <Chip key={item.id} label={item.abbr || item.kode || item.id} onDelete={() => toggleEquipment(item)} size="small" />
                  ))}
                </Stack>
              </Alert>
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Cari kode, model, atau nama equipment..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ width: { xs: '100%', md: 360 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {['ALL', 'HE', 'DT'].map((category) => <Chip key={category} label={category === 'ALL' ? 'Semua Unit' : category} color={categoryFilter === category ? 'primary' : 'default'} variant={categoryFilter === category ? 'filled' : 'outlined'} onClick={() => setCategoryFilter(category)} />)}
                <Button size="small" variant="outlined" startIcon={<SelectAllIcon />} onClick={toggleAllVisible} disabled={!visibleEligible.length}>{allVisibleSelected ? 'Batalkan Semua' : 'Pilih Semua'}</Button>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {equipmentQuery.isLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.25 }}>{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} variant="rounded" height={108} />)}</Box>
            ) : !visibleEquipment.length ? (
              <Box sx={{ py: 7, textAlign: 'center' }}><WarningAmberOutlinedIcon sx={{ fontSize: 44, color: 'warning.main' }} /><Typography fontWeight={700} sx={{ mt: 1 }}>Tidak ada equipment ditemukan</Typography><Typography variant="body2" color="text.secondary">Periksa posisi mobilisasi, kategori, atau kata pencarian.</Typography></Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
                {visibleEquipment.map((item) => <EquipmentOption key={item.id} equipment={item} selected={selectedIds.includes(String(item.id))} onToggle={() => toggleEquipment(item)} />)}
              </Box>
            )}
          </>
        )}
      </MainCard>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ position: 'sticky', bottom: 0, zIndex: 5, mt: 2, mx: { xs: -2, sm: 0 }, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: { sm: 1.5 }, boxShadow: '0 -6px 24px rgba(25,40,54,0.12)' }}>
        <Box><Typography fontWeight={800}>{selectedIds.length} equipment dipilih</Typography><Typography variant="caption" color="text.secondary">Standby: DT #48, HE #67 · Breakdown: DT #39, HE #3</Typography></Box>
        <Stack direction="row" spacing={1.25} justifyContent="flex-end">
          <Button color="secondary" onClick={() => router.push('/fleet-assignment')} disabled={saving}>Batal</Button>
          <LoadingButton variant="contained" loading={saving} disabled={!selectedIds.length || unavailableSelected.length > 0 || equipmentQuery.isLoading || placementQuery.isLoading} onClick={handleSave}>Simpan Fleet Assignment</LoadingButton>
        </Stack>
      </Stack>
    </Box>
  );
}
