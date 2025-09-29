import PropTypes from 'prop-types';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

export default function InputSearch({
  label = 'NoLabel',
  name = 'NoName',
  type = 'text',
  size = 'small',
  value = '',
  onChange = null,
  startAdornment = null,
  endAdornment = null
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id={name}>{label}</InputLabel>
      <OutlinedInput
        fullWidth
        size={size}
        type={type}
        value={value}
        onChange={onChange}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
      />
    </FormControl>
  );
}

// Validasi prop types
InputSearch.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node
};
