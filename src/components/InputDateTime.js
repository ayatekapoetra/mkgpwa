import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/locale/id';
import { DateRange } from '@mui/icons-material';
import { useField } from 'formik';
import { Stack, FormControl, InputLabel, OutlinedInput, InputAdornment, FormHelperText } from '@mui/material';

const InputDateTime = ({ label, inputProps = {}, minDate, maxDate, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const hasError = Boolean(meta.touched && meta.error);
  const id = `${field.name}-datetime-input`;

  const inputValue = field.value ? moment(field.value, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DDTHH:mm') : '';

  // Ubah format min & max agar sesuai standar input datetime-local
  const formattedMin = minDate ? moment(minDate).format('YYYY-MM-DDTHH:mm') : undefined;
  const formattedMax = maxDate ? moment(maxDate).format('YYYY-MM-DDTHH:mm') : undefined;

  const handleChange = (event) => {
    const rawValue = event.target.value;
    if (rawValue) {
      const formatted = moment(rawValue, 'YYYY-MM-DDTHH:mm').format('DD-MM-YYYY HH:mm');
      helpers.setValue(formatted);
    } else {
      helpers.setValue('');
    }
  };

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined" error={hasError}>
        <InputLabel htmlFor={id}>{label || 'No Label'}</InputLabel>
        <OutlinedInput
          {...field}
          id={id}
          type="datetime-local"
          value={inputValue}
          onBlur={field.onBlur}
          onChange={handleChange}
          label={label}
          startAdornment={
            <InputAdornment position="start">
              <DateRange />
            </InputAdornment>
          }
          inputProps={{
            'data-testid': `${field.name}-input`,
            min: formattedMin,
            max: formattedMax,
            ...inputProps
          }}
        />
        {hasError && <FormHelperText id={`${field.name}-helper-text`}>{meta.error}</FormHelperText>}
      </FormControl>
    </Stack>
  );
};

InputDateTime.propTypes = {
  label: PropTypes.string,
  inputProps: PropTypes.object,
  name: PropTypes.string.isRequired,
  minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
};

export default InputDateTime;
