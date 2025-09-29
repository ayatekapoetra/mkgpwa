'use client';

import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// PROJECT IMPORTS

// PROJECT IMPORTS
import MiningAuthCard from './MiningAuthCard';

// PROJECT IMPORTS
import MiningAuthBackground from './MiningAuthBackground';
// import { Building, Truck, Building3, Shield, Clock } from 'iconsax-react';

// ==============================|| MINING AUTHENTICATION WRAPPER ||============================== //

const MiningAuthWrapper = ({ children }) => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      {/* Mining Background */}
      <MiningAuthBackground />

      {/* Side Panel */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: { xs: '0%', md: '40%' },
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(15,52,96,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,193,7,0.1) 0%, rgba(76,175,80,0.1) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${theme.palette.divider}`,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1
        }}
      >
        <Stack spacing={4} alignItems="center" maxWidth={400}>
          {/* Logo */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFC107 0%, #4CAF50 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255, 193, 7, 0.3)',
              mb: 2
            }}
          >
            {/* <Mining size={48} color="#FFFFFF" /> */}
          </Box>

          {/* Features */}
          <Stack spacing={3} width="100%">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* <Truck size={24} color="#FFC107" /> */}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  Real-time Analytics
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Monitor equipment performance and productivity
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  background: 'rgba(76, 175, 80, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* <Construction size={24} color="#4CAF50" /> */}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  Team Management
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Coordinate operators and maintenance teams
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  background: 'rgba(33, 150, 243, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* <ShieldCheck size={24} color="#2196F3" /> */}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  Multi-site Operations
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Manage multiple mining locations seamlessly
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {/* Stats */}
          <Box sx={{ width: '100%', mt: 4 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  Active Equipment
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  247
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  Mining Sites
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  18
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  Total Operators
                </Typography>
                <Typography variant="h6" color="info.main" fontWeight="bold">
                  156
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ml: { xs: 0, md: '40%' },
          p: { xs: 2, md: 4 }
        }}
      >
        <MiningAuthCard>{children}</MiningAuthCard>
      </Box>
    </Box>
  );
};

MiningAuthWrapper.propTypes = {
  children: PropTypes.node
};

export default MiningAuthWrapper;
