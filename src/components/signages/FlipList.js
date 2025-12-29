'use client';

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Box, Paper, Typography, Stack, Chip, Divider, Avatar, LinearProgress, Collapse } from '@mui/material';
import moment from 'moment';
import Image from 'next/image';
import { Construction, Engineering, Warning, Schedule, ExpandMore, CheckCircle } from '@mui/icons-material';

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
  }, [data?.lastPage, setParams]);

  const leftColumn = data?.data?.filter((_, idx) => idx % 2 === 0) || [];
  const rightColumn = data?.data?.filter((_, idx) => idx % 2 === 1) || [];

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
      {/* Left Column */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        {leftColumn.map((obj, idx) => (
          <FlipItem key={obj.id || idx * 2} delay={idx * 2 * 100} value={obj} waktu={waktu} />
        ))}
      </Stack>

      {/* Right Column */}
      <Stack spacing={2} sx={{ flex: 1 }}>
        {rightColumn.map((obj, idx) => (
          <FlipItem key={obj.id || idx * 2 + 1} delay={(idx * 2 + 1) * 100} value={obj} waktu={waktu} />
        ))}
      </Stack>
    </Box>
  );
}

const FlipItem = ({ delay, waktu, value }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { transform, opacity } = useSpring({
    transform: `translateX(${flipped ? -10 : 0}px)`,
    opacity: mounted ? 1 : 0,
    config: { tension: 200, friction: 20 }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFlipped(true);
      setTimeout(() => setFlipped(false), 800);
    }, delay);

    return () => clearTimeout(timeout);
  }, [waktu, delay]);

  const brandLogo = getBrandLogo(value?.equipment?.manufaktur);
  const itemsCount = value.items?.length || 0;
  const statusStats = getStatusStats(value.items);

  return (
    <AnimatedPaper
      elevation={6}
      sx={{
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[10]
        }
      }}
      style={{ transform, opacity }}
    >
      {/* Main Info Row */}
      <Box
        sx={{
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          p: 2,
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          {/* Equipment Avatar */}
          <Avatar
            sx={{
              width: 72,
              height: 72,
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: theme.shadows[4]
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
              }}
            >
              <Image src={brandLogo} fill style={{ objectFit: 'contain', padding: '8px' }} alt={value?.equipment?.manufaktur || 'Equipment'} />
            </Box>
          </Avatar>

          {/* Unit Info */}
          <Stack spacing={0.5} flex={1}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: 'white',
                letterSpacing: 1,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {value.kode_unit}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Construction sx={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {value.lokasi?.nama?.replace(/\[.*?\]\s*/, '') || '-'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Schedule sx={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {moment(value.breakdown_at, 'DD-MM-YYYY HH:mm').format('DD MMM YYYY HH:mm')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Status Summary */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              icon={<Warning sx={{ fontSize: 18 }} />}
              label={`${itemsCount} Issue${itemsCount > 1 ? 's' : ''}`}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                color: theme.palette.error.main,
                fontWeight: 700,
                fontSize: 14,
                height: 36,
                '& .MuiChip-icon': { color: theme.palette.error.main }
              }}
            />
            <ExpandMore
              sx={{
                color: 'white',
                fontSize: 32,
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Issues Detail */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)' }}>
          {value.items?.map((item, idx) => {
            const statusInfo = getStatusInfo(item.status, theme);
            return (
              <Box key={idx}>
                <Box
                  sx={{
                    p: 3,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    {/* Problem Description */}
                    <Stack spacing={1} flex={1}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Engineering sx={{ fontSize: 24, color: theme.palette.text.secondary, mt: 0.2, flexShrink: 0 }} />
                        <Typography
                          variant="h6"
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

                      {/* Status and WO Row */}
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            backgroundColor: statusInfo.bgColor,
                            border: `1.5px solid ${statusInfo.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            minWidth: 120
                          }}
                        >
                          {statusInfo.icon}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: statusInfo.color,
                              fontSize: 12
                            }}
                          >
                            {statusInfo.label}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.kode_wo}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 12,
                            height: 28,
                            fontFamily: 'monospace',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                            letterSpacing: 0.3
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
                {idx < value.items.length - 1 && (
                  <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', mx: 3 }} />
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>

      {/* Progress Footer */}
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
      bgColor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
      borderColor: isDark ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.3)',
      icon: <Schedule sx={{ fontSize: 18, color: theme.palette.primary.main }} />
    },
    WP: {
      label: 'Wait Part',
      color: theme.palette.warning.main,
      bgColor: isDark ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
      borderColor: isDark ? 'rgba(255, 152, 0, 0.4)' : 'rgba(255, 152, 0, 0.3)',
      icon: <Warning sx={{ fontSize: 18, color: theme.palette.warning.main }} />
    },
    WS: {
      label: 'In Service',
      color: theme.palette.info.main,
      bgColor: isDark ? 'rgba(0, 188, 212, 0.15)' : 'rgba(0, 188, 212, 0.1)',
      borderColor: isDark ? 'rgba(0, 188, 212, 0.4)' : 'rgba(0, 188, 212, 0.3)',
      icon: <Engineering sx={{ fontSize: 18, color: theme.palette.info.main }} />
    },
    DONE: {
      label: 'Completed',
      color: theme.palette.success.main,
      bgColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)',
      borderColor: isDark ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.3)',
      icon: <CheckCircle sx={{ fontSize: 18, color: theme.palette.success.main }} />
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
