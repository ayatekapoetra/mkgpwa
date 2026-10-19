'use client';

import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { Box1 } from 'iconsax-react';
import SectionCard from './SectionCard';
import { formatCurrency, formatNumber, normalizeHighCostParts } from '../utils';

export default function SparepartSection({ sparepart }) {
  const topParts = useMemo(() => normalizeHighCostParts(sparepart), [sparepart]);
  const resources = [sparepart?.partTopHe, sparepart?.partTopDt, sparepart?.partTopMd, sparepart?.partTopAd];
  const colors = { HE: 'success', DT: 'primary', MD: 'warning', AD: 'secondary' };

  return (
    <SectionCard title="High Cost Parts" subtitle="Top 8 nilai pemakaian · HE / DT / MD / AD" icon={<Box1 size={20} variant="Bold" />}
      loading={resources.some((resource) => resource?.loading)} error={resources.some((resource) => resource?.error)}
      actionHref="/panel/sparepart-used" color="secondary" minHeight={420}>
      {topParts.length ? (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {topParts.map((part, index) => (
            <Stack key={part.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 18 }}>{String(index + 1).padStart(2, '0')}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} title={part.name} noWrap>{part.name}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip size="small" variant="light" color={colors[part.category]} label={part.category} sx={{ height: 20, fontSize: 10 }} />
                    <Typography variant="caption" color="text.secondary">Qty {formatNumber(part.qty, 2)}</Typography>
                  </Stack>
                </Box>
              </Stack>
              <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>{formatCurrency(part.value)}</Typography>
            </Stack>
          ))}
        </Stack>
      ) : <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>Belum ada data sparepart bernilai tinggi</Typography>}
    </SectionCard>
  );
}
