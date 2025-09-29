'use client';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// PROJECT IMPORT
import { ThemeMode } from 'config';

// ASSETS
import Image from 'next/image';

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(var(--rotation, 0deg)); }
    50% { transform: translateY(-20px) rotate(var(--rotation, 0deg)); }
  }
  
  @keyframes floatUp {
    0%, 100% { transform: translateX(-50%) translateY(0px); }
    50% { transform: translateX(-50%) translateY(-15px); }
  }
  
  @keyframes glow {
    0% { opacity: 0.6; transform: scale(1); }
    100% { opacity: 1; transform: scale(1.1); }
  }
  
  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes gridMove {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`;
document.head.appendChild(style);

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
            ? 'linear-gradient(135deg, #0f1419 0%, #1a2332 25%, #2d3748 50%, #1a365d 75%, #2c5282 100%)'
            : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 20%, #e2e8f0 40%, #cbd5e0 60%, #a0aec0 80%, #718096 100%)'
      }}
    >
      {/* Mining Equipment Silhouettes */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -150,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.2 : 0.1,
          transform: 'scaleX(-1) rotate(-5deg)',
          filter: 'grayscale(0.3) brightness(1.2)',
          animation: 'float 6s ease-in-out infinite'
        }}
      >
        <Image src="/assets/images/equipment/SK200-10.png" alt="Excavator" width={500} height={400} style={{ objectFit: 'contain' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: -60,
          right: -120,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.18 : 0.09,
          transform: 'rotate(3deg)',
          filter: 'grayscale(0.2) brightness(1.1)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      >
        <Image src="/assets/images/equipment/FVZ285.png" alt="Dump Truck" width={450} height={350} style={{ objectFit: 'contain' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '-100',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.15 : 0.07,
          transform: 'rotate(-15deg)',
          filter: 'grayscale(0.4) brightness(1.3)',
          animation: 'float 10s ease-in-out infinite'
        }}
      >
        <Image src="/assets/images/equipment/330D.png" alt="Bulldozer" width={400} height={300} style={{ objectFit: 'contain' }} />
      </Box>

      {/* Mining Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${
            theme.palette.mode === ThemeMode.DARK ? 'ffffff' : '000000'
          }' fill-opacity='0.02'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.4 : 0.15,
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />

      {/* Animated Grid Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(${
            theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
          } 1px, transparent 1px), linear-gradient(90deg, ${
            theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
          } 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      />

      {/* Geometric Mining Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0) 70%)'
              : 'radial-gradient(circle, rgba(255,193,7,0.25) 0%, rgba(255,193,7,0) 70%)',
          filter: 'blur(60px)',
          animation: 'glow 4s ease-in-out infinite alternate'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: '65%',
          right: '12%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, rgba(76,175,80,0) 70%)'
              : 'radial-gradient(circle, rgba(76,175,80,0.22) 0%, rgba(76,175,80,0) 70%)',
          filter: 'blur(50px)',
          animation: 'glow 5s ease-in-out infinite alternate reverse'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          left: '18%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0) 70%)'
              : 'radial-gradient(circle, rgba(33,150,243,0.18) 0%, rgba(33,150,243,0) 70%)',
          filter: 'blur(55px)',
          animation: 'glow 6s ease-in-out infinite alternate'
        }}
      />

      {/* Mining Hexagon Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '20%',
          width: 120,
          height: 120,
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          background: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.08)' : 'rgba(255,193,7,0.15)',
          animation: 'rotate 20s linear infinite',
          filter: 'blur(2px)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '35%',
          left: '25%',
          width: 80,
          height: 80,
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          background: theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.15)',
          animation: 'rotate 15s linear infinite reverse',
          filter: 'blur(1px)'
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
          top: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.25 : 0.12,
          animation: 'floatUp 8s ease-in-out infinite'
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', md: '10rem' },
            fontWeight: 900,
            color: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.08)' : 'rgba(255,193,7,0.15)',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            textTransform: 'uppercase',
            background: `linear-gradient(135deg, ${
              theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.2)'
            } 0%, ${theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.2)'} 50%, ${
              theme.palette.mode === ThemeMode.DARK ? 'rgba(33,150,243,0.1)' : 'rgba(33,150,243,0.2)'
            } 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'blur(1px)'
          }}
        >
          Mining
        </Typography>
      </Box>

      {/* Heavy Equipment Text */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.2 : 0.1,
          animation: 'floatUp 10s ease-in-out infinite reverse'
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 800,
            color: theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.15)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            textTransform: 'uppercase',
            transform: 'rotate(-5deg)'
          }}
        >
          Heavy Equipment
        </Typography>
      </Box>

      {/* Safety First Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.8 : 0.6,
          animation: 'pulse 3s ease-in-out infinite'
        }}
      >
        <Card
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.2)',
            backdropFilter: 'blur(15px)',
            border: `1px solid ${theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.3)' : 'rgba(255,193,7,0.4)'}`,
            borderRadius: '50px',
            px: 4,
            py: 1.5,
            boxShadow: `0 8px 32px ${theme.palette.mode === ThemeMode.DARK ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.3)'}`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h5" color="warning.main" fontWeight="bold" sx={{ animation: 'bounce 2s infinite' }}>
              ⚠️
            </Typography>
            <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>
              SAFETY FIRST
            </Typography>
          </Stack>
        </Card>
      </Box>

      {/* 24/7 Operations Badge */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '8%',
          right: '5%',
          opacity: theme.palette.mode === ThemeMode.DARK ? 0.7 : 0.5,
          animation: 'pulse 4s ease-in-out infinite reverse'
        }}
      >
        <Card
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.2)',
            backdropFilter: 'blur(15px)',
            border: `1px solid ${theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.4)'}`,
            borderRadius: '50px',
            px: 3,
            py: 1,
            boxShadow: `0 6px 24px ${theme.palette.mode === ThemeMode.DARK ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.3)'}`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              🕒
            </Typography>
            <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
              24/7 OPERATIONS
            </Typography>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};

export default MiningAuthBackground;
