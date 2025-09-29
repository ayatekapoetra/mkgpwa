'use client';

import { useSearchParams } from 'next/navigation';

// MATERIAL - UI
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { ArrowLeft } from 'iconsax-react';

// PROJECT IMPORTS

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box textAlign="center" sx={{ p: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h1" color="error" sx={{ fontWeight: 'bold' }}>
            Authentication Error
          </Typography>
          <Typography variant="h4" color="text.secondary">
            {getErrorMessage(error)}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
            Please try again or contact support if the problem persists.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button variant="contained" startIcon={<ArrowLeft />} onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="outlined" onClick={() => (window.location.href = '/login')}>
              Back to Login
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
