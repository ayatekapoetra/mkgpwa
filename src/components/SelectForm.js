import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

const SelectForm = ({
  array = [],
  label,
  labelId,
  name,
  value,
  placeholder,
  onChange,
  onBlur,
  touched = {},
  errors = {},
  startAdornment = null // ✅ tambahkan props baru
}) => {
  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined" error={Boolean(touched[name] && errors[name])}>
        <InputLabel id={labelId || `label-for-${name}`}>{label || 'No Label'}</InputLabel>
        <Select
          labelId={labelId || `label-for-${name}`}
          name={name}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          input={
            <OutlinedInput
              label={label}
              startAdornment={startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>}
            />
          }
        >
          <MenuItem value="">{placeholder || 'Pilih'}</MenuItem>
          {array.map((obj, idx) => (
            <MenuItem key={idx} value={obj.key}>
              {obj.teks}
            </MenuItem>
          ))}
        </Select>
        {touched[name] && errors[name] && (
          <FormHelperText id={`${name}-helper`} error>
            {errors[name]}
          </FormHelperText>
        )}
      </FormControl>
    </Stack>
  );
};

SelectForm.propTypes = {
  array: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      teks: PropTypes.string.isRequired
    })
  ),
  label: PropTypes.string,
  labelId: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  helperText: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  touched: PropTypes.object,
  errors: PropTypes.object,
  startAdornment: PropTypes.node // ✅ tambahkan validasi props
};

export default SelectForm;
