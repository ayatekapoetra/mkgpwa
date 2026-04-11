import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetKegiatanKerja } from 'api/kegiatan-mining';

const FilterKegiatanKerja = ({
  value = '',
  searchParams = '', // { type: 'DT' } atau { type: 'HE' }
  ctg = '', // filter by equipment category (HE/DT/WT/FT/LT/LV)
  label = 'Kegiatan',
  name = 'kegiatan_id',
  startAdornment = null,
  setData
}) => {
  const params = searchParams || {};
  if (ctg) {
    params.type = ctg;
  }

  const { data: array, dataLoading } = useGetKegiatanKerja(params);
  
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
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body1">{option.nama}</Typography>
                <Typography variant="caption">{option.grpequipment}</Typography>
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

export default FilterKegiatanKerja;
