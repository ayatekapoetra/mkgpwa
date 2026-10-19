'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { Timer1 } from 'iconsax-react';
import SectionCard from './SectionCard';
import { formatNumber, normalizePrAging } from '../utils';

export default function PrAgingCard({ resource }) {
  const rows = normalizePrAging(resource?.data);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const colors = ['success', 'info', 'warning', 'error'];

  return (
    <SectionCard title="PR Aging" subtitle="Usia dokumen PR hingga tanggal terpilih" icon={<Timer1 size={20} variant="Bold" />}
      loading={resource?.loading} error={resource?.error} actionHref="/panel/purchasing-request" color="warning" minHeight={420}>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 0.5 }}>{formatNumber(total)}</Typography>
      <Typography variant="caption" color="text.secondary">Dokumen purchase request</Typography>
      {total > 0 ? (
        <Stack spacing={2.5} sx={{ mt: 3 }}>
          {rows.map((row, index) => (
            <Box key={row.label}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{formatNumber(row.count)}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={(row.count / total) * 100} color={colors[index] || 'primary'}
                sx={{ height: 7, borderRadius: 4 }} aria-label={`PR berusia ${row.label}`} />
            </Box>
          ))}
        </Stack>
      ) : <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Belum ada dokumen PR pada periode ini</Typography>}
    </SectionCard>
  );
}
