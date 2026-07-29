import { Box, Stack, Typography, FormControl, TextField, Autocomplete } from '@mui/material';
import { usePengajuanDanaPemasokRekenings } from 'api/pengajuan-dana';
import InputSkeleton from './InputSkeleton';

const getAnRekening = (option) => option?.an_rekening || option?.an || '';

const OptionPemasokRekening = ({
  value = '',
  pemasokId = '',
  label = 'Rekening Pemasok',
  name = 'rekening_id',
  error = null,
  touched = false,
  disabled = false,
  setFieldValue,
  bankField = 'nm_bank',
  noRekeningField = 'no_rekening',
  anRekeningField = 'an_rekening'
}) => {
  const { rows, loading } = usePengajuanDanaPemasokRekenings(pemasokId ? { pemasok_id: pemasokId } : {});
  const options = Array.isArray(rows) ? rows : [];

  if (loading) {
    return <InputSkeleton height={40} />;
  }

  const selected =
    options.find((option) => String(option?.id) === String(value)) ||
    options.find(
      (option) =>
        String(option?.nm_bank || '') === String(value?.nm_bank || '') &&
        String(option?.no_rekening || '') === String(value?.no_rekening || '')
    ) ||
    null;

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          disabled={disabled || !pemasokId}
          options={options}
          noOptionsText={pemasokId ? 'Rekening aktif tidak ditemukan' : 'Pilih pemasok terlebih dahulu'}
          value={selected}
          onChange={(_e, newValue) => {
            if (!newValue) {
              if (name) setFieldValue(name, '');
              setFieldValue(bankField, '');
              setFieldValue(noRekeningField, '');
              setFieldValue(anRekeningField, '');
              return;
            }

            if (name) setFieldValue(name, newValue.id != null ? String(newValue.id) : '');
            setFieldValue(bankField, newValue.nm_bank || '');
            setFieldValue(noRekeningField, newValue.no_rekening || '');
            setFieldValue(anRekeningField, getAnRekening(newValue));
          }}
          isOptionEqualToValue={(option, current) => String(option?.id) === String(current?.id)}
          getOptionLabel={(option) => {
            if (!option) return '';
            if (typeof option === 'string') return option;
            return option.label || [option.nm_bank, option.no_rekening, getAnRekening(option)].filter(Boolean).join(' - ');
          }}
          sx={{ '& .MuiInputBase-root': { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.no_rekening}`}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.nm_bank || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.no_rekening || '-'} · {getAnRekening(option) || '-'}
                  </Typography>
                </Stack>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={touched && Boolean(error)}
              helperText={(touched && error) || (pemasokId ? 'Sumber: rekening pemasok aktif' : 'Pilih pemasok dulu')}
            />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionPemasokRekening;
