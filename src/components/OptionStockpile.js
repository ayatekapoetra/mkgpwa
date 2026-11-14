import { useMemo } from 'react';
import { Box, FormControl, TextField, Autocomplete, Typography, CircularProgress } from '@mui/material';
import { useGetLokasiKerja } from 'api/lokasi-mining';

export default function OptionStockpile({
  value = '',
  label = 'Stockpile',
  name = 'stockpile_id',
  error = null,
  touched = false,
  disabled = false,
  size = 'small',
  setFieldValue,
  onChange
}) {
  const { data: rawList = [], dataLoading } = useGetLokasiKerja({ type: 'STP' });

  const options = useMemo(() => {
    const list = Array.isArray(rawList) ? rawList : [];
    // Prioritaskan lokasi yang memiliki type STP atau STOCKPILE
    const stp = list.filter((item) => {
      const t = String(item?.type || '').toUpperCase();
      return t === 'STP' || t === 'STOCKPILE';
    });
    return stp.length > 0 ? stp : list;
  }, [rawList]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => String(opt.id) === String(value)) || null;
  }, [options, value]);

  const handleChange = (e, newValue) => {
    const nextVal = newValue?.id || '';
    if (typeof setFieldValue === 'function') {
      setFieldValue(name, nextVal);
    }
    if (typeof onChange === 'function') {
      onChange(nextVal, newValue);
    }
  };

  return (
    <FormControl fullWidth size={size}>
      <Autocomplete
        size={size}
        options={options}
        value={selectedOption}
        disabled={disabled || dataLoading}
        onChange={handleChange}
        isOptionEqualToValue={(option, val) => String(option.id) === String(val?.id)}
        getOptionLabel={(option) => option?.nama || option?.kode || String(option?.id || '')}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {option.nama || option.kode}
              </Typography>
              {option.type && (
                <Typography variant="caption" color="text.secondary">
                  {option.type}
                </Typography>
              )}
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            size={size}
            error={touched && Boolean(error)}
            helperText={touched && error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {dataLoading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
          />
        )}
      />
    </FormControl>
  );
}
