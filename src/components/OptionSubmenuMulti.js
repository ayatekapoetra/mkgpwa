import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetSubMenu } from 'api/menu';

const OptionSubmenuMulti = ({
  value = [], // nilai sekarang berupa array object
  label = 'Nama Menu',
  name = 'submenu', // ubah ke 'submenu'
  error = null,
  touched = false,
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useGetSubMenu();

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          multiple
          fullWidth
          disableCloseOnSelect
          options={array}
          value={value}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue); // langsung set array object
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.name || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.menu?.name}
                  </Typography>
                </Stack>
              </Box>
            </li>
          )}
          renderInput={(params) => (
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
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionSubmenuMulti;
