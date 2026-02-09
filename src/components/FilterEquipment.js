import { useMemo } from 'react';
import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment, CircularProgress } from '@mui/material';
import { useGetEquipment } from 'api/equipment';

const FilterEquipment = ({ value = '', label = 'Equipment', name = 'equipment_id', startAdornment = null, setData }) => {
  const { data: array, dataLoading } = useGetEquipment(null);

  const options = useMemo(() => (Array.isArray(array) ? array : []), [array]);
  const selectedValue = useMemo(() => options.find((option) => option?.id == value) || null, [options, value]);

  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={options}
          loading={dataLoading}
          value={selectedValue}
          onChange={(e, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
          }}
          isOptionEqualToValue={(option, val) => option.id === val?.id}
          getOptionLabel={(option) => option.kode || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.kode}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {option.kode}
                </Typography>
                <Typography variant="caption" color="text.primary">
                  {option.model}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              InputProps={{
                ...params.InputProps,
                startAdornment: startAdornment ? (
                  <>
                    <InputAdornment position="start">{startAdornment}</InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ) : (
                  params.InputProps.startAdornment
                ),
                endAdornment: (
                  <>
                    {dataLoading ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
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

export default FilterEquipment;
