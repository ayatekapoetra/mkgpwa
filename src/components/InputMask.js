import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';

export default function InputMaskForm({
  value = '',
  mask = '9999-99',
  name = 'tahun',
  touched,
  errors,
  label,
  onChange = () => {} // ✅ default noop function
}) {
  const hasError = touched && errors && errors[name];

  const formatValue = (val) => {
    const digits = String(val || '').replace(/[^0-9]/g, '').slice(0, 6);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const handleChange = (e) => {
    const next = formatValue(e.target.value);
    onChange({ target: { name, value: next } });
  };

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor={name}>{label}</InputLabel>
        <OutlinedInput
          label="Periode (YYYY-MM)"
          placeholder="2025-09"
          name={name}
          value={formatValue(value)}
          onChange={handleChange}
          inputProps={{ inputMode: 'numeric', pattern: '\\d{4}-\\d{2}' }}
          fullWidth
        />
      </FormControl>
      {hasError && (
        <FormHelperText error id={`${name}-helper-text`}>
          {errors[name]}
        </FormHelperText>
      )}
    </Stack>
  );
}
