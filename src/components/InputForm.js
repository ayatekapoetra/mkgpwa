import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const InputForm = ({
  touched = false,
  errors = {},
  label = 'No Label',
  type = 'text',
  name = 'NoName',
  placeholder = 'No Teks...',
  value = '',
  startAdornment = null,
  endAdornment = null,
  onBlur = null,
  onChange = null,
  autoFocus = false,
  readOnly = false, // ← Tambahkan ini
  multiline = false,
  rows = 1,
  min = undefined, // ✅ Tambahkan min
  max = undefined // ✅ Tambahkan max
}) => {
  const hasError = touched && errors && errors[name];

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor={name}>{label}</InputLabel>
        <OutlinedInput
          fullWidth
          autoFocus={autoFocus}
          type={type}
          id={name}
          name={name}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          placeholder={placeholder}
          startAdornment={startAdornment}
          endAdornment={endAdornment}
          label={label}
          readOnly={readOnly} // ← Set ke input
          multiline={multiline}
          rows={rows}
          inputProps={{
            ...(type === 'number' ? { step: 'any' } : {}),
            ...(min !== undefined ? { min } : {}),
            ...(max !== undefined ? { max } : {})
          }}
        />
      </FormControl>

      {hasError && (
        <FormHelperText error id={`${name}-helper-text`}>
          {errors[name]}
        </FormHelperText>
      )}
    </Stack>
  );
};

InputForm.propTypes = {
  touched: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  errors: PropTypes.object,
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  helperText: PropTypes.string,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  autoFocus: PropTypes.bool,
  readOnly: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ Tambahkan propTypes
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) // ✅ Tambahkan propTypes
};

export default InputForm;
