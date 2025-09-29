import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

export default function InputSkeleton({ label, height }) {
  return (
    <Stack>
      <strong>{label}</strong>
      <Skeleton animation="wave" height={height} />
    </Stack>
  );
}

// Validasi properti
InputSkeleton.propTypes = {
  label: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Nilai default
InputSkeleton.defaultProps = {
  label: 'Loading...',
  height: 40
};
