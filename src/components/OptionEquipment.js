import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetEquipment } from 'api/equipment';

const OptionEquipment = ({
  value = '',
  label = 'Equipment',
  name = 'equipment_id',
  objValue = 'equipment',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetEquipment();

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
                <Typography variant="body1" sx={{ fontWight: 700 }}>
                  {option.kode}
                </Typography>
                <Typography variant="caption" color="text.primary">
                  {option.model}
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

export default OptionEquipment;
