'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';

import {
  Activity,
  Building4,
  Chart21,
  CloseCircle,
  HambergerMenu,
  Logout,
  ProfileCircle,
  PresentionChart
} from 'iconsax-react';

const NAV_ITEMS = [
  {
    id: 'event-history',
    label: 'Event History',
    href: '/customers/event-history',
    icon: Activity
  },
  {
    id: 'operating-history',
    label: 'Operating History',
    href: '/customers/operating-history',
    icon: Chart21
  },
  {
    id: 'productivity-equipment',
    label: 'Productivity Equipment',
    href: '/customers/productivity',
    icon: PresentionChart
  },
  {
    id: 'update-profile',
    label: 'Update Profile',
    href: '/customers/profile',
    icon: ProfileCircle
  }
];

export default function CustomersNavBar() {
  const theme = useTheme();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const pelangganNama = session?.pelanggan_nama || session?.nama || session?.name || 'Pelanggan';

  const handleLogout = async () => {
    // Avoid NextAuth resolving callbackUrl against baked NEXTAUTH_URL (often localhost).
    await signOut({ redirect: false });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${origin}/login-customers`;
  };

  const isActive = (href) => {
    if (!href || href === '#') return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavLink = ({ item, fullWidth = false }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Button
        component={Link}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        startIcon={<Icon size={18} variant={active ? 'Bold' : 'Outline'} />}
        fullWidth={fullWidth}
        sx={{
          justifyContent: fullWidth ? 'flex-start' : 'center',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: active ? 700 : 600,
          color: active ? 'primary.main' : 'text.primary',
          bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08)
          }
        }}
      >
        {item.label}
      </Button>
    );
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 1 }}>
            <Stack
              component={Link}
              href="/customers"
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{
                flexGrow: { xs: 1, md: 0 },
                mr: { md: 2 },
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 2,
                px: 0.5,
                py: 0.25,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                }
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #1565c0, #00897b)',
                  color: '#fff'
                }}
              >
                <Building4 size={20} variant="Bold" />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Portal Pelanggan
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {pelangganNama}
                </Typography>
              </Box>
            </Stack>

            {!isMobile && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexGrow: 1 }}>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              {isMobile ? (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setMobileOpen(true)}
                  aria-label="open menu"
                >
                  <HambergerMenu size={22} />
                </IconButton>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<Logout size={16} />}
                  onClick={handleLogout}
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                >
                  Logout
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: { width: 300, p: 1.5 }
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Menu
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseCircle size={20} />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ px: 1, pb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Masuk sebagai
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {pelangganNama}
          </Typography>
        </Box>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <ListItemButton
                key={item.id}
                component={Link}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                selected={active}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon size={18} variant={active ? 'Bold' : 'Outline'} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14 }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Divider sx={{ my: 1.5 }} />
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<Logout size={16} />}
          onClick={handleLogout}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
        >
          Logout
        </Button>
      </Drawer>
    </>
  );
}
