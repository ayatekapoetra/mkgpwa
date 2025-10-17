import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useGetEquipment } from 'api/equipment';

const FilterEquipment = ({ value = '', label = 'Equipment', name = 'equipment_id', startAdornment = null, setData }) => {
  const { data: array, dataLoading } = useGetEquipment(null);

  if (dataLoading || !array) {
    return <div>Loading...</div>;
  }


  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array || []}
          value={array?.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
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

export default FilterEquipment;
