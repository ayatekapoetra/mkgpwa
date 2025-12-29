import PropTypes from 'prop-types';
import Image from 'next/image';

// MATERIAL - UI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';

// ==============================|| STATISTICS - REPORT CARD ||============================== //

const PanelCard = ({ primary, secondary, issue, illustartion, color }) => {
  return (
    <MainCard
      content={false}
      sx={{
        width: '100%',
        bgcolor: color,
        position: 'relative',
        overflow: 'hidden',
        height: '100px',
        '&:before, &:after': {
          content: '""',
          width: 1,
          height: 1,
          position: 'absolute',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.0001) 22.07%, rgba(255, 255, 255, 0.15) 83.21%)',
          transform: 'matrix(0.9, 0.44, -0.44, 0.9, 0, 0)'
        },
        '&:after': {
          top: '50%',
          right: '-20px'
        },
        '&:before': {
          right: '-70px',
          bottom: '80%'
        }
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Typography variant="body2" color="common.white" sx={{ fontWeight: 700, fontSize: '11px' }}>
          {primary}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.5, display: 'flex', flex: 1, height: '100%' }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Box alignItems="center" justifyContent="flex-start">
              <Image src={illustartion} width={80} height={80} alt={primary} style={{ objectFit: 'contain' }} />
            </Box>
          </Grid>
          <Grid item>
            <Stack alignItems="flex-end" justifyContent="center">
              <Typography variant="h2" color="common.white" sx={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>
                {secondary}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        {issue && (
          <Box sx={{ position: 'absolute', bottom: 4, right: 8 }}>
            <Typography variant="caption" color="common.white" sx={{ fontWeight: 600, fontSize: '10px' }}>
              {issue} Issues
            </Typography>
          </Box>
        )}
      </Box>
    </MainCard>
  );
};

PanelCard.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
  content: PropTypes.string,
  color: PropTypes.string
};

export default PanelCard;
