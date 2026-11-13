'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { Alert, Box } from '@mui/material';

import RekapRitaseFormView from 'views/operational/mining/rekap-ritase/create';

// ==============================|| EDIT REKAP RITASE PAGE ||============================== //

const REQUIRED_KEYS = ['date_ops', 'shift_id', 'excavator_id', 'startpit_id', 'material_id'];

export default function EditRekapRitasePage() {
  const searchParams = useSearchParams();

  // Kunci grup diambil dari query string. Nilai kosong berarti tautan rusak
  // dan halaman tidak boleh menampilkan form kosong yang menyesatkan.
  const group = useMemo(() => {
    const read = (k) => searchParams?.get(k) || '';
    return {
      date_ops: read('date_ops'),
      shift_id: read('shift_id'),
      excavator_id: read('excavator_id'),
      startpit_id: read('startpit_id'),
      material_id: read('material_id'),
      bisnis_id: read('bisnis_id'),
      penyewa_id: read('penyewa_id'),
      fleet_name: read('fleet_name')
    };
  }, [searchParams]);

  const missing = REQUIRED_KEYS.filter((k) => !group[k]);

  if (missing.length > 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Tautan ubah tidak lengkap. Parameter hilang: <code>{missing.join(', ')}</code>. Kembali ke daftar rekap lalu
          pilih tombol ubah pada baris yang diinginkan.
        </Alert>
      </Box>
    );
  }

  return <RekapRitaseFormView mode="edit" group={group} />;
}
