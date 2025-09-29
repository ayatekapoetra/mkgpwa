'use client';

import PropTypes from 'prop-types';

// MATERIAL - UI
import Card from '@mui/material/Card';

// PROJECT IMPORTS

// ASSETS

// ==============================|| MINING AUTH CARD ||============================== //

const MiningAuthCard = ({ children, ...other }) => {
  return (
    <Card
      id="mining-auth-card"
      name="miningAuthCard"
      {...other}
      sx={{
        maxWidth: { xs: 500, md: 600, lg: 700, xl: 800 },
        background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)'),
        backdropFilter: 'blur(20px)',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'),
        ...other?.sx
      }}
    >
      {/* Main Content - Direct children without padding container */}
      {children}
    </Card>
  );
};

MiningAuthCard.propTypes = {
  children: PropTypes.node
};

export default MiningAuthCard;
