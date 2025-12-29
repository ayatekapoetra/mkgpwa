'use client';

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import moment from 'moment';
import Image from 'next/image';

const AnimatedPaper = animated(Paper);

export default function FlipListGroup({ data, setParams }) {
  const [waktu, setWaktu] = useState(moment().format('HH:mm:ss'));

  useEffect(() => {
    const interval = setInterval(() => {
      setWaktu(moment().format('HH:mm:ss'));

      setParams((prev) => {
        const nextPage = prev.page < data.lastPage ? prev.page + 1 : 1;
        return {
          ...prev,
          page: nextPage,
          lastPage: data.lastPage
        };
      });
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [data?.lastPage, setParams]); // ✅ pakai data.lastPage saja sebagai dependensi

  return (
    <Stack spacing={2} m={2}>
      {data?.data?.map((obj, idx) => {
        return <FlipItem key={idx} delay={idx * 200} value={obj} waktu={waktu} />;
      })}
    </Stack>
  );
}

const FlipItem = ({ delay, waktu, value }) => {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [flipped, setFlipped] = useState(false);

  const { transform } = useSpring({
    transform: `rotateX(${flipped ? 180 : 0}deg)`,
    config: { duration: 1000 }
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFlipped(true);
      setTimeout(() => setFlipped(false), 1000); // reset
    }, delay);

    return () => clearTimeout(timeout);
  }, [waktu]);

  const brandLogo = getBrandLogo(value?.equipment?.manufaktur);

  return (
    <Box
      sx={{
        px: 0.5,
        py: 0.2,
        width: '100%',
        perspective: 1000,
        overflow: 'hidden'
      }}
    >
      <AnimatedPaper
        elevation={4}
        sx={{
          // my: 1,
          width: '100%',
          height: '100%',
          backgroundColor: 'background.paper',
          color: 'transparant',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }}
        style={{
          transform
        }}
      >
        <Stack
          p={1}
          spacing={1}
          direction={downSM ? 'column' : 'row'}
          justifyContent="flex-start"
          alignItems="center"
          sx={{ width: '100%' }}
        >
          <Stack flex={1} justifyContent="center" alignItems="center">
            <Chip color="primary" label={value.lokasi.nama?.replace(/\[.*?\]\s*/, '')} size="small" />
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: '30px' }}>
              {value.kode_unit}
            </Typography>
            <Box
              style={{
                position: 'relative', // ✅ penting agar Image fill berfungsi
                width: '150px',
                height: '30px',
                backgroundColor: theme.palette.mode == 'dark' ? '#C4C4C4' : '#ddd',
                borderRadius: 5,
                overflow: 'hidden' // ✅ mencegah gambar keluar box
              }}
            >
              <Image
                src={brandLogo}
                fill
                style={{
                  objectFit: 'contain'
                }}
                alt={value?.equipment?.manufaktur}
              />
            </Box>
          </Stack>
          <Stack flex={4}>
            <ul>
              {value.items.map((m, idx) => {
                switch (m.status) {
                  case 'WP':
                    var statusColor = (
                      <Typography color={theme.palette.warning['dark']} sx={{ fontWeight: 800 }}>
                        Wait Part
                      </Typography>
                    );
                    // var statusColor = <Typography color={theme.palette.info['dark']} sx={{fontWeight: 800}}>Wait Part</Typography>
                    break;
                  case 'WT':
                    var statusColor = (
                      <Typography color="primary" sx={{ fontWeight: 800 }}>
                        Wait Teknisi
                      </Typography>
                    );
                    break;
                  case 'WS':
                    var statusColor = (
                      <Typography color="error" sx={{ fontWeight: 800 }}>
                        Wait Services
                      </Typography>
                    );
                    break;
                  default:
                    var statusColor = (
                      <Typography color="success" sx={{ fontWeight: 800, color: '#51bb2b' }}>
                        Finish
                      </Typography>
                    );
                    break;
                }
                return (
                  <li key={idx} style={{ marginButtom: 3 }}>
                    <Typography variant="h4">{m.problem_issue}</Typography>
                    <Stack my={1} spacing={0.5} direction={downSM ? 'column' : 'row'} justifyContent="space-between">
                      <Stack direction="row" spacing={1} justifyContent="flex-sart" alignItems="center">
                        <Paper sx={{ px: 1, minWidth: 150, textAlign: 'center', border: '1px dashed grey' }} variant="contained">
                          {statusColor}
                        </Paper>
                        <Paper sx={{ px: 1, textAlign: 'center', border: '1px dashed grey' }} variant="contained" color="primary">
                          {downSM ? (
                            <Typography>{moment().format('DD-MM-YYYY')}</Typography>
                          ) : (
                            <Typography>Breakdown At: {moment().format('DD-MM-YYYY')}</Typography>
                          )}
                        </Paper>
                      </Stack>
                      <Paper
                        sx={{ px: 1, textAlign: 'center', border: '1px dashed grey', alignItems: 'center', justifyContent: 'center' }}
                        variant="contained"
                        color="secondary"
                      >
                        <Typography sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>{m.kode_wo}</Typography>
                      </Paper>
                    </Stack>
                  </li>
                );
              })}
            </ul>
          </Stack>
        </Stack>
      </AnimatedPaper>
    </Box>
  );
};

// Helper functions
function getBrandLogo(manufacturer) {
  const logos = {
    Caterpillar: `/assets/images/manufaktur/Caterpillar.png?v=2`,
    Mitsubishi: `/assets/images/manufaktur/Mitsubishi.png?v=2`,
    Kobelco: `/assets/images/manufaktur/Kobelco.png?v=2`,
    Hidromek: `/assets/images/manufaktur/Hidromek.png?v=2`,
    Hitachi: `/assets/images/manufaktur/Hitachi.png?v=2`,
    HONGYAN: `/assets/images/manufaktur/Hongyan.png?v=2`,
    Isuzu: `/assets/images/manufaktur/Isuzu.png?v=2`,
    JCB: `/assets/images/manufaktur/JCB.png?v=2`,
    Sumitomo: `/assets/images/manufaktur/Sumitomo.png?v=2`,
    'Atlas Copco': `/assets/images/manufaktur/AtlasCopco.png?v=2`,
    Daihatsu: `/assets/images/manufaktur/Daihatsu.png?v=2`,
    JACRO: `/assets/images/manufaktur/Jacro.png?v=2`,
    Kubota: `/assets/images/manufaktur/Kubota.png?v=2`,
    Perkins: `/assets/images/manufaktur/Perkins.png?v=2`,
    Sakai: `/assets/images/manufaktur/Sakai.png?v=2`,
    Sany: `/assets/images/manufaktur/Sany.png?v=2`,
    Sachman: `/assets/images/manufaktur/Shacman.png?v=2`,
    Shantui: `/assets/images/manufaktur/Shantui.png?v=2`,
    Toyota: `/assets/images/manufaktur/Toyota.png?v=2`,
    XGMA: `/assets/images/manufaktur/XGMA.png?v=2`
  };
  return logos[manufacturer] || '/assets/images/manufaktur/NoLogo.png';
}
