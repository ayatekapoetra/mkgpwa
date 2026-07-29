import { useMemo } from 'react';
import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { useSysOptions } from 'api/sysoptions';
import InputSkeleton from './InputSkeleton';

const normalizeBankLabel = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  return String(item.nilai || item.teks || item.value || item.key || item.description || item.nm_bank || item.nama || '').trim();
};

const OptionBank = ({
  value = '',
  label = 'Bank',
  name = 'nm_bank',
  error = null,
  touched = false,
  disabled = false,
  helperText = '',
  extraOptions = [],
  setFieldValue
}) => {
  // Sumber utama sama seperti master pemasok/karyawan: sys_options group=bank
  const { data: sysBanks = [], dataLoading } = useSysOptions('bank');

  const options = useMemo(() => {
    const fromSys = (Array.isArray(sysBanks) ? sysBanks : [])
      .map((item) => normalizeBankLabel(item))
      .filter(Boolean);

    const extras = (Array.isArray(extraOptions) ? extraOptions : [])
      .map((item) => normalizeBankLabel(item))
      .filter(Boolean);

    const current = value ? [String(value).trim()] : [];

    return [...new Set([...fromSys, ...extras, ...current])].sort((a, b) => a.localeCompare(b, 'id'));
  }, [sysBanks, extraOptions, value]);

  if (dataLoading) {
    return <InputSkeleton height={40} />;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options}
          value={value || null}
          onChange={(_e, newValue) => {
            setFieldValue(name, newValue || '');
          }}
          isOptionEqualToValue={(option, selected) => String(option || '') === String(selected || '')}
          getOptionLabel={(option) => option || ''}
          noOptionsText="Daftar bank tidak tersedia"
          ListboxProps={{ style: { maxHeight: 320 } }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={touched && Boolean(error)}
              helperText={(touched && error) || helperText || `Total ${options.length} bank`}
            />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionBank;
