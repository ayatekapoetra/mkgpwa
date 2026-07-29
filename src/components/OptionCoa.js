import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { usePengajuanDanaCoas } from 'api/pengajuan-dana';
import InputSkeleton from './InputSkeleton';

const getCoaName = (option) => option?.coa_name || option?.nama || '';
const getCoaTypeName = (option) => option?.coa_tipe_name || option?.tipe?.name || option?.tipe?.nama || '-';

const OptionCoa = ({
  value = '',
  bisnisId = '',
  label = 'COA',
  name = 'coa_id',
  error = null,
  touched = false,
  disabled = false,
  setFieldValue
}) => {
  const { rows, loading } = usePengajuanDanaCoas(bisnisId ? { bisnis_id: bisnisId } : {});
  const options = Array.isArray(rows) ? rows : [];

  if (loading) {
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
          getOptionLabel={(option) => {
            if (!option) return '';
            const kode = option.kode || '';
            const nama = getCoaName(option);
            const tipe = getCoaTypeName(option);
            return [kode, nama, tipe !== '-' ? `(${tipe})` : ''].filter(Boolean).join(' - ');
          }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.kode}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack sx={{ width: '100%' }} spacing={0.2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1, gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {option.kode}
                    </Typography>
                    <Typography variant="caption" color="primary.main">
                      {getCoaTypeName(option)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getCoaName(option)}
                  </Typography>
                </Stack>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label={label} error={touched && Boolean(error)} helperText={touched && error} />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionCoa;
