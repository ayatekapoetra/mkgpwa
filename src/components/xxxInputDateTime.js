import { DateRange } from '@mui/icons-material';
import { useField } from 'formik';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';

const InputDateTime = ({ ...props }) => {
  const [field, meta] = useField(props);
  const { name, label } = props;

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor="start-adornment-partnumber">{label || 'No Label'}</InputLabel>
        <OutlinedInput
          {...field}
          {...props}
          label={label}
          name={name}
          type="datetime-local"
          fullWidth
          error={meta.touched && Boolean(meta.error)}
          startAdornment={
            <InputAdornment position="start">
              <DateRange />
            </InputAdornment>
          }
          inputProps={{
            'data-testid': `${props.name}-input`,
            ...props.inputProps
          }}
        />
      </FormControl>
      {meta.touched && meta.error && (
        <FormHelperText error id={`${name}-helper-text`}>
          {meta.error}
        </FormHelperText>
      )}
    </Stack>
  );
};

export default InputDateTime;
