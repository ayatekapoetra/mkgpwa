'use client';
import React, { useEffect, useState } from 'react';

// MATERIAL - UI
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
    perPage: 6,
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
    <Stack>
      <Stack spacing={1} direction={downSM ? 'column' : 'row'} justifyContent="space-between" sx={{ mx: 1, mt: 1 }}>
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
      <Stack spacing={1} sx={{ m: 1, py: 2 }} direction={downSM ? 'column' : 'row'}>
        <Paper sx={{ flex: 1 }}>
          {!isLoading && (
            <Stack mt={1} flex={1} p={1}>
              <FormControl fullWidth>
                <InputLabel id="cabang_id">Cabang</InputLabel>
                <Select
                  id="cabang_id"
                  labelId="cabang_id"
                  value={params.cabang_id || ''}
                  placeholder="Cabang"
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
            </Stack>
          )}
          <Stack mt={1} flex={1} p={1}>
            <FormControl fullWidth>
              <InputLabel id="perPage">Data perPage</InputLabel>
              <OutlinedInput
                fullWidth
                type="number"
                id="perPage"
                name="perPage"
                value={params.perPage}
                onChange={(e) => setParams((prev) => ({ ...prev, perPage: e.target.value }))}
                startAdornment={null}
                endAdornment={<FtxToken />}
              />
            </FormControl>
          </Stack>

          <Stack flex={1} p={1}>
            <FormControl fullWidth>
              <RadioGroup
                aria-label="ctg"
                value={params.ctg}
                name="ctg"
                onChange={(e) => setParams((prev) => ({ ...prev, ctg: e.target.value }))}
                row
              >
                <FormControlLabel value="HE" control={<Radio />} label="Alat Berat" />
                <FormControlLabel value="DT" control={<Radio />} label="Dumptruck" />
              </RadioGroup>
            </FormControl>
          </Stack>
          <Stack mt={1} flex={1} p={1}>
            <FormControl fullWidth>
              <FormControlLabel
                control={<Switch checked={params.isGrid} onChange={(e) => setParams((prev) => ({ ...prev, isGrid: e.target.checked }))} />}
                label={params.isGrid ? 'Gird Mode' : 'List Mode'}
                labelPlacement="end"
              />
            </FormControl>
          </Stack>
          <Stack my={2} justifyContent="center" alignItems="center">
            <Image src={'/assets/images/maintenance/safety-first.png'} width={200} height={200} alt="Picture of the author" />
            <Typography variant="h1">{clock}</Typography>
            <Typography variant="body">{tanggal}</Typography>
          </Stack>
        </Paper>
        <Paper sx={{ flex: 4 }}>
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
    </Stack>
  );
}
