'use client';

import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PanelImages from './components/panel-images';
import PanelTeks from './components/panel-teks';

export default function ProduksiScreen() {
  const theme = useTheme();
  console.log('Themes', theme);

  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Stack direction={downSM ? 'column' : 'row'} spacing={2} sx={{ width: '100%', p: 2 }}>
      {/* Panel kiri */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        {/* Baris pertama */}
        <Stack direction={downSM ? 'column' : 'row'} spacing={2} sx={{ width: '100%' }}>
          <PanelImages
            illustartion="/assets/images/signages/alatberat.png"
            primary="Alat Berat"
            secondary="03"
            color="info.main"
            sx={{ flex: 1 }}
          />
          <PanelImages
            illustartion="/assets/images/signages/produksi.png"
            primary="Produksi"
            secondary="10K"
            color="primary.main"
            sx={{ flex: 1 }}
          />
        </Stack>

        {/* Baris kedua */}
        <Stack direction={downSM ? 'column' : 'row'} spacing={2} sx={{ width: '100%' }}>
          <PanelImages
            illustartion="/assets/images/signages/dumptruck.png"
            primary="DumpTruck"
            secondary="03"
            color="success.main"
            sx={{ flex: 1 }}
          />
          <PanelImages
            illustartion="/assets/images/signages/ritase.png"
            primary="Ritase"
            secondary="200"
            color="warning.main"
            sx={{ flex: 1 }}
          />
        </Stack>
      </Stack>

      {/* Panel kanan */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        <PanelTeks primary="Cumulative Ritase" secondary="" color="background.main" sx={{ width: '100%' }} />
        <PanelTeks primary="Cumulative Ritase" secondary="" color="background.main" sx={{ width: '100%' }} />
      </Stack>
    </Stack>
  );
}
