'use client';

import { Box, Container, Typography, Paper, Button, Stack } from '@mui/material';
import { Construction, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// ==============================|| MAINTENANCE PAGE COMPONENT ||============================== //

export default function MaintenancePage({ 
  title = "Fitur Dalam Maintenance", 
  subtitle = "Sementara Tidak Tersedia",
  message = "Fitur ini sedang dalam pemeliharaan. Silakan kembali lagi nanti.",
  showBackButton = true 
}) {
  const router = useRouter();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          py: 8,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            width: '100%',
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: 'warning.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Construction
                sx={{
                  fontSize: 64,
                  color: 'warning.main',
                }}
              />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h2"
            sx={{
              mb: 1,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              color: 'warning.main',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>

          {/* Message */}
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.8,
            }}
          >
            {message}
          </Typography>

          {/* Action Buttons */}
          {showBackButton && (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                onClick={() => router.back()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4,
                }}
              >
                Kembali
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4,
                }}
              >
                Ke Dashboard
              </Button>
            </Stack>
          )}

          {/* Additional Info */}
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              Jika Anda memerlukan bantuan lebih lanjut, silakan hubungi administrator sistem.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
