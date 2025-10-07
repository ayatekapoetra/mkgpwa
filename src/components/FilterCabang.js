import { Box, Stack, Badge, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useCabang } from 'api/cabang';

const FilterCabang = ({ value = '', label = 'Nama Cabang', name = 'cabang_id', startAdornment = null, setData }) => {
  const { data: array, dataLoading } = useCabang();
  if (dataLoading || !array) {
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
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
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
                    {option.bisnis.name}
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

export default FilterCabang;
