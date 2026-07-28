import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { usePengajuanDanaGudangs } from 'api/pengajuan-dana';
import InputSkeleton from './InputSkeleton';

const OptionGudang = ({
  value = '',
  bisnisId = '',
  label = 'Gudang',
  name = 'gudang_id',
  error = null,
  touched = false,
  disabled = false,
  setFieldValue
}) => {
  const { rows, loading } = usePengajuanDanaGudangs(bisnisId ? { bisnis_id: bisnisId } : {});
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
            setFieldValue(name, newValue?.id != null ? String(newValue.id) : '');
          }}
          isOptionEqualToValue={(option, selected) => String(option?.id) === String(selected?.id)}
          getOptionLabel={(option) => {
            if (!option) return '';
            const kode = option.kode || '';
            const nama = option.nama || '';
            return [kode, nama].filter(Boolean).join(' - ');
          }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.kode}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.kode || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.nama}
                  </Typography>
                </Stack>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label={label} error={touched && Boolean(error)} helperText={touched && error} />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionGudang;
