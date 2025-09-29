import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { useGetKaryawanSection } from 'api/karyawan';

const OptionKaryawanMulti = ({ value = [], params = '', label = 'Pemberi Tugas', name = 'assigner_id', setFieldValue }) => {
  const { data: array, dataLoading, dataError } = useGetKaryawanSection(params);
  console.log('dataError', dataError);

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          multiple
          fullWidth
          options={array}
          value={array.filter((option) => value?.map((m) => m.id).includes(option.id))}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue);
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.nama || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {option.nama}
                </Typography>
                <Typography variant="caption" color="text.primary">
                  {option.section}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label={label} />}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionKaryawanMulti;
