import { useEffect, useState } from 'react';
import { Autocomplete, Box, CircularProgress, FormControl, Stack, TextField, Typography } from '@mui/material';
import { usePengajuanDanaKaryawans } from 'api/pengajuan-dana';

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DELAY = 400;

const OptionPengajuanKaryawan = ({
  value = '',
  label = 'Karyawan',
  name = 'karyawan_id',
  error = null,
  touched = false,
  disabled = false,
  helperText = '',
  setFieldValue,
  onSelect
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const keyword = debouncedSearch.trim();
  const canSearch = keyword.length >= MIN_SEARCH_LENGTH;
  const selectedId = value ? String(value) : '';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [search]);

  const { rows, loading, error: requestError } = usePengajuanDanaKaryawans(
    canSearch || selectedId
      ? {
          keyword: canSearch ? keyword : undefined,
          selected_id: selectedId || undefined
        }
      : null
  );
  const options = Array.isArray(rows) ? rows : [];

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options}
          loading={loading}
          noOptionsText={search.trim().length < MIN_SEARCH_LENGTH ? 'Ketik minimal 3 karakter' : 'Karyawan tidak ditemukan'}
          value={options.find((option) => String(option?.id) === String(value)) || null}
          onInputChange={(_event, newInputValue, reason) => {
            if (reason === 'input' || reason === 'clear') setSearch(newInputValue);
          }}
          onChange={(_e, newValue) => {
            const nextId = newValue?.id != null ? String(newValue.id) : '';
            setFieldValue(name, nextId);
            onSelect?.(newValue || null);
          }}
          isOptionEqualToValue={(option, selected) => String(option?.id) === String(selected?.id)}
          getOptionLabel={(option) => {
            if (!option) return '';
            const nama = option.nama || '';
            const ktp = option.ktp || option.nik || '';
            return ktp ? `${nama} (${ktp})` : nama;
          }}
          filterOptions={(opts) => opts}
          ListboxProps={{ style: { maxHeight: 320 } }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.ktp || option.nik || option.nama}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1, gap: 1 }}>
                <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.nama}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    KTP: {option.ktp || option.nik || '-'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.primary" sx={{ flexShrink: 0 }}>
                  {option.section || option.cabang?.nama || '-'}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={touched && Boolean(error)}
              helperText={
                (touched && error) ||
                (requestError && 'Gagal mengambil data karyawan') ||
                helperText ||
                (search.trim().length < MIN_SEARCH_LENGTH ? 'Ketik minimal 3 karakter untuk mencari karyawan' : `${options.length} karyawan ditemukan`)
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionPengajuanKaryawan;
