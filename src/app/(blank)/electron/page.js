'use client';

// MATERIAL - UI
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Devices, Settings } from 'iconsax-react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';

// NEXT
import Link from 'next/link';

export default function ElectronPage() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', p: 2 }} spacing={3}>
      <Grid item xs={12}>
        <Stack justifyContent="center" alignItems="center" spacing={2}>
          <Devices size={downSM ? 60 : 80} color="#4CAF50" />
          <Typography align="center" variant={downSM ? 'h2' : 'h1'} sx={{ fontWeight: 'bold' }}>
            MKG Electron App
          </Typography>
          <Typography color="textSecondary" variant="h6" align="center">
            Desktop Application Environment
          </Typography>
        </Stack>
      </Grid>

      <Grid item xs={12} sx={{ width: '100%', maxWidth: 600 }}>
        <Card sx={{ boxShadow: theme.shadows[10] }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                <Typography variant="h6">System Status</Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SpeedIcon sx={{ color: '#2196F3' }} />
                  <Typography variant="body1">Platform: Desktop (Electron)</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Settings size={20} color="#FF9800" />
                  <Typography variant="body1">Framework: Next.js 14</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Devices size={20} color="#9C27B0" />
                  <Typography variant="body1">UI: Material-UI + Tailwind CSS</Typography>
                </Box>
              </Stack>

              <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  This application is running in Electron desktop environment with full offline capabilities.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button 
            component={Link} 
            href="/home" 
            variant="contained" 
            size="large"
            sx={{ textTransform: 'none', minWidth: 150 }}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            component={Link} 
            href="/login" 
            variant="outlined" 
            size="large"
            sx={{ textTransform: 'none', minWidth: 150 }}
          >
            Login Page
          </Button>
          
          <Button 
            component={Link} 
            href="/simple-page" 
            variant="text" 
            size="large"
            sx={{ textTransform: 'none', minWidth: 150 }}
          >
            Simple Test
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="caption" color="textSecondary" align="center" sx={{ display: 'block' }}>
          Version 1.0.0 | Electron Desktop Application
        </Typography>
      </Grid>
    </Grid>
  );
}