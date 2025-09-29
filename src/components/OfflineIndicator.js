'use client';

import { useState, useEffect } from 'react';
import { Badge, Tooltip, Stack, Typography } from '@mui/material';
import { Wifi } from 'iconsax-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Tooltip title={isOnline ? 'Online - Data akan disimpan langsung ke server' : 'Offline - Data akan disimpan secara lokal'}>
      <Badge
        color={isOnline ? 'success' : 'error'}
        variant="dot"
        sx={{
          '& .MuiBadge-dot': {
            width: 8,
            height: 8,
            borderRadius: '50%'
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          {isOnline ? <Wifi size={16} color="green" /> : <Wifi size={16} color="red" />}
          <Typography variant="caption" color={isOnline ? 'success.main' : 'error.main'}>
            {isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Stack>
      </Badge>
    </Tooltip>
  );
};

export default OfflineIndicator;
