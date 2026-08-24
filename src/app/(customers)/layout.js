'use client';

import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

import CustomersNavBar from 'views/customers/components/CustomersNavBar';

export default function CustomersLayout({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? '#0b1220' : alpha(theme.palette.grey[100], 0.9)
      }}
    >
      <CustomersNavBar />
      <Box component="main">{children}</Box>
    </Box>
  );
}

CustomersLayout.propTypes = {
  children: PropTypes.node
};
