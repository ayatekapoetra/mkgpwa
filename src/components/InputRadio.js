import { Box, Typography, Radio, FormControlLabel, RadioGroup } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function InputRadio({ array = [], label = 'MyLabel', value = '', name = 'radio-grp', onChange = null }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        py: 0.4,
        px: 1,
        position: 'relative',
        borderWidth: 1,
        borderRadius: 1,
        borderColor: theme.palette.text.secondary,
        borderStyle: 'dashed'
      }}
    >
      <Typography
        sx={{
          position: 'absolute',
          top: -12,
          px: 1,
          fontSize: 11,
          backgroundColor: theme.palette.background.paper
        }}
      >
        {label}
      </Typography>
      <RadioGroup aria-label={label} value={value} onChange={onChange} name={name} row>
        {array.map((m, idx) => (
          <FormControlLabel key={idx} value={m.value} control={<Radio />} label={m.teks} />
        ))}
      </RadioGroup>
    </Box>
  );
}
