'use client';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// PROJECT IMPORT
import { ThemeMode } from 'config';

// ASSETS
import Image from 'next/image';

// ==============================|| MINING AUTH BACKGROUND ||============================== //

const MiningAuthBackground = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        background:
          theme.palette.mode === ThemeMode.DARK
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #667eea 100%)'
      }}
    >
      {/* Mining Equipment Silhouettes */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -100,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.15 : 0.08,
          transform: 'scaleX(-1)'
        }}
      >
        <Image src="/assets/images/equipment/SK200-10.png" alt="Excavator" width={400} height={300} style={{ objectFit: 'contain' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          right: -80,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.12 : 0.06
        }}
      >
        <Image src="/assets/images/equipment/FVZ285.png" alt="Dump Truck" width={350} height={250} style={{ objectFit: 'contain' }} />
      </Box>

      {/* Mining Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${
            theme.palette.mode === ThemeMode.DARK ? 'ffffff' : '000000'
          }' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.3 : 0.1
        }}
      />

      {/* Geometric Mining Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0) 70%)'
              : 'radial-gradient(circle, rgba(255,193,7,0.2) 0%, rgba(255,193,7,0) 70%)',
          filter: 'blur(40px)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0) 70%)'
              : 'radial-gradient(circle, rgba(76,175,80,0.2) 0%, rgba(76,175,80,0) 70%)',
          filter: 'blur(30px)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0) 70%)'
              : 'radial-gradient(circle, rgba(33,150,243,0.15) 0%, rgba(33,150,243,0) 70%)',
          filter: 'blur(35px)'
        }}
      />

      {/* Mining Stats Cards (Decorative) */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.6 : 0.4
        }}
      >
        <Card
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 2,
            transform: 'rotate(5deg)'
          }}
        >
          <CardContent sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="caption" color="textSecondary">
              Active Equipment
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold">
              247
            </Typography>
            <Typography variant="caption" color="success.main">
              +12% this month
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          left: '8%',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.5 : 0.3
        }}
      >
        <Card
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 2,
            transform: 'rotate(-3deg)'
          }}
        >
          <CardContent sx={{ p: 2, minWidth: 180 }}>
            <Typography variant="caption" color="textSecondary">
              Mining Sites
            </Typography>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              18
            </Typography>
            <Typography variant="caption" color="primary">
              Operating 24/7
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Floating Mining Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.2 : 0.1
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '8rem',
            fontWeight: 900,
            color: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            letterSpacing: '-0.05em',
            lineHeight: 1
          }}
        >
          MINING
        </Typography>
      </Box>

      {/* Safety First Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.7 : 0.5
        }}
      >
        <Card
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '50px',
            px: 3,
            py: 1
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" color="warning.main" fontWeight="bold">
              ⚠️
            </Typography>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              SAFETY FIRST
            </Typography>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};

export default MiningAuthBackground;
