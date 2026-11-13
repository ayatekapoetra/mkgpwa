import { Box, Stack, Badge, Typography, FormControl, TextField, Autocomplete, InputAdornment } from '@mui/material';
import { useDom } from 'api/dom';

const OptionDoms = ({
  value = '',
  label = 'Kode Doms',
  name = 'dom_id',
  error = null, // Tambahkan prop error
  touched = false, // Tambahkan prop touched
  startAdornment = null,
  setFieldValue
}) => {
  const { data: array, dataLoading } = useDom();
  const openDoms = (array || []).filter((item) => String(item?.status || '').toUpperCase() === 'OPEN');

  if (dataLoading || !array) {
    return <div>Loading...</div>;
  }
  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={openDoms}
          value={openDoms.find((option) => String(option?.kode) === String(value) || String(option?.id) === String(value)) || null}
          noOptionsText="Tidak ada DOM status OPEN"
          onChange={(e, newValue) => {
            // Simpan KODE DOM, bukan id. Backend (RitaseRekapController /
            // RitaseRekapWriter) mencari `mas_doms.kode` dan menyimpan kode
            // tersebut ke kolom dom_id. Mengirim id akan gagal DOM_NOT_FOUND
            // dan menghasilkan data salah.
            setFieldValue(name, newValue?.kode || '');
          }}
          isOptionEqualToValue={(option, value) => String(option?.kode) === String(value?.kode ?? value) || String(option?.id) === String(value?.id ?? value)}
          getOptionLabel={(option) => option.kode || ''}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.label}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body" sx={{ fontWeight: 700 }}>
                    {option.kode}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.pitSource?.nama}
                  </Typography>
                </Stack>
                <Badge badgeContent={option.status} color={option.status === "OPEN"?"primary":"error"} sx={{ mt: 1 }} />
              </Box>
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

export default OptionDoms;
