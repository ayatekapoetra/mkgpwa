'use client';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

// PROJECT IMPORTS
import MiningAuthCard from 'sections/auth/MiningAuthCard';
import AuthLogin from 'sections/auth/auth-forms/AuthLogin';

// ASSETS
import { Building } from 'iconsax-react';

// ================================|| MINIMAL MINING LOGIN ||================================ //

const MinimalMiningLogin = () => {
  const theme = useTheme();

  return (
    <MiningAuthCard>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          overflow: 'hidden',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, sm: 6, md: 8 }
        }}
      >
        {/* Abstract Background Shapes */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '5%', md: '10%' },
            left: { xs: '5%', md: '10%' },
            width: { xs: '120px', md: '200px' },
            height: { xs: '120px', md: '200px' },
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'floatShape 8s ease-in-out infinite',
            display: { xs: 'none', md: 'block' }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: '10%', md: '15%' },
            right: { xs: '10%', md: '15%' },
            width: { xs: '100px', md: '150px' },
            height: { xs: '100px', md: '150px' },
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            filter: 'blur(30px)',
            animation: 'floatShape 10s ease-in-out infinite reverse',
            display: { xs: 'none', md: 'block' }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '70%', md: '60%' },
            left: { xs: '80%', md: '70%' },
            width: { xs: '80px', md: '100px' },
            height: { xs: '80px', md: '100px' },
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            animation: 'floatShape 12s ease-in-out infinite',
            display: { xs: 'none', md: 'block' }
          }}
        />

        {/* Main Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: { xs: '100%', sm: '400px', md: '420px' },
            mx: 'auto'
          }}
        >
          {/* Logo Section */}
          <Box
            sx={{
              textAlign: 'center',
              mb: { xs: 3, md: 4 },
              px: { xs: 1, sm: 0 }
            }}
          >
            <Avatar
              sx={{
                width: { xs: 70, md: 80 },
                height: { xs: 70, md: 80 },
                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 50%, #FF5722 100%)',
                mx: 'auto',
                mb: { xs: 1.5, md: 2 },
                boxShadow: '0 8px 32px rgba(255, 193, 7, 0.3)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Building size={36} color="#FFFFFF" />
            </Avatar>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 50%, #FF5722 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2
              }}
            >
              Mining ERP
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              Welcome back to your operations dashboard
            </Typography>
          </Box>

          {/* Login Form Card */}
          <Card
            sx={{
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: { xs: '16px', md: '20px' },
              boxShadow: theme.palette.mode === 'dark' ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 20px 40px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {/* Auth Login Form */}
              <AuthLogin />
            </CardContent>
          </Card>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: { xs: 2.5, md: 3 } }}>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                fontSize: { xs: '0.75rem', md: '0.8125rem' }
              }}
            >
              © 2024 Mining ERP Solutions • 24/7 Support
            </Typography>
          </Box>
        </Box>

        {/* Custom Animations */}
        <style jsx global>{`
          @keyframes floatShape {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
            }
            33% {
              transform: translateY(-10px) rotate(2deg);
            }
            66% {
              transform: translateY(5px) rotate(-2deg);
            }
          }
        `}</style>
      </Box>
    </MiningAuthCard>
  );
};

export default MinimalMiningLogin;
