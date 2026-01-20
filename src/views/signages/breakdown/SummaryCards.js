'use client';
import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const catPalette = {
  DT: '#29B6F6',
  HE: '#AB47BC',
  LV: '#FFA726',
  LT: '#66BB6A',
  KP: '#EF5350',
  UNKNOWN: '#9E9E9E'
};

const statusPalette = {
  WT: '#1E88E5',
  WP: '#FBC02D',
  WS: '#43A047',
  WV: '#E53935',
  WTT: '#FB8C00',
  IP: '#8E24AA'
};

export default function SummaryCards({ groupedData, statusLabels }) {
  const theme = useTheme();

  if (!groupedData || groupedData.length === 0) {
    return null;
  }

  return (
    <Grid item xs={12}>
      <Card>
        <CardHeader title="Ringkasan Breakdown per Kategori" />
        <CardContent>
          <Grid container spacing={2}>
            {groupedData.map((item, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  elevation={3}
                  sx={{
                    background: `linear-gradient(135deg, ${catPalette[item.ctgequipment] || theme.palette.primary.main}15, ${catPalette[item.ctgequipment] || theme.palette.primary.main}05)`,
                    borderLeft: `6px solid ${catPalette[item.ctgequipment] || theme.palette.primary.main}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                    <Typography
                      variant="h3"
                      sx={{
                        color: catPalette[item.ctgequipment] || theme.palette.primary.main,
                        fontWeight: 'bold',
                        mb: 0.5,
                        letterSpacing: 2
                      }}
                    >
                      {item.ctgequipment}
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        my: 1.5,
                        fontWeight: 800,
                        color: theme.palette.text.primary
                      }}
                    >
                      {item.total}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}
                    >
                      Total Breakdown
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
                      {statusLabels
                        .filter(s => item.status_count[s] > 0)
                        .sort((a, b) => item.status_count[b] - item.status_count[a])
                        .map(status => (
                          <Box
                            key={status}
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 2,
                              bgcolor: statusPalette[status],
                              color: 'white',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              minWidth: '45px'
                            }}
                          >
                            {status}: {item.status_count[status]}
                          </Box>
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}
