'use client';

import {
  Box,
  Stack,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { TickCircle, CloseCircle, Hierarchy } from 'iconsax-react';

import { PERMISSION_KEYS, CRUD_KEYS, WORKFLOW_KEYS } from './permission-config';

function setAllFlags(accessItem, keys, value) {
  const next = { ...accessItem };
  keys.forEach((k) => {
    next[k] = value;
  });
  return next;
}

export default function PermissionMatrix({ access = [], onChange }) {
  const theme = useTheme();

  const updateFlag = (idx, key, checked) => {
    const updated = access.map((item, i) => (i === idx ? { ...item, [key]: checked ? 'Y' : 'N' } : item));
    onChange(updated);
  };

  const bulkOnCard = (idx, keys, value) => {
    const updated = access.map((item, i) => (i === idx ? setAllFlags(item, keys, value) : item));
    onChange(updated);
  };

  if (!access.length) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
          borderStyle: 'dashed',
          bgcolor: alpha(theme.palette.secondary.main, 0.03)
        }}
      >
        <Hierarchy size={36} color={theme.palette.text.disabled} />
        <Typography variant="h6" sx={{ mt: 1.5 }}>
          Belum ada menu dipilih
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pilih satu atau lebih submenu di atas untuk mengatur permission.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={1}>
        <Box>
          <Typography variant="h6">Matriks Permission</Typography>
          <Typography variant="caption" color="text.secondary">
            {access.length} submenu · toggle flag CRUD & workflow
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {PERMISSION_KEYS.map((p) => (
            <Chip
              key={p.key}
              size="small"
              color={p.color}
              variant="outlined"
              label={`${p.short} = ${p.label}`}
              sx={{ height: 24, fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' }
        }}
      >
        {access.map((item, idx) => {
          const activeCount = PERMISSION_KEYS.filter((p) => item[p.key] === 'Y').length;
          const menuName = item.submenu?.menu?.name || item.submenu?.menu?.title || 'Menu';
          const subName = item.submenu?.name || '-';

          return (
            <Paper
              key={item.submenu?.id || idx}
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                borderColor: activeCount ? alpha(theme.palette.primary.main, 0.25) : 'divider',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.45),
                  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
                }
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${theme.palette.background.paper} 80%)`,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {subName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {menuName}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={activeCount ? 'primary' : 'default'}
                    label={`${activeCount}/${PERMISSION_KEYS.length}`}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                  <Button size="small" variant="outlined" color="success" onClick={() => bulkOnCard(idx, CRUD_KEYS, 'Y')} sx={{ minWidth: 0, px: 1 }}>
                    All CRUD
                  </Button>
                  <Button size="small" variant="outlined" color="primary" onClick={() => bulkOnCard(idx, WORKFLOW_KEYS, 'Y')} sx={{ minWidth: 0, px: 1 }}>
                    All Flow
                  </Button>
                  <Button size="small" variant="text" color="secondary" onClick={() => bulkOnCard(idx, PERMISSION_KEYS.map((p) => p.key), 'N')} sx={{ minWidth: 0, px: 1 }}>
                    Clear
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.4 }}>
                  CRUD
                </Typography>
                <Stack sx={{ mt: 0.5 }}>
                  {PERMISSION_KEYS.filter((p) => CRUD_KEYS.includes(p.key)).map((p) => (
                    <PermissionSwitch
                      key={p.key}
                      perm={p}
                      checked={item[p.key] === 'Y'}
                      onChange={(checked) => updateFlag(idx, p.key, checked)}
                    />
                  ))}
                </Stack>

                <Divider sx={{ my: 1.25 }} />

                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.4 }}>
                  WORKFLOW
                </Typography>
                <Stack sx={{ mt: 0.5 }}>
                  {PERMISSION_KEYS.filter((p) => WORKFLOW_KEYS.includes(p.key)).map((p) => (
                    <PermissionSwitch
                      key={p.key}
                      perm={p}
                      checked={item[p.key] === 'Y'}
                      onChange={(checked) => updateFlag(idx, p.key, checked)}
                    />
                  ))}
                </Stack>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}

function PermissionSwitch({ perm, checked, onChange }) {
  return (
    <FormControlLabel
      sx={{
        m: 0,
        py: 0.35,
        px: 0.5,
        borderRadius: 1,
        justifyContent: 'space-between',
        width: '100%',
        ml: 0,
        mr: 0,
        '&:hover': { bgcolor: 'action.hover' },
        '& .MuiFormControlLabel-label': { flex: 1 }
      }}
      labelPlacement="start"
      control={<Switch size="small" checked={checked} onChange={(e) => onChange(e.target.checked)} color={perm.color === 'secondary' ? 'secondary' : perm.color} />}
      label={
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={perm.description}>
            <Chip
              size="small"
              label={perm.short}
              color={checked ? perm.color : 'default'}
              variant={checked ? 'filled' : 'outlined'}
              sx={{ height: 22, minWidth: 34, fontWeight: 700, fontSize: 11 }}
            />
          </Tooltip>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {perm.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {perm.description}
            </Typography>
          </Box>
          {checked ? <TickCircle size={14} color="currentColor" variant="Bold" /> : <CloseCircle size={14} style={{ opacity: 0.35 }} />}
        </Stack>
      }
    />
  );
}
