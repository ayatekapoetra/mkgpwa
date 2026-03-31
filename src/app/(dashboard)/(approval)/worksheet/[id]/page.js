"use client";

import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

export default function ApprovalWorksheetDetail() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const worksheetData = useMemo(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }, [searchParams]);

  const handleApprove = async () => {
    setLoading(true);
    // TODO: panggil API approve jika sudah tersedia
    setLoading(false);
    setShowApprove(false);
    router.back();
  };

  const handleReject = async () => {
    setLoading(true);
    // TODO: panggil API reject jika sudah tersedia
    setLoading(false);
    setShowReject(false);
    router.back();
  };

  return (
    <Box p={2} maxWidth={900} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Detail Worksheet #{id}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="error" onClick={() => setShowReject(true)} disabled={loading}>
            Tolak
          </Button>
          <Button variant="contained" onClick={() => setShowApprove(true)} disabled={loading}>
            Setujui
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <DetailRow label="Tanggal" value={worksheetData?.tanggal || '-'} />
            <DetailRow label="Crew" value={worksheetData?.crew?.nama || '-'} />
            <DetailRow label="Supervisor" value={worksheetData?.supervisor?.nama || '-'} />
            <DetailRow label="Cabang" value={worksheetData?.cabang?.nama || '-'} />
            <DetailRow label="Status" value={worksheetData?.status || 'PENDING'} />
            <DetailRow label="Keterangan" value={worksheetData?.keterangan || '-'} />
            <DetailRow label="Jam Mulai" value={worksheetData?.jam_mulai || '-'} />
            <DetailRow label="Jam Selesai" value={worksheetData?.jam_selesai || '-'} />
            <DetailRow label="Istirahat Mulai" value={worksheetData?.istirahat_mulai || '-'} />
            <DetailRow label="Istirahat Selesai" value={worksheetData?.istirahat_selesai || '-'} />
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={showApprove} onClose={() => setShowApprove(false)}>
        <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menyetujui worksheet ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApprove(false)}>Batal</Button>
          <Button onClick={handleApprove} disabled={loading} variant="contained">Setujui</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showReject} onClose={() => setShowReject(false)}>
        <DialogTitle>Konfirmasi Penolakan</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menolak worksheet ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReject(false)}>Batal</Button>
          <Button onClick={handleReject} disabled={loading} color="error" variant="contained">Tolak</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" textAlign="right">{value}</Typography>
    </Stack>
  );
}
