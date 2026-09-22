import PropTypes from 'prop-types';
import Image from 'next/image';

// MATERIAL - UI
import Box from '@mui/material/Box';
// import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';

// ==============================|| STATISTICS - REPORT CARD ||============================== //

const PanelImages = ({ primary, secondary, illustartion, color }) => {
  return (
    <MainCard
      content={false}
      sx={{
        width: '100%',
        bgcolor: color
      }}
    >
      <Stack sx={{ px: 2, height: 150, position: 'relative' }} direction="row" justifyContent="space-between">
        <Stack>
          <Typography variant="h5" color="common.white" sx={{ fontWeight: 500, pt: 1 }}>
            {primary}
          </Typography>
          <Typography variant="h1" color="common.white" sx={{ fontWeight: 800, fontSize: 52, px: 1 }}>
            {secondary}
          </Typography>
          <Typography variant="caption" color="common.black" sx={{ pb: 1, lineHeight: 1 }}>
            Unit
          </Typography>
        </Stack>
        <Box sx={{ position: 'absolute', right: -10, bottom: -45 }}>
          <Image src={illustartion} width={180} height={180} alt="Picture of the author" />
        </Box>
      </Stack>
    </MainCard>
  );
};

PanelImages.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
  content: PropTypes.string,
  color: PropTypes.string
};

PanelImages.defaultProps = {
  primary: '',
  secondary: '',
  illustartion: '',
  color: ''
};

export default PanelImages;
