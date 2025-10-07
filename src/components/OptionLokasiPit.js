import { Box, Stack, Badge, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetLokasiKerja } from 'api/lokasi-mining';

const OptionLokasiKerja = ({
  value = '',
  label = 'Lokasi Kerja',
  name = 'lokasi_id',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading, dataEmpty } = useGetLokasiKerja();

  console.log('array--', array);
  

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  if (dataEmpty || !array || array.length === 0) {
    return (
      <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
        <FormControl fullWidth variant="outlined">
          <TextField
            label={label}
            value=""
            disabled
            helperText="Tidak ada data lokasi kerja tersedia"
            InputProps={{
              startAdornment: startAdornment && (
                <InputAdornment position="start">{startAdornment}</InputAdornment>
              )
            }}
          />
        </FormControl>
      </Stack>
    );
  }
  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array}
          value={array.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body" sx={{ fontWeight: 700 }}>
                    {option.nama}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.cabang.nama}
                  </Typography>
                </Stack>
                <Badge badgeContent={option.type} color="primary" sx={{ mt: 1 }} />
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

export default OptionLokasiKerja;
