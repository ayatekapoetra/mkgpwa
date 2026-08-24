'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import AuthLoginCustomers from 'sections/auth/auth-forms/AuthLoginCustomers';

import {
  Building4,
  Chart21,
  DocumentText,
  Lock1,
  SecuritySafe,
  ShieldTick
} from 'iconsax-react';

const highlights = [
  {
    icon: DocumentText,
    title: 'Laporan Real-time',
    desc: 'Pantau ringkasan operasional dan status unit secara terkini.'
  },
  {
    icon: Chart21,
    title: 'Insight Produktivitas',
    desc: 'Akses metrik performa yang relevan untuk bisnis Anda.'
  },
  {
    icon: SecuritySafe,
    title: 'Akses Aman',
    desc: 'Portal khusus pelanggan dengan autentikasi terpisah.'
  }
];

const LoginCustomers = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? 'radial-gradient(1200px 600px at 10% -10%, rgba(25,118,210,0.25), transparent 55%), radial-gradient(900px 500px at 90% 110%, rgba(0,150,136,0.18), transparent 50%), #0b1220'
          : 'radial-gradient(1200px 600px at 8% -8%, rgba(25,118,210,0.14), transparent 55%), radial-gradient(900px 500px at 100% 100%, rgba(0,150,136,0.10), transparent 50%), linear-gradient(180deg, #f7fafc 0%, #eef3f8 100%)'
      }}
    >
      {/* Left brand panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          position: 'relative',
          color: '#fff',
          background: 'linear-gradient(145deg, #0d47a1 0%, #1565c0 42%, #00897b 100%)',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), transparent 35%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            right: -60,
            top: -40
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.10)',
            right: 40,
            bottom: 80
          }}
        />

        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            icon={<ShieldTick size={16} color="#fff" />}
            label="Customer Portal"
            sx={{
              alignSelf: 'flex-start',
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.2)',
              '& .MuiChip-icon': { color: '#fff' }
            }}
          />
          <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.15, maxWidth: 460 }}>
            Selamat datang di Portal Pelanggan MKG
          </Typography>
          <Typography sx={{ opacity: 0.9, maxWidth: 440, fontSize: '1.05rem', lineHeight: 1.7 }}>
            Satu pintu untuk memantau laporan operasional, status unit, dan informasi penting
            terkait layanan Anda.
          </Typography>
        </Stack>

        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1, mt: 6 }}>
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Stack
                key={item.title}
                direction="row"
                spacing={2}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.16)'
                  }}
                >
                  <Icon size={22} color="#fff" variant="Bold" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, mb: 0.25 }}>{item.title}</Typography>
                  <Typography sx={{ opacity: 0.88, fontSize: '0.92rem' }}>{item.desc}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, opacity: 0.75 }}>
          © {new Date().getFullYear()} Makkuraga Tama · Akses terbatas untuk pelanggan terdaftar
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, md: 6 }
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 460,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            boxShadow: isDark
              ? '0 20px 50px rgba(0,0,0,0.45)'
              : '0 18px 50px rgba(15, 23, 42, 0.08)',
            bgcolor: isDark ? alpha('#111827', 0.85) : '#fff',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            <Stack spacing={1.25} sx={{ mb: 3.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, #1565c0, #00897b)',
                    color: '#fff'
                  }}
                >
                  <Building4 size={24} variant="Bold" />
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Login Pelanggan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Masuk untuk melanjutkan ke dashboard
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                mb: 3,
                p: 1.75,
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.info.main, isDark ? 0.12 : 0.08),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Lock1 size={18} color={theme.palette.info.main} style={{ marginTop: 2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
                    Gunakan akun portal pelanggan
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
                    Username dari akun customers Anda. Password mengikuti kode pelanggan yang telah
                    ditetapkan sistem.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <AuthLoginCustomers />

            <Divider sx={{ my: 3 }} />

            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Butuh bantuan akses? Hubungi admin MKG atau PIC operasional Anda.
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ textAlign: 'center', display: { xs: 'block', md: 'none' } }}
              >
                © {new Date().getFullYear()} Makkuraga Tama
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginCustomers;
