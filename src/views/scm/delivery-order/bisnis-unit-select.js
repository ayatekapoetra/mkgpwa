'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useGetBisnisUnit } from 'api/bisnis-unit';
import InputSkeleton from 'components/InputSkeleton';
import SelectForm from 'components/SelectForm';

export default function BisnisUnitSelect(props) {
  const { bisnisUnit, bisnisUnitLoading, bisnisUnitError } = useGetBisnisUnit();

  if (bisnisUnitLoading) return <InputSkeleton height={56} />;
  if (bisnisUnitError) return <Alert severity="error">Gagal memuat pilihan Bisnis Unit.</Alert>;

  const options = bisnisUnit.rows.map((unit) => ({
    key: unit.id,
    teks: (
      <Stack component="span" sx={{ whiteSpace: 'normal' }}>
        <Typography component="span" variant="caption" color="text.secondary">
          {unit.initial || '-'}
        </Typography>
        <Typography component="span" variant="body1" sx={{ fontWeight: 700 }}>
          {unit.name || '-'}
        </Typography>
      </Stack>
    )
  }));

  return <SelectForm {...props} label="Bisnis Unit" labelId="bisnis-unit" name="bisnis_id" array={options} />;
}
