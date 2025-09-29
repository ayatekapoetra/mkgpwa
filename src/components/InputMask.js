import InputMask from 'react-input-mask';
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

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor={name}>{label}</InputLabel>
        <InputMask
          mask={mask}
          value={value}
          name={name}
          onChange={(e) => {
            const newEvent = {
              target: {
                name,
                value: e.target.value
              }
            };
            onChange(newEvent);
          }}
          maskChar="_"
        >
          {(inputProps) => (
            <OutlinedInput {...inputProps} inputRef={inputProps.ref} label="Periode (YYYY-MM)" placeholder="2025-09" fullWidth />
          )}
        </InputMask>
      </FormControl>
      {hasError && (
        <FormHelperText error id={`${name}-helper-text`}>
          {errors[name]}
        </FormHelperText>
      )}
    </Stack>
  );
}
