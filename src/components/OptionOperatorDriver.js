import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment, Chip, Divider } from '@mui/material';
import { useGetOprDrv } from 'api/karyawan';

const OptionOperatorDriver = ({
  value = '',
  label = 'Operator / Driver',
  name = 'karyawan_id',
  objValue = 'karyawan',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  params = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetOprDrv(params);

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
          groupBy={(option) => option.section || 'Lainnya'}
          renderGroup={(params) => (
            <li key={params.key}>
              <Box sx={{ p: 1, bgcolor: 'primary.main', mt: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'white' }}>
                  SECTION {(params.group)?.toUpperCase()}
                </Typography>
              </Box>
              <ul style={{ paddingLeft: 0, marginTop: 2 }}>{params.children}</ul>
            </li>
          )}
          value={options?.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
            setFieldValue(objValue, options?.find((option) => option?.id == newValue?.id) || null);
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack spacing={0.3} sx={{ width: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {option.nama}
                    </Typography>
                    {option.section && (
                      <Chip label={option.section} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {option.phone || '-'}
                  </Typography>
                </Stack>
              </Box>
              <Divider sx={{ my: 0.5 }} />
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

export default OptionOperatorDriver;
