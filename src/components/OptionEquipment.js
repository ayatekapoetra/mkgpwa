import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment, Chip, Divider } from '@mui/material';
import { useGetEquipment } from 'api/equipment';

const OptionEquipment = ({
  value = '',
  label = 'Equipment',
  name = 'equipment_id',
  objValue = 'equipment',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  filterParams = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetEquipment(filterParams);

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
          groupBy={(option) => option.manufaktur || 'Lainnya'}
          renderGroup={(params) => (
            <li key={params.key}>
              <Box sx={{ p: 1, bgcolor: 'primary.main', mt: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'white' }}>
                  MANUFAKTUR {(params.group || 'Lainnya').toUpperCase()}
                </Typography>
              </Box>
              <ul style={{ paddingLeft: 0, marginTop: 2 }}>{params.children}</ul>
            </li>
          )}
          value={options.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
            setFieldValue(objValue, options.find((option) => option?.id == newValue?.id) || null);
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.kode || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack spacing={0.1} sx={{ width: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                      {option.kode}
                    </Typography>
                    {option.manufaktur && (
                      <Chip label={option.manufaktur} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                    {option.model || '-'}
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

export default OptionEquipment;
