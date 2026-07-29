import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetKaryawanSection } from 'api/karyawan';

const normalizeParams = (params) => {
  if (!params) return null;
  if (typeof params === 'string') {
    return params ? { section: params } : null;
  }

  const normalized = Object.entries(params).reduce((acc, [key, val]) => {
    if (val == null || val === '') return acc;
    acc[key] = Array.isArray(val) ? val.join(',') : val;
    return acc;
  }, {});

  return Object.keys(normalized).length ? normalized : null;
};

const FilterKaryawan = ({ value = '', label = 'Karyawan', name = 'karyawan_id', startAdornment = null, params = null, setData }) => {
  const { data: array, dataLoading } = useGetKaryawanSection(normalizeParams(params));
  const options = Array.isArray(array) ? array : [];

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={options}
          value={options.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
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

export default FilterKaryawan;
