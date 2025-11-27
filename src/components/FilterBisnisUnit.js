import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment, CircularProgress } from '@mui/material';
import { usePublicBisnis } from 'api/bisnis-unit';

const FilterBisnisUnit = ({ value = '', label = 'Bisnis Unit', name = 'bisnis_id', startAdornment = null, setData }) => {
  const { bisnisUnit: array, bisnisUnitLoading: dataLoading } = usePublicBisnis();
  
  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          loading={dataLoading}
          options={array || []}
          value={array?.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.id || '' }));
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.name || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.name}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body" sx={{ fontWeight: 700 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.kode}
                  </Typography>
                </Stack>
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
                  ),
                  endAdornment: (
                    <>
                      {dataLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
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

export default FilterBisnisUnit;
