import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useUserKaryawan } from 'api/users';

const OptionUser = ({
  value = '',
  label = 'User Karyawan',
  name = 'user_id',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  objField = null,
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useUserKaryawan();

  if (dataLoading) {
    return <div>Loading...</div>;
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
            setFieldValue(objField, newValue || null);
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nmlengkap || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body">{option.nmlengkap}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.phone}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.primary">
                  {option.usertype}
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

export default OptionUser;
