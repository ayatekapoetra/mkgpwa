'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Image from 'next/image';
import Stack from '@mui/material/Stack';
import PanelCard from 'components/signages/PanelCard';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';
import FlipListGroup from 'components/signages/FlipList';
import { useGetSignages } from 'api/signages';
import moment from 'moment';
import Radio from '@mui/material/Radio';
import { usePublicCabang } from 'api/cabang';

import { FtxToken } from 'iconsax-react';
import FlipCardGroup from 'components/signages/FlipCard';

export default function BreakdownScreen() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [clock, setClock] = useState(moment().format('HH:mm:ss'));
  const [tanggal, setTanggal] = useState(moment().format('dddd, DD MMMM YYYY'));
  const { data: cabang, dataLoading: isLoading } = usePublicCabang();
  const [params, setParams] = useState({
    cabang_id: 2,
    ctg: 'HE',
    isGrid: true,
    page: 1,
    perPage: 8,
    lastPage: 0
  });
  const { data, dataLoading } = useGetSignages(params);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClock(moment().format('HH:mm:ss'));
      setTanggal(moment().format('dddd, DD MMMM YYYY'));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [clock]);

  return (
    <Stack sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Compact Header with Stats and Controls */}
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ 
          mx: 1, 
          mt: 1, 
          mb: 0.5,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {/* Stats Cards - Compact */}
        <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: '600px' }}>
          <PanelCard
            illustartion={'/assets/images/maintenance/breakdown.png'}
            primary="Total Breakdown"
            secondary={data?.BDtot}
            color="error.main"
          />
          <PanelCard
            illustartion={'/assets/images/maintenance/wait-tech.png'}
            primary="Menunggu Teknisi"
            secondary={data?.WTtot}
            color="primary.main"
          />
          <PanelCard
            illustartion={'/assets/images/maintenance/wait-part.png'}
            primary="Menunggu Part"
            secondary={data?.WPtot}
            color="warning.main"
          />
          <PanelCard
            illustartion={'/assets/images/maintenance/on-proses.png'}
            primary="Dalam Pengerjaan"
            secondary={data?.WStot}
            color="success.main"
          />
        </Stack>

        {/* Controls - Horizontal with Clock */}
        {!isLoading && (
          <Stack 
            direction="row" 
            spacing={1.5} 
            alignItems="stretch" 
            sx={{ 
              backgroundColor: 'background.paper',
              borderRadius: 1,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              height: '100px'
            }}
          >
            {/* Left Section - Filters */}
            <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="cabang_id">Cabang</InputLabel>
                  <Select
                    id="cabang_id"
                    labelId="cabang_id"
                    value={params.cabang_id || ''}
                    label="Cabang"
                    onChange={(e) => setParams((prev) => ({ ...prev, cabang_id: e.target.value }))}
                  >
                    {cabang?.map((m, idx) => {
                      return (
                        <MenuItem key={idx} value={m.id}>
                          [{m.kode}] {m.nama}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ width: 90 }}>
                  <InputLabel id="perPage">Limit</InputLabel>
                  <OutlinedInput
                    type="number"
                    id="perPage"
                    name="perPage"
                    size="small"
                    label="Limit"
                    value={params.perPage}
                    onChange={(e) => setParams((prev) => ({ ...prev, perPage: e.target.value }))}
                  />
                </FormControl>
              </Stack>

              <Stack direction="column" spacing={0.2} sx={{ pl: 0.5 }}>
                <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600, fontSize: 10 }}>
                  {tanggal}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>
                  {clock}
                </Typography>
              </Stack>
            </Stack>

            {/* Divider */}
            <Box sx={{ width: '1px', backgroundColor: 'divider', mx: 0.5 }} />

            {/* Right Section - Category & Mode */}
            <Stack direction="column" spacing={1} sx={{ justifyContent: 'center' }}>
              <RadioGroup
                aria-label="ctg"
                value={params.ctg}
                name="ctg"
                onChange={(e) => setParams((prev) => ({ ...prev, ctg: e.target.value }))}
                row
              >
                <FormControlLabel value="HE" control={<Radio size="small" />} label="Heavy Equipment" />
                <FormControlLabel value="DT" control={<Radio size="small" />} label="Dump Truck" />
              </RadioGroup>

              <FormControlLabel
                control={<Switch size="small" checked={params.isGrid} onChange={(e) => setParams((prev) => ({ ...prev, isGrid: e.target.checked }))} />}
                label={params.isGrid ? 'Grid Mode' : 'List Mode'}
                labelPlacement="end"
                sx={{ ml: 0 }}
              />
            </Stack>
          </Stack>
        )}
      </Stack>

      {/* Main Content - Full Width */}
      <Paper 
        sx={{ 
          flex: 1, 
          m: 1, 
          mt: 0,
          maxHeight: 'calc(100vh - 130px)', 
          overflow: 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none'
        }}
      >
        {!dataLoading && (
          <>
            {params.isGrid ? (
              <FlipCardGroup data={data} setParams={setParams} mode={theme.palette.mode} />
            ) : (
              <FlipListGroup data={data} setParams={setParams} />
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}
