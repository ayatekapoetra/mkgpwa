'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { Alert, Button, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Paper } from '@mui/material';
import { ArrowLeft } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

export default function CheckerPagePlaceholder({ heading, routeTitle, backUrl, description }) {
  const searchParams = useSearchParams();

  const paramsEntries = useMemo(() => {
    if (!searchParams) return [];
    return Array.from(searchParams.entries());
  }, [searchParams]);

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: routeTitle, to: backUrl },
    { title: heading }
  ];

  return (
    <>
      <Breadcrumbs custom heading={heading} links={breadcrumbLinks} />

      <MainCard
        title={
          <Button component={Link} href={backUrl} variant="outlined" startIcon={<ArrowLeft />}>
            Kembali ke {routeTitle}
          </Button>
        }
      >
        <Stack spacing={2}>
          <Alert severity="info">{description}</Alert>

          <Typography variant="subtitle1">Parameter Scope</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                {paramsEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>Belum ada parameter scope pada URL.</TableCell>
                  </TableRow>
                )}
                {paramsEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell sx={{ width: 220, fontWeight: 600 }}>{key}</TableCell>
                    <TableCell>{value || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </MainCard>
    </>
  );
}
