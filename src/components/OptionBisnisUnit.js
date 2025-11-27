import { Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { usePublicBisnis } from 'api/bisnis-unit';

const OptionBisnisUnit = ({
  value = '',
  label = 'Bisnis Unit',
  name = 'bisnis_id',
  error = null,
  touched = false,
  startAdornment = null,
  setFieldValue
}) => {
  const { bisnisUnit: array, bisnisUnitLoading: dataLoading } = usePublicBisnis();

  if (dataLoading || !array) {
    return <div>Loading...</div>;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array}
          value={array.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || '');
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.name || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.name}`}>
              <Stack>
                <Typography variant="body" sx={{ fontWeight: 700 }}>
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.initial} - {option.kode}
                </Typography>
              </Stack>
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

export default OptionBisnisUnit;
