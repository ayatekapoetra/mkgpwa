import { useMemo } from 'react';
import { Box, Stack, Badge, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useCabang } from 'api/cabang';
import InputSkeleton from './InputSkeleton';

const OptionCabang = ({
  value = '',
  bisnisId = '',
  label = 'Nama Cabang',
  name = 'cabang_id',
  error = null,
  touched = false,
  startAdornment = null,
  disabled = false,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useCabang();

  const options = useMemo(() => {
    const list = Array.isArray(array) ? array : [];
    if (!bisnisId) return list;
    return list.filter((item) => !item.bisnis_id || String(item.bisnis_id) === String(bisnisId));
  }, [array, bisnisId]);

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
          value={options.find((option) => String(option?.id) === String(value)) || null}
          onChange={(_e, newValue) => {
            setFieldValue(name, newValue?.id != null ? String(newValue.id) : '');
          }}
          isOptionEqualToValue={(option, selected) => String(option?.id) === String(selected?.id)}
          getOptionLabel={(option) => option?.nama || option?.initial || option?.kode || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.nama || option.kode}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body" sx={{ fontWeight: 700 }}>
                    {option.nama}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.bisnis?.name || '-'}
                  </Typography>
                </Stack>
                {option.type ? <Badge badgeContent={option.type} color="primary" sx={{ mt: 1 }} /> : null}
              </Box>
            </li>
          )}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={label}
                error={touched && Boolean(error)}
                helperText={touched && error}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: startAdornment && (
                    <>
                      <InputAdornment position="start">{startAdornment}</InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            );
          }}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionCabang;
