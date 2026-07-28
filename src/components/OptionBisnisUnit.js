import { Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { usePublicBisnis } from 'api/bisnis-unit';
import InputSkeleton from './InputSkeleton';

const normalizeBisnisOptions = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const OptionBisnisUnit = ({
  value = '',
  label = 'Bisnis Unit',
  name = 'bisnis_id',
  error = null,
  touched = false,
  startAdornment = null,
  disabled = false,
  setFieldValue
}) => {
  const { bisnisUnit: array, bisnisUnitLoading: dataLoading } = usePublicBisnis();
  const options = normalizeBisnisOptions(array);

  if (dataLoading) {
    return <InputSkeleton height={40} />;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options}
          value={options.find((option) => String(option?.id) === String(value)) || null}
          onChange={(_e, newValue) => {
            setFieldValue(name, newValue?.id != null ? String(newValue.id) : '');
          }}
          isOptionEqualToValue={(option, selected) => String(option?.id) === String(selected?.id)}
          getOptionLabel={(option) => option?.name || option?.initial || option?.kode || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.name || option.kode}`}>
              <Stack>
                <Typography variant="body" sx={{ fontWeight: 700 }}>
                  {option.name || option.initial || option.kode}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[option.initial, option.kode].filter(Boolean).join(' - ')}
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
