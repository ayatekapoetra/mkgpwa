'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import { useShowBreakdown, deleteBreakdown } from 'api/breakdown';
import moment from 'moment';
import Link from 'next/link';
import { useState } from 'react';

export default function BreakdownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { data, dataLoading, mutate } = useShowBreakdown(id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this breakdown?')) return;

    try {
      setDeleting(true);
      await deleteBreakdown(id);
      router.push('/breakdown');
    } catch (error) {
      alert('Failed to delete breakdown: ' + error.message);
      setDeleting(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      '0': { label: 'Open', color: 'warning' },
      '1': { label: 'In Progress', color: 'info' },
      '2': { label: 'Resolved', color: 'success' },
      '3': { label: 'Closed', color: 'default' },
      WT: { label: 'Wait Technician', color: 'warning' },
      WP: { label: 'Wait Part', color: 'error' },
      WS: { label: 'In Service', color: 'info' },
      DN: { label: 'Done', color: 'success' }
    };
    return statusMap[status] || { label: status || 'Unknown', color: 'default' };
  };

  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Typography variant="h5">Breakdown not found</Typography>
        <Button component={Link} href="/breakdown" startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  const statusInfo = getStatusLabel(data.status);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button component={Link} href="/breakdown" startIcon={<ArrowBack />} variant="outlined">
            Back
          </Button>
          <Typography variant="h4">Breakdown Detail</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Edit />} component={Link} href={`/breakdown/${id}/edit`}>
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="General Information"
              action={<Chip label={statusInfo.label} color={statusInfo.color} />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Kode
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {data.kode || `BD-${String(data.id).padStart(6, '0')}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Equipment
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {data.equipment?.kode || '-'}
                  </Typography>
                  <Typography variant="caption">{data.equipment?.nama}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Lokasi
                  </Typography>
                  <Typography variant="body1">{data.lokasi?.nama || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Cabang
                  </Typography>
                  <Typography variant="body1">
                    [{data.cabang?.kode}] {data.cabang?.nama || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Breakdown At
                  </Typography>
                  <Typography variant="body1">
                    {data.breakdown_at ? moment(data.breakdown_at, 'DD-MM-YYYY HH:mm').format('DD MMMM YYYY HH:mm') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Date Issue
                  </Typography>
                  <Typography variant="body1">
                    {data.date_issue ? moment(data.date_issue).format('DD MMMM YYYY') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Kategori
                  </Typography>
                  <Chip
                    label={data.kategori === 'HE' ? 'Heavy Equipment' : data.kategori === 'DT' ? 'Dump Truck' : data.kategori}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    SMU
                  </Typography>
                  <Typography variant="body1">{data.smu || '0'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Breakdown Items" />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Unit</TableCell>
                      <TableCell>Problem/Issue</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Kode WO</TableCell>
                      <TableCell>Assigned To</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No items
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.items?.map((item, idx) => {
                        const itemStatus = getStatusLabel(item.status);
                        return (
                          <TableRow key={idx}>
                            <TableCell>{item.unit || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.deskripsi || item.unit}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={itemStatus.label} size="small" color={itemStatus.color} />
                            </TableCell>
                            <TableCell>{item.id ? `WO-${String(item.id).padStart(5, '0')}` : '-'}</TableCell>
                            <TableCell>{item.karyawan?.nama || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Teknisi Assigned" />
            <Divider />
            <CardContent>
              {data.teknisi?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No technician assigned
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {data.teknisi?.map((tek, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {tek.karyawan?.nama || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Assigned: {tek.assigned_at ? moment(tek.assigned_at, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY HH:mm') : '-'}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Action History" />
            <Divider />
            <CardContent>
              {data.actions?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No actions yet
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {data.actions?.map((action, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Chip label={action.action_type} size="small" color="primary" sx={{ mb: 1 }} />
                          <Typography variant="body2">{action.deskripsi}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            By: {action.karyawan?.nama || 'System'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {action.action_at ? moment(action.action_at, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY HH:mm') : '-'}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
