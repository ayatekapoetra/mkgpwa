import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const InputAreaForm = ({
  rows,
  touched,
  errors,
  label,
  type,
  name,
  placeholder,
  value,
  startAdornment,
  endAdornment,
  onBlur,
  onChange,
  autoFocus
}) => {
  const hasError = touched && errors && touched[name] && errors[name];

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor={name}>{label}</InputLabel>
        <OutlinedInput
          fullWidth
          multiline
          rows={rows}
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

InputAreaForm.propTypes = {
  multiline: PropTypes.bool,
  row: PropTypes.number,
  touched: PropTypes.bool,
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
  autoFocus: PropTypes.bool
};

InputAreaForm.defaultProps = {
  multiline: true,
  rows: 5,
  touched: false,
  errors: {},
  label: 'No Label',
  type: 'text',
  name: 'NoName',
  placeholder: 'No Teks...',
  value: '',
  helperText: 'Incorrect entry.',
  startAdornment: null,
  endAdornment: null,
  onBlur: null,
  onChange: null,
  autoFocus: false
};

export default InputAreaForm;
