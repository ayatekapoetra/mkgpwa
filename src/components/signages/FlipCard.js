'use client';

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Box, Paper, Typography, Stack, Chip, Divider, LinearProgress } from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import moment from 'moment';
import Image from 'next/image';
import { Construction, Engineering, Warning, CheckCircle, Schedule } from '@mui/icons-material';

const AnimatedPaper = animated(Paper);

export default function FlipCardGroup({ data, setParams, mode }) {
  const [waktu, setWaktu] = useState(moment().format('HH:mm:ss'));
  const isDark = mode === 'dark';

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
    <Box sx={{ padding: { xs: 2, sm: 2, md: 2, lg: 2, xl: 3 } }}>
      <Masonry 
        columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, '2xl': 5 }} 
        spacing={{ xs: 2, sm: 2, md: 2, lg: 2.5, xl: 3 }}
      >
        {data?.data?.map((obj, idx) => (
          <FlipItem key={obj.id || idx} delay={idx * 150} value={obj} waktu={waktu} isDark={isDark} />
        ))}
      </Masonry>
    </Box>
  );
}

const FlipItem = ({ delay, waktu, value, isDark }) => {
  const theme = useTheme();
  const [flipped, setFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { transform, opacity } = useSpring({
    transform: `perspective(1000px) rotateY(${flipped ? 180 : 0}deg)`,
    opacity: mounted ? 1 : 0,
    config: { tension: 200, friction: 25 }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFlipped(true);
      setTimeout(() => setFlipped(false), 1200);
    }, delay);

    return () => clearTimeout(timeout);
  }, [waktu, delay]);

  const brandLogo = getBrandLogo(value?.equipment?.manufaktur);
  const itemsCount = value.items?.length || 0;
  const statusStats = getStatusStats(value.items);

  return (
    <AnimatedPaper
      elevation={8}
      sx={{
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[12]
        }
      }}
      style={{ transform, opacity }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          p: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)'
          }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Construction sx={{ color: 'white', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
              {value.lokasi?.nama?.replace(/\[.*?\]\s*/, '') || '-'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Schedule sx={{ color: 'white', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: 'white' }}>
              {moment(value.breakdown_at, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY')}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Equipment Info */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                letterSpacing: 1
              }}
            >
              {value.kode_unit}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: '180px',
                height: '40px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
              }}
            >
              <Image src={brandLogo} fill style={{ objectFit: 'contain', padding: '4px' }} alt={value?.equipment?.manufaktur || 'Equipment'} />
            </Box>
          </Box>

          {/* Status Overview */}
          {itemsCount > 0 && (
            <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<Warning sx={{ fontSize: 16 }} />}
                label={`${itemsCount} Issue${itemsCount > 1 ? 's' : ''}`}
                size="small"
                color="error"
                sx={{ fontWeight: 700, fontSize: 13 }}
              />
              {statusStats.WT > 0 && (
                <Chip label={`${statusStats.WT} Wait Tech`} size="small" color="primary" sx={{ fontWeight: 600, fontSize: 12 }} />
              )}
              {statusStats.WP > 0 && (
                <Chip label={`${statusStats.WP} Wait Part`} size="small" color="warning" sx={{ fontWeight: 600, fontSize: 12 }} />
              )}
              {statusStats.WS > 0 && (
                <Chip label={`${statusStats.WS} In Service`} size="small" color="info" sx={{ fontWeight: 600, fontSize: 12 }} />
              )}
            </Stack>
          )}
        </Stack>
      </Box>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />

      {/* Issues List */}
      <Stack spacing={0} sx={{ maxHeight: '400px', overflowY: 'auto' }}>
        {value.items?.map((item, idx) => {
          const statusInfo = getStatusInfo(item.status, theme);
          return (
            <Box
              key={idx}
              sx={{
                p: 2.5,
                borderBottom: idx < value.items.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                }
              }}
            >
              <Stack spacing={1.5}>
                {/* Problem Issue */}
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Engineering sx={{ fontSize: 20, color: theme.palette.text.secondary, mt: 0.3, flexShrink: 0 }} />
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      color: theme.palette.text.primary,
                      flex: 1
                    }}
                  >
                    {item.problem_issue}
                  </Typography>
                </Stack>

                {/* Status and WO */}
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1.5,
                      backgroundColor: statusInfo.bgColor,
                      border: `1px solid ${statusInfo.borderColor}`,
                      flex: 1,
                      minWidth: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    {statusInfo.icon}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: statusInfo.color,
                        fontSize: 13
                      }}
                    >
                      {statusInfo.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.kode_wo}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Footer with time indicator */}
      <Box>
        <LinearProgress
          variant="determinate"
          value={((30 - (new Date().getSeconds() % 30)) / 30) * 100}
          sx={{
            height: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }
          }}
        />
      </Box>
    </AnimatedPaper>
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

function getStatusInfo(status, theme) {
  const isDark = theme.palette.mode === 'dark';
  const statusMap = {
    WT: {
      label: 'Wait Technician',
      color: theme.palette.primary.main,
      bgColor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)',
      borderColor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)',
      icon: <Schedule sx={{ fontSize: 16, color: theme.palette.primary.main }} />
    },
    WP: {
      label: 'Wait Part',
      color: theme.palette.warning.main,
      bgColor: isDark ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.08)',
      borderColor: isDark ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)',
      icon: <Warning sx={{ fontSize: 16, color: theme.palette.warning.main }} />
    },
    WS: {
      label: 'In Service',
      color: theme.palette.info.main,
      bgColor: isDark ? 'rgba(0, 188, 212, 0.1)' : 'rgba(0, 188, 212, 0.08)',
      borderColor: isDark ? 'rgba(0, 188, 212, 0.3)' : 'rgba(0, 188, 212, 0.2)',
      icon: <Engineering sx={{ fontSize: 16, color: theme.palette.info.main }} />
    },
    DONE: {
      label: 'Completed',
      color: theme.palette.success.main,
      bgColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)',
      borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
      icon: <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
    }
  };
  return statusMap[status] || statusMap.WT;
}

function getStatusStats(items) {
  const stats = { WT: 0, WP: 0, WS: 0, DONE: 0 };
  items?.forEach((item) => {
    stats[item.status] = (stats[item.status] || 0) + 1;
  });
  return stats;
}
