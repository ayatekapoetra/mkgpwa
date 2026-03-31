'use client';

import { useState } from 'react';

// NEXT
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

// ICONS
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ASSETS
const error404 = '/assets/images/maintenance/img-error-404.svg';

// ==============================|| ERROR 404 ||============================== //

function Error404Page() {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const commonSolutions = [
    { title: 'Check the URL', description: 'Make sure there are no typos in the address bar' },
    { title: 'Use Search', description: 'Try searching for what you are looking for' },
    { title: 'Go Back', description: 'Return to the previous page you were on' },
    { title: 'Visit Homepage', description: 'Start fresh from our home page' }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.secondary.light}10)`,
        pt: { xs: 2, md: 4 },
        pb: { xs: 1, md: 4 },
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Left Column - Error Illustration */}
        <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <ReportProblemIcon 
              sx={{ 
                fontSize: 80, 
                color: theme.palette.error.main,
                mb: 2,
                opacity: 0.9
              }} 
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '4rem', md: '6rem' },
                fontWeight: 800,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              404
            </Typography>
            <Typography 
              variant="h3" 
              color="textPrimary"
              sx={{ 
                fontWeight: 600,
                mb: 2
              }}
            >
              Oops! Page Not Found
            </Typography>
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{ 
                maxWidth: 400,
                mx: 'auto',
                mb: 3
              }}
            >
              The page you are looking for might have been removed, had its name changed, 
              or is temporarily unavailable.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              component={Link}
              href="/home"
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              sx={{ px: 3, py: 1 }}
            >
              Go to Home
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ px: 3, py: 1 }}
            >
              Go Back
            </Button>
          </Stack>
        </Grid>

        {/* Right Column - Help and Solutions */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3}
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h5" 
                fontWeight={600} 
                gutterBottom
                color="textPrimary"
              >
                What can you do?
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Solutions List */}
              <Stack spacing={2.5}>
                {commonSolutions.map((solution, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        bgcolor: `${theme.palette.primary.main}15`,
                        color: theme.palette.primary.main
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {solution.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {solution.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>

              {/* Search Bar */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                  Quick Search
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleSearch}
                  sx={{ 
                    display: 'flex',
                    gap: 1,
                    mb: 3
                  }}
                >
                  <Box sx={{ flexGrow: 1, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search our site..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 44px',
                        borderRadius: theme.shape.borderRadius,
                        border: `1px solid ${theme.palette.divider}`,
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        '&:focus': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    />
                    <SearchIcon 
                      sx={{ 
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: theme.palette.text.secondary,
                        fontSize: 20
                      }} 
                    />
                  </Box>
                  <Button 
                    type="submit"
                    variant="contained"
                    sx={{ px: 3 }}
                  >
                    Search
                  </Button>
                </Box>
              </Box>

              {/* Support Info */}
              <Alert 
                severity="info" 
                icon={<RefreshIcon />}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <AlertTitle>Still can't find what you need?</AlertTitle>
                <Typography variant="body2">
                  Contact our support team or try refreshing the page. Sometimes the issue 
                  might be temporary.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Error404Page;
