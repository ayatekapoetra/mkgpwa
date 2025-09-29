import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useSysOptions } from 'api/sysoptions';

const FilterSysOption = ({ value = '', label = 'Options', name = 'nilai', group = '', startAdornment = null, setData = () => {} }) => {
  const { data: array = [], dataLoading } = useSysOptions(group);

  const selectedOption = array.find((opt) => String(opt.nilai) === String(value)) || null;

  if (dataLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array}
          value={selectedOption}
          onChange={(e, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.nilai || '' }));
          }}
          isOptionEqualToValue={(option, val) => {
            // val bisa object (selectedOption) atau primitive (ketika controlled with primitive)
            const valComparable = val && (val.nilai ?? val);
            return String(option.nilai) === String(valComparable);
          }}
          getOptionLabel={(option) => {
            if (!option) return '';
            return option.teks ?? option.nilai ?? '';
          }}
          noOptionsText="Tidak ada opsi"
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body" sx={{ fontWeight: 700 }}>
                    {option.teks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.group}
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

export default FilterSysOption;
