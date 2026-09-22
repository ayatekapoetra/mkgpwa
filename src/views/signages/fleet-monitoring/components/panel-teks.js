import PropTypes from 'prop-types';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';

// ==============================|| STATISTICS - REPORT CARD ||============================== //

const PanelTeks = ({ primary, color }) => {
  const theme = useTheme();
  return (
    <MainCard
      content={false}
      sx={{
        width: '100%',
        bgcolor: color
      }}
    >
      <Stack sx={{ height: 150, px: 2, py: 1 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {primary}
          </Typography>
          <Stack alignItems="center">
            <Stack spacing={1} direction="row" alignItems="center">
              <TrendingUpIcon sx={{ color: theme.palette.mode == 'dark' ? '#ebfdf5' : '#025c02' }} />
              <Typography variant="body" sx={{ fontWeight: 800, color: theme.palette.mode == 'dark' ? '#ebfdf5' : '#025c02' }}>
                12.5 %
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ lineHeight: 0.8 }}>
              Akhir Bulan
            </Typography>
          </Stack>
        </Stack>

        <Stack
          py={0.5}
          my={0.5}
          justifyContent="center"
          alignItems="center"
          sx={{ bgcolor: theme.palette.mode == 'light' ? '#f6dada' : '#6b0202' }}
        >
          <strong style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: theme.palette.error.darker }}>783.587</strong>
          <Typography variant="caption" sx={{ lineHeight: 0.8 }}>
            Akhir Bulan
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Stack alignItems="center">
            <Typography variant="caption">Puncak</Typography>
            <strong>902.003</strong>
          </Stack>
          <Stack alignItems="center">
            <Typography variant="caption">Rata-Rata</Typography>
            <strong>602.003</strong>
          </Stack>
        </Stack>
      </Stack>
    </MainCard>
  );
};

PanelTeks.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
  content: PropTypes.string,
  color: PropTypes.string
};

PanelTeks.defaultProps = {
  primary: '',
  secondary: '',
  illustartion: '',
  color: ''
};

export default PanelTeks;
