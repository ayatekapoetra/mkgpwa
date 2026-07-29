import { useEffect } from 'react';
import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetKaryawanSection } from 'api/karyawan';

const normalizeSearchParams = (searchParams) => {
  if (!searchParams) return null;
  if (typeof searchParams === 'string') {
    return searchParams ? { section: searchParams } : null;
  }

  const normalized = Object.entries(searchParams).reduce((acc, [key, val]) => {
    if (val == null || val === '') return acc;
    acc[key] = Array.isArray(val) ? val.join(',') : val;
    return acc;
  }, {});

  return Object.keys(normalized).length ? normalized : null;
};

const OptionKaryawan = ({
  value = '',
  label = 'Pemberi Tugas',
  name = 'assigner_id',
  error = null,
  touched = false,
  startAdornment = null,
  searchParams = '',
  setFieldValue,
  disabled = false
}) => {
  const queryParams = normalizeSearchParams(searchParams);
  const { data: array, dataLoading } = useGetKaryawanSection(queryParams);
  const options = Array.isArray(array) ? array : [];

  useEffect(() => {
    if (!value || dataLoading || !setFieldValue) return;
    const exists = options.some((option) => option?.id == value);
    if (!exists) {
      setFieldValue(name, '');
    }
  }, [value, options, dataLoading, name, setFieldValue]);

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options}
          value={options?.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.section || 'section'}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1, gap: 1 }}>
                <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.nama}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.ktp || '-'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.primary" sx={{ flexShrink: 0 }}>
                  {option.section}
                </Typography>
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

export default OptionKaryawan;
