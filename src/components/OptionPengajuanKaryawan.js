import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { usePengajuanDanaKaryawans } from 'api/pengajuan-dana';
import InputSkeleton from './InputSkeleton';

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
  // Semua karyawan aktif, tanpa filter bisnis_id
  const { rows, loading } = usePengajuanDanaKaryawans({});
  const options = Array.isArray(rows) ? rows : [];

  if (loading) {
    return <InputSkeleton height={40} />;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options}
          value={options.find((option) => String(option?.id) === String(value)) || null}
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
          filterOptions={(opts, state) => {
            const q = String(state.inputValue || '').toLowerCase().trim();
            if (!q) return opts;
            return opts.filter((option) => {
              const haystack = [option.nama, option.ktp, option.nik, option.section, option.cabang?.nama]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              return haystack.includes(q);
            });
          }}
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
              helperText={(touched && error) || helperText || `Total ${options.length} karyawan aktif`}
            />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionPengajuanKaryawan;
