import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { usePengajuanDanaPemasokRekenings } from 'api/pengajuan-dana';
import axiosServices from 'utils/axios';
import OptionSysOption from './OptionSysOption';
import InputSkeleton from './InputSkeleton';

const getAnRekening = (option) => option?.an_rekening || option?.an || '';

const OptionPemasokRekening = ({
  value = '',
  pemasokId = '',
  label = 'Rekening Pemasok',
  name = 'rekening_id',
  error = null,
  touched = false,
  disabled = false,
  setFieldValue,
  bankField = 'nm_bank',
  noRekeningField = 'no_rekening',
  anRekeningField = 'an_rekening'
}) => {
  const { rows, loading, mutate } = usePengajuanDanaPemasokRekenings(pemasokId ? { pemasok_id: pemasokId } : {});
  const options = Array.isArray(rows) ? rows : [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ nm_bank: '', no_rekening: '', an: '' });

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setSaveError('');
    setForm({ nm_bank: '', no_rekening: '', an: '' });
  };

  const handleSave = async () => {
    if (!form.nm_bank || !String(form.no_rekening).trim()) {
      setSaveError('Nama bank dan nomor rekening wajib diisi');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await axiosServices.post(`/master/pemasok/${encodeURIComponent(pemasokId)}/rekening`, {
        nm_bank: form.nm_bank,
        no_rekening: String(form.no_rekening).trim(),
        an: form.an
      });
      const created = res?.data?.rows || {};
      if (typeof mutate === 'function') await mutate();
      if (name) setFieldValue(name, created.id != null ? String(created.id) : '');
      setFieldValue(bankField, created.nm_bank || form.nm_bank);
      setFieldValue(noRekeningField, created.no_rekening || String(form.no_rekening).trim());
      setFieldValue(anRekeningField, created.an || form.an || '');
      setDialogOpen(false);
      setForm({ nm_bank: '', no_rekening: '', an: '' });
    } catch (err) {
      setSaveError(err?.response?.data?.diagnostic?.message || err?.message || 'Gagal menyimpan rekening pemasok');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <InputSkeleton height={40} />;
  }

  const selected =
    options.find((option) => String(option?.id) === String(value)) ||
    options.find(
      (option) =>
        String(option?.nm_bank || '') === String(value?.nm_bank || '') &&
        String(option?.no_rekening || '') === String(value?.no_rekening || '')
    ) ||
    null;

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled || !pemasokId}
          options={options}
          noOptionsText={pemasokId ? 'Rekening aktif tidak ditemukan' : 'Pilih pemasok terlebih dahulu'}
          value={selected}
          onChange={(_e, newValue) => {
            if (!newValue) {
              if (name) setFieldValue(name, '');
              setFieldValue(bankField, '');
              setFieldValue(noRekeningField, '');
              setFieldValue(anRekeningField, '');
              return;
            }

            if (name) setFieldValue(name, newValue.id != null ? String(newValue.id) : '');
            setFieldValue(bankField, newValue.nm_bank || '');
            setFieldValue(noRekeningField, newValue.no_rekening || '');
            setFieldValue(anRekeningField, getAnRekening(newValue));
          }}
          isOptionEqualToValue={(option, current) => String(option?.id) === String(current?.id)}
          getOptionLabel={(option) => {
            if (!option) return '';
            if (typeof option === 'string') return option;
            return option.label || [option.nm_bank, option.no_rekening, getAnRekening(option)].filter(Boolean).join(' - ');
          }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.no_rekening}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.nm_bank || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.no_rekening || '-'} · {getAnRekening(option) || '-'}
                  </Typography>
                </Stack>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={touched && Boolean(error)}
              helperText={(touched && error) || (pemasokId ? 'Sumber: rekening pemasok aktif' : 'Pilih pemasok dulu')}
            />
          )}
        />
      </FormControl>
      {pemasokId && !disabled && options.length === 0 && (
        <Button size="small" sx={{ mt: 0.5 }} onClick={() => setDialogOpen(true)}>
          + Tambah Rekening Pemasok
        </Button>
      )}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Tambah Rekening Pemasok</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}
            <OptionSysOption
              label="Nama Bank"
              group="bank"
              name="nm_bank"
              value={form.nm_bank}
              setFieldValue={(_field, value) => setForm((prev) => ({ ...prev, nm_bank: value }))}
            />
            <TextField
              fullWidth
              label="No Rekening"
              value={form.no_rekening}
              onChange={(e) => setForm((prev) => ({ ...prev, no_rekening: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Atas Nama"
              value={form.an}
              onChange={(e) => setForm((prev) => ({ ...prev, an: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default OptionPemasokRekening;
