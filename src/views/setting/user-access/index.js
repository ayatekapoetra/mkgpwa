'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Add, ShieldTick, Profile2User, Key, TickCircle } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import IconButton from 'components/@extended/IconButton';
import CircularLoader from 'components/CircularLoader';
import { APP_DEFAULT_PATH } from 'config';
import ListDom from './list';
import FilterDom from './filter';
import { countActivePerms } from './permission-config';
import { useGetUserAccess } from 'api/menu';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Setting', to: '#' },
  { title: 'User Access', to: '/user-access' }
];

function StatCard({ icon, label, value, color = 'primary', loading }) {
  const theme = useTheme();
  const palette = theme.palette[color] || theme.palette.primary;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(palette.main, 0.12)} 0%, ${theme.palette.background.paper} 70%)`,
        borderColor: alpha(palette.main, 0.2)
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(palette.main, 0.14),
            color: palette.main,
            flexShrink: 0
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={48} height={32} />
          ) : (
            <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
              {value}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

const PermissionScreen = () => {
  const theme = useTheme();
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    keyword: '',
    user_id: '',
    menu_id: '',
    submenu_id: '',
    page: 1,
    perPages: 25
  });

  const { data, dataLoading, dataError, dataEmpty } = useGetUserAccess(params);
  const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const stats = useMemo(() => {
    const userIds = new Set(rows.map((r) => r.user_id).filter(Boolean));
    const fullAccess = rows.filter((r) => countActivePerms(r) >= 4).length;
    const avgPerms =
      rows.length > 0 ? (rows.reduce((s, r) => s + countActivePerms(r), 0) / rows.length).toFixed(1) : '0';
    return {
      total: data?.total ?? rows.length,
      users: userIds.size,
      fullAccess,
      avgPerms
    };
  }, [rows, data]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (params.keyword) chips.push({ key: 'keyword', label: `Keyword: ${params.keyword}` });
    if (params.user_id) chips.push({ key: 'user_id', label: `User ID: ${params.user_id}` });
    if (params.menu_id) chips.push({ key: 'menu_id', label: `Menu ID: ${params.menu_id}` });
    if (params.submenu_id) chips.push({ key: 'submenu_id', label: `Submenu ID: ${params.submenu_id}` });
    return chips;
  }, [params]);

  const clearFilter = (key) => {
    setParams((prev) => ({ ...prev, [key]: '', page: 1 }));
  };

  if (dataError) {
    return (
      <MainCard>
        <Stack spacing={1} alignItems="center" py={6}>
          <Typography variant="h5" color="error">
            Gagal memuat data user access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Periksa koneksi atau coba muat ulang halaman.
          </Typography>
        </Stack>
      </MainCard>
    );
  }

  return (
    <>
      <Breadcrumbs custom heading="User Access" links={breadcrumbLinks} />

      <Stack spacing={2.5}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${theme.palette.background.paper} 60%)`,
            borderColor: alpha(theme.palette.primary.main, 0.18)
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                  color: 'primary.main'
                }}
              >
                <ShieldTick size={26} variant="Bold" />
              </Box>
              <Box>
                <Typography variant="h4">Hak Akses Menu</Typography>
                <Typography variant="body2" color="text.secondary">
                  Kelola permission per user × submenu (CRUD + workflow)
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              component={Link}
              href="/user-access/create"
              startIcon={<Add size={18} />}
              sx={{ borderRadius: 1.5, px: 2.5 }}
            >
              Tambah Privilege
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }
          }}
        >
          <StatCard
            loading={dataLoading}
            icon={<Key size={22} variant="Bold" />}
            label="Total Permission"
            value={stats.total}
            color="primary"
          />
          <StatCard
            loading={dataLoading}
            icon={<Profile2User size={22} variant="Bold" />}
            label="User Unik (halaman)"
            value={stats.users}
            color="info"
          />
          <StatCard
            loading={dataLoading}
            icon={<TickCircle size={22} variant="Bold" />}
            label="Akses Lengkap (≥4)"
            value={stats.fullAccess}
            color="success"
          />
          <StatCard
            loading={dataLoading}
            icon={<ShieldTick size={22} variant="Bold" />}
            label="Rata-rata Flag"
            value={stats.avgPerms}
            color="warning"
          />
        </Box>

        <MainCard
          title={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h5">Daftar Akses</Typography>
              {!dataLoading && (
                <Chip size="small" color="primary" variant="light" label={`${data?.total || 0} record`} />
              )}
            </Stack>
          }
          secondary={
            <IconButton
              color={openFilter || activeFilters.length ? 'primary' : 'secondary'}
              variant={openFilter || activeFilters.length ? 'light' : 'text'}
              onClick={() => setOpenFilter((v) => !v)}
              aria-label="filter"
            >
              <FilterListIcon />
            </IconButton>
          }
          content={false}
        >
          <FilterDom data={params} setData={setParams} open={openFilter} count={data?.total} onClose={() => setOpenFilter(false)} />

          {activeFilters.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ px: 2.5, pt: 2 }}>
              {activeFilters.map((f) => (
                <Chip key={f.key} size="small" label={f.label} onDelete={() => clearFilter(f.key)} />
              ))}
              <Chip
                size="small"
                variant="outlined"
                color="secondary"
                label="Reset semua"
                onClick={() =>
                  setParams({
                    keyword: '',
                    user_id: '',
                    menu_id: '',
                    submenu_id: '',
                    page: 1,
                    perPages: 25
                  })
                }
              />
            </Stack>
          )}

          {dataLoading ? (
            <Box sx={{ py: 8 }}>
              <CircularLoader />
            </Box>
          ) : dataEmpty ? (
            <Stack spacing={1.5} alignItems="center" py={8} px={2}>
              <ShieldTick size={40} color={theme.palette.text.disabled} />
              <Typography variant="h5">Belum ada data akses</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Tambahkan privilege untuk memberikan akses menu kepada user.
              </Typography>
              <Button variant="contained" component={Link} href="/user-access/create" startIcon={<Add size={18} />}>
                Tambah Privilege
              </Button>
            </Stack>
          ) : (
            <ListDom data={data} params={params} setParams={setParams} />
          )}
        </MainCard>
      </Stack>
    </>
  );
};

export default PermissionScreen;
