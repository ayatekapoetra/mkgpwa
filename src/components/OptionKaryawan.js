import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetKaryawan } from 'api/karyawan';

const OptionKaryawan = ({
  value = '',
  label = 'Pemberi Tugas',
  name = 'assigner_id',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetKaryawan();

  const options = Array.isArray(array) ? array : [];

  if (dataLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={options}
          value={options?.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            // setData((prev) => ({ ...prev, assigner_id: newValue?.id || '' }));
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {option.nama}
                </Typography>
                <Typography variant="caption" color="text.primary">
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
