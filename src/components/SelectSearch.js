import PropTypes from 'prop-types';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';

import { Category2 } from 'iconsax-react';

export default function SelectSearch({ label = 'Nolabel', size = '', name, value = '', array = [], onChange = null, startAdornment = null }) {
  return (
    <FormControl fullWidth>
      <InputLabel id={name}>{label}</InputLabel>
      <Select
        fullWidth
        size={size}
        name={name}
        value={value}
        onChange={onChange}
        input={
          <OutlinedInput
            startAdornment={startAdornment || <Category2 />}
            label={label}
          />
        }
      >
        <MenuItem value="">
          <em>Pilih</em>
        </MenuItem>
        {array?.length > 0 &&
          array.map((obj, idx) => (
            <MenuItem key={idx} value={obj.key}>
              {obj.teks}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}

SelectSearch.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOf(['small', 'medium']),
  array: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      teks: PropTypes.string.isRequired
    })
  ),
  onChange: PropTypes.func,
  startAdornment: PropTypes.node
};
