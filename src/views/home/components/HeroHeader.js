'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import { Hierarchy3, Refresh, Calendar, Building } from 'iconsax-react';
import moment from 'moment';
import { useCabang } from 'api/cabang';

export default function HeroHeader({ filters, setFilters, lastUpdated, onRefresh }) {
  const theme = useTheme();
  const { data: cabangList = [], dataLoading } = useCabang();

  const selectedCabang = cabangList.find((c) => String(c.id) === String(filters.cabang_id)) || null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.75 },
        borderRadius: 2.5,
        borderColor: alpha(theme.palette.primary.main, 0.2),
        background: `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.info.main, 0.08)} 40%, ${theme.palette.background.paper} 78%)`
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.75} alignItems="center">
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              color: 'primary.main'
            }}
          >
            <Hierarchy3 size={28} variant="Bold" />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={800}>
              Operations Command Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ringkasan real-time produksi, maintenance, SDM, purchasing & finance
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" color="success" variant="light" label="Live data" />
              <Chip
                size="small"
                variant="outlined"
                label={moment(filters.date_ops).format('dddd, DD MMM YYYY')}
              />
              {lastUpdated ? (
                <Chip size="small" variant="outlined" label={`Update ${moment(lastUpdated).format('HH:mm:ss')}`} />
              ) : null}
            </Stack>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ minWidth: { lg: 520 } }}
        >
          <TextField
            size="small"
            type="date"
            label="Tanggal Ops"
            value={filters.date_ops}
            onChange={(e) => {
              const date_ops = e.target.value;
              setFilters((prev) => ({
                ...prev,
                date_ops,
                end_date: date_ops,
                endmonth: moment(date_ops).format('YYYY-MM')
              }));
            }}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                  <Calendar size={16} />
                </Box>
              )
            }}
            sx={{ minWidth: 170 }}
          />

          <Autocomplete
            size="small"
            options={cabangList}
            loading={dataLoading}
            value={selectedCabang}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, cabang_id: val?.id || '' }))}
            getOptionLabel={(o) => o?.nama || ''}
            isOptionEqualToValue={(a, b) => a?.id === b?.id}
            sx={{ minWidth: 220, flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cabang"
                placeholder="Semua cabang"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Box sx={{ ml: 1, mr: 0.5, display: 'flex', color: 'text.secondary' }}>
                        <Building size={16} />
                      </Box>
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          <Button
            variant="contained"
            startIcon={<Refresh size={16} />}
            onClick={onRefresh}
            sx={{ whiteSpace: 'nowrap', borderRadius: 1.5 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
