'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { ArrowDown2, ArrowLeft, Danger, DocumentText, Link2, Refresh, Send2, TickCircle, Timer1 } from 'iconsax-react';

import { openNotification } from 'api/notification';
import { requeueIntegrationIssue, useIntegrationIssue } from 'api/integration-issues';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { formatDateTime, getErrorMessage, SEVERITY_PRESENTATION, STATUS_PRESENTATION } from './presentation';

function Meta({ label, value }) {
  return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={650} sx={{ overflowWrap: 'anywhere' }}>{value || '-'}</Typography></Box>;
}

export default function IntegrationIssueDetailScreen({ issueId }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { issue, permissions, issueLoading, issueRefreshing, issueError, refreshIssue } = useIntegrationIssue(issueId);

  const submitRequeue = async () => {
    if (!reason.trim() || !confirmed) return;
    setSubmitting(true);
    try {
      await requeueIntegrationIssue(issueId, reason.trim());
      openNotification({ open: true, title: 'Berhasil', message: 'Integrasi dimasukkan kembali ke antrean', alert: { color: 'success' } });
      router.push('/integration-issues');
    } catch (error) {
      openNotification({ open: true, title: 'Gagal', message: getErrorMessage(error, 'Gagal melakukan requeue'), alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Integration Issues', to: '/integration-issues' },
    { title: issue?.document?.number || `#${issueId}` }
  ];

  if (issueLoading) {
    return <Stack spacing={2}><Skeleton variant="rounded" height={160} /><Skeleton variant="rounded" height={320} /></Stack>;
  }

  if (issueError || !issue) {
    return (
      <Fragment>
        <Breadcrumbs custom heading="Detail Integration Issue" links={breadcrumbs} />
        <MainCard>
          <Alert severity="info">{getErrorMessage(issueError, 'Issue tidak ditemukan atau sudah berhasil diselesaikan.')}</Alert>
          <Button component={Link} href="/integration-issues" sx={{ mt: 2 }} startIcon={<ArrowLeft size={18} />}>Kembali ke daftar</Button>
        </MainCard>
      </Fragment>
    );
  }

  const severity = SEVERITY_PRESENTATION[issue.severity] || { label: issue.severity, color: 'default' };
  const status = STATUS_PRESENTATION[issue.status] || { label: issue.status, color: 'default' };
  const canRequeue = permissions.can_requeue && issue.retry?.requeue_allowed;

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Integration Issue" links={breadcrumbs} />
      <Box
        sx={{
          mt: 1,
          mb: 3,
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          color: 'common.white',
          background: issue.severity === 'CRITICAL'
            ? 'linear-gradient(130deg, #450a0a, #991b1b 62%, #c2410c)'
            : 'linear-gradient(130deg, #172554, #1e3a8a 60%, #0f766e)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={3} position="relative" zIndex={1}>
          <Box>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 700 }} />
              <Chip label={severity.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,.16)', color: 'inherit' }} />
              <Chip label={`Outbox #${issue.id}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,.16)', color: 'inherit' }} />
            </Stack>
            <Typography variant="h2" color="inherit">{issue.title}</Typography>
            <Typography sx={{ mt: 1, opacity: 0.82, maxWidth: 760 }}>{issue.summary}</Typography>
          </Box>
          <Stack direction="row" alignItems="flex-start" gap={1}>
            <Button variant="outlined" color="inherit" disabled={issueRefreshing} onClick={() => refreshIssue()} startIcon={<Refresh size={18} />}>Refresh</Button>
            {canRequeue && <Button variant="contained" color="warning" onClick={() => setDialogOpen(true)} startIcon={<Send2 size={18} />}>Requeue</Button>}
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={2.5}>
            <MainCard title="Apa yang terjadi?">
              <Stack spacing={2}>
                <Box><Typography variant="subtitle1" fontWeight={700}>Penyebab</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{issue.explanation}</Typography></Box>
                <Divider />
                <Box><Typography variant="subtitle1" fontWeight={700}>Dampak</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{issue.impact}</Typography></Box>
              </Stack>
            </MainCard>

            <MainCard title="Langkah penyelesaian">
              <Stack spacing={0}>
                {(issue.resolution_steps || []).map((step, index) => (
                  <Stack key={`${step.title}-${index}`} direction="row" spacing={2} sx={{ position: 'relative', pb: index === issue.resolution_steps.length - 1 ? 0 : 3 }}>
                    {index < issue.resolution_steps.length - 1 && <Box sx={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, bgcolor: 'divider' }} />}
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: step.action_type === 'OPEN_MAPPING' ? 'warning.lighter' : 'primary.lighter', color: step.action_type === 'OPEN_MAPPING' ? 'warning.main' : 'primary.main', fontWeight: 800 }}>{index + 1}</Box>
                    <Box sx={{ pt: 0.25, flex: 1 }}>
                      <Typography fontWeight={700}>{step.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{step.description}</Typography>
                      {step.action_type === 'OPEN_MAPPING' && step.action_url && permissions.can_open_mapping && <Button component={Link} href={step.action_url} size="small" sx={{ mt: 1 }} startIcon={<Link2 size={16} />}>Buka mapping</Button>}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </MainCard>

            {issue.missing_mappings?.length > 0 && (
              <MainCard title={`Dependency mapping (${issue.missing_mappings.length})`}>
                <Stack spacing={1.25}>
                  {issue.missing_mappings.map((mapping, index) => (
                    <Card key={`${mapping.entity_type}-${mapping.source_id}-${index}`} variant="outlined" sx={{ bgcolor: 'warning.lighter' }}>
                      <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
                          <Box>
                            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={800}>{mapping.entity_type || 'ENTITY'}</Typography><Chip size="small" label={`Source ${mapping.source_code || mapping.source_id || '-'}`} /></Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Membutuhkan target {mapping.target_type || 'Accounting'} pada company issue ini.</Typography>
                          </Box>
                          {permissions.can_open_mapping
                            ? <Button component={Link} href={mapping.mapping_url} variant="contained" color="warning" startIcon={<Link2 size={17} />}>Buka Mapping</Button>
                            : <Chip label="Akses mapping diperlukan" size="small" variant="outlined" />}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </MainCard>
            )}

            <Accordion variant="outlined" sx={{ borderRadius: '12px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ArrowDown2 size={18} />}><Stack direction="row" alignItems="center" gap={1}><DocumentText size={19} /><Typography fontWeight={700}>Diagnostik teknis</Typography></Stack></AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><Meta label="Error code" value={issue.technical?.error_code} /></Grid>
                  <Grid item xs={12} sm={6}><Meta label="HTTP status" value={issue.last_http_status} /></Grid>
                  <Grid item xs={12} sm={6}><Meta label="Event ID" value={issue.technical?.event_id} /></Grid>
                  <Grid item xs={12} sm={6}><Meta label="Accounting job ID" value={issue.technical?.accounting_job_id} /></Grid>
                  <Grid item xs={12} sm={6}><Meta label="Aggregate" value={`${issue.technical?.aggregate_type || '-'} / ${issue.technical?.aggregate_id || '-'}`} /></Grid>
                  <Grid item xs={12} sm={6}><Meta label="Schema" value={`v${issue.technical?.schema_version || 1}`} /></Grid>
                  <Grid item xs={12}><Meta label="Pesan tersanitasi" value={issue.technical?.error_message} /></Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <MainCard title="Dokumen OPS">
              <Stack spacing={2}><Meta label="Nomor dokumen" value={issue.document?.number} /><Meta label="Source ID" value={issue.document?.id} /><Meta label="Jenis transaksi" value={issue.event?.label} /><Meta label="Nomor PO / sumber bisnis" value={issue.document?.business_source_number} /><Divider /><Meta label="Company" value={issue.organization?.company_code} /><Meta label="Business" value={issue.organization?.business_name || issue.organization?.business_id} /><Meta label="Cabang" value={issue.organization?.branch_name || issue.organization?.branch_code} /><Meta label="Counterparty" value={issue.counterparty?.name || issue.counterparty?.code} /></Stack>
            </MainCard>
            <MainCard title="Riwayat pengiriman">
              <Stack spacing={2}>
                <Stack direction="row" gap={1.5}><TickCircle size={20} color={themeColor('primary')} /><Meta label="Dibuat" value={formatDateTime(issue.created_at)} /></Stack>
                <Stack direction="row" gap={1.5}><Timer1 size={20} color={themeColor('warning')} /><Meta label="Percobaan terakhir" value={formatDateTime(issue.last_attempt_at)} /></Stack>
                <Stack direction="row" gap={1.5}><Danger size={20} color={themeColor('error')} /><Meta label="Jumlah percobaan" value={`${issue.attempts?.count || 0} dari ${issue.attempts?.max || 0}`} /></Stack>
                {issue.retry?.automatic && <Alert severity="warning">Retry berikutnya: {formatDateTime(issue.retry.next_attempt_at)}</Alert>}
              </Stack>
            </MainCard>
            {!permissions.can_requeue && issue.retry?.requeue_allowed && <Alert severity="info">Anda dapat melihat issue ini, tetapi tidak memiliki permission untuk requeue.</Alert>}
            {!permissions.can_open_mapping && issue.missing_mappings?.length > 0 && <Alert severity="info">Hubungi administrator yang memiliki akses Akunting Mapping untuk melengkapi dependency.</Alert>}
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Requeue integration #{issue.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Pastikan penyebab utama telah diselesaikan. Requeue tanpa remediation dapat menghasilkan kegagalan yang sama.</Alert>
          <TextField autoFocus required fullWidth multiline minRows={3} label="Alasan requeue" value={reason} onChange={(event) => setReason(event.target.value)} inputProps={{ maxLength: 800 }} helperText={`${reason.length}/800`} />
          <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label="Saya mengonfirmasi remediation telah dilakukan dan data boleh dikirim ulang." />
        </DialogContent>
        <DialogActions><Button disabled={submitting} onClick={() => setDialogOpen(false)}>Batal</Button><Button variant="contained" color="warning" disabled={!reason.trim() || !confirmed || submitting} onClick={submitRequeue}>{submitting ? 'Memproses...' : 'Konfirmasi Requeue'}</Button></DialogActions>
      </Dialog>
    </Fragment>
  );
}

function themeColor(name) {
  const colors = { primary: '#2563eb', warning: '#d97706', error: '#dc2626' };
  return colors[name];
}
