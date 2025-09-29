'use client';

import { useTheme } from '@mui/material/styles';
import { Fragment, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Box, Paper, Typography, Stack, Chip, Grid } from '@mui/material';
import moment from 'moment';
import Image from 'next/image';

const AnimatedPaper = animated(Paper);

export default function FlipCardGroup({ data, setParams, mode }) {
  const [waktu, setWaktu] = useState(moment().format('HH:mm:ss'));
  const isDark = mode == 'dark';

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
  }, [data?.lastPage, setParams]);

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      {data?.data?.map((obj, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <FlipItem delay={idx * 200} value={obj} waktu={waktu} isDark={isDark} />
        </Grid>
      ))}
    </Grid>
  );
}

const FlipItem = ({ delay, waktu, value, isDark }) => {
  const theme = useTheme();
  const [flipped, setFlipped] = useState(false);

  const { transform } = useSpring({
    transform: `rotateX(${flipped ? 180 : 0}deg)`,
    config: { duration: 1000 }
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFlipped(true);
      setTimeout(() => setFlipped(false), 1000);
    }, delay);

    return () => clearTimeout(timeout);
  }, [waktu]);

  const brandLogo = getBrandLogo(value?.equipment?.manufaktur);

  return (
    <Box
      sx={{
        height: '100%',
        perspective: 1000,
        overflow: 'hidden'
      }}
    >
      <AnimatedPaper
        elevation={4}
        sx={{
          m: 1,
          height: '96%',
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }}
        style={{ transform }}
      >
        <Stack p={2} spacing={1} sx={{ height: '100%', border: !isDark && '1px dashed #ddd', borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip color="primary" label={value.lokasi.nama?.replace(/\[.*?\]\s*/, '')} size="small" />
            <Typography variant="body">{moment(value.breakdown_at, 'DD-MM-YYYY').format('DD-MM-YYYY')}</Typography>
          </Stack>

          <Stack alignItems="center" justifyContent="center" spacing={1}>
            <Typography variant="h2" sx={{ fontWeight: 800 }}>
              {value.kode_unit}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: '150px',
                height: '30px',
                backgroundColor: theme.palette.mode == 'dark' ? '#C4C4C4' : '#ddd',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Image src={brandLogo} fill style={{ objectFit: 'contain' }} alt={value?.equipment?.manufaktur} />
            </Box>
          </Stack>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {value.items.map((m, idx) => {
              const statusColor = getStatusColor(m.status, theme);
              return (
                <Fragment key={idx}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {m.problem_issue}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 1 }}>
                      <Paper
                        sx={{
                          px: 1,
                          py: 0.5,
                          minWidth: 200,
                          border: '1px dashed',
                          borderColor: 'divider'
                        }}
                      >
                        {statusColor}
                      </Paper>
                      <Paper
                        sx={{
                          px: 1,
                          py: 0.5,
                          border: '1px dashed',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {m.kode_wo}
                        </Typography>
                      </Paper>
                    </Stack>
                  </Box>
                </Fragment>
              );
            })}
          </Box>
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

function getStatusColor(status, theme) {
  switch (status) {
    case 'WP':
      return (
        <Typography color={theme.palette.warning.dark} sx={{ fontWeight: 800 }}>
          Wait Part
        </Typography>
      );
    case 'WT':
      return (
        <Typography color="primary" sx={{ fontWeight: 800 }}>
          Wait Teknisi
        </Typography>
      );
    case 'WS':
      return (
        <Typography color="error" sx={{ fontWeight: 800 }}>
          Wait Services
        </Typography>
      );
    default:
      return <Typography sx={{ fontWeight: 800, color: '#51bb2b' }}>Finish</Typography>;
  }
}
