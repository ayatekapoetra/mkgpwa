'use client';

import PropTypes from 'prop-types';
import { FormControl, TextField, Autocomplete, CircularProgress } from '@mui/material';
import { useGetPitKdsm } from 'api/pit-kdsm';

const OptionKdsm = ({
  value = '',
  label = 'KDSM',
  name = 'kdsm',
  penyewaId,
  startpitId,
  error = null,
  touched = false,
  disabled = false,
  setFieldValue,
  fallbackFreeText = true
}) => {
  const { rows, loading } = useGetPitKdsm({
    penyewa_id: penyewaId || undefined,
    startpit_id: startpitId || undefined,
    perPage: 200
  });

  if (loading) {
    return (
      <TextField
        fullWidth
        label={label}
        disabled
        value=""
        InputProps={{
          endAdornment: <CircularProgress size={18} />
        }}
      />
    );
  }

  // Fallback ke input teks bebas bila tidak ada opsi KDSM terdaftar
  if (!rows || rows.length === 0) {
    if (fallbackFreeText) {
      return (
        <TextField
          fullWidth
          label={label}
          name={name}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => setFieldValue(name, e.target.value)}
          error={touched && Boolean(error)}
          helperText={touched && error ? error : 'Tidak ada master KDSM, input manual diizinkan'}
        />
      );
    }
    return (
      <TextField
        fullWidth
        label={label}
        disabled
        value=""
        helperText="Tidak ada master KDSM untuk filter ini"
      />
    );
  }

  const selectedOption = rows.find((r) => r.kode === value || String(r.id) === String(value)) || null;

  return (
    <FormControl fullWidth variant="outlined">
      <Autocomplete
        fullWidth
        freeSolo={fallbackFreeText}
        options={rows}
        value={selectedOption || value || null}
        disabled={disabled}
        onChange={(_e, newValue) => {
          if (typeof newValue === 'string') {
            setFieldValue(name, newValue);
          } else {
            setFieldValue(name, newValue?.kode || newValue?.id || '');
          }
        }}
        isOptionEqualToValue={(opt, val) => {
          if (typeof val === 'string') return opt.kode === val;
          return opt.id === val?.id || opt.kode === val?.kode;
        }}
        getOptionLabel={(opt) => {
          if (typeof opt === 'string') return opt;
          return opt.kode ? `${opt.kode}${opt.penyewa_abbr ? ` (${opt.penyewa_abbr})` : ''}` : '';
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={touched && Boolean(error)}
            helperText={touched && error}
          />
        )}
      />
    </FormControl>
  );
};

OptionKdsm.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  name: PropTypes.string,
  penyewaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  startpitId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  error: PropTypes.string,
  touched: PropTypes.bool,
  disabled: PropTypes.bool,
  setFieldValue: PropTypes.func.isRequired,
  fallbackFreeText: PropTypes.bool
};

export default OptionKdsm;
