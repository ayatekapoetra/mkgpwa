import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudDownload as CloudDownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import useManualDataDownloader from 'hooks/useManualDataDownloader';

const ManualDataDownloadScreen = () => {
  const theme = useTheme();
  const {
    downloadStates,
    downloadData,
    downloadAllData,
    resetDownloadState,
    resetAllDownloadStates,
    getOverallProgress,
    getOverallStatus
  } = useManualDataDownloader();

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const dataConfig = {
    lokasiKerja: {
      title: 'Lokasi Kerja',
      description: 'Data lokasi kerja untuk operasional',
      icon: <ScheduleIcon />
    },
    kegiatanKerja: {
      title: 'Kegiatan Kerja',
      description: 'Data kegiatan kerja dan aktivitas',
      icon: <ScheduleIcon />
    },
    equipment: {
      title: 'Equipment',
      description: 'Data peralatan dan mesin',
      icon: <ScheduleIcon />
    },
    material: {
      title: 'Material',
      description: 'Data material dan bahan',
      icon: <ScheduleIcon />
    },
    karyawan: {
      title: 'Karyawan',
      description: 'Data karyawan dan staff',
      icon: <ScheduleIcon />
    },
    penyewa: {
      title: 'Penyewa',
      description: 'Data penyewa dan customer',
      icon: <ScheduleIcon />
    },
    cabang: {
      title: 'Cabang',
      description: 'Data cabang dan lokasi',
      icon: <ScheduleIcon />
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'downloading':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'downloading':
        return <CloudDownloadIcon color="info" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Belum pernah diunduh';
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (dataType) => {
    await downloadData(dataType);
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await downloadAllData();
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleReset = (dataType) => {
    resetDownloadState(dataType);
  };

  const handleResetAll = () => {
    resetAllDownloadStates();
  };

  const overallProgress = getOverallProgress();
  const overallStatus = getOverallStatus();

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Download Data Offline
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Unduh data master yang diperlukan untuk penggunaan offline. Pilih data yang ingin diunduh atau unduh semua data sekaligus.
          </Typography>
        </Box>
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progress Keseluruhan
              </Typography>
              <Chip
                label={overallStatus === 'completed' ? 'Selesai' : 
                       overallStatus === 'downloading' ? 'Mengunduh...' : 
                       overallStatus === 'error' ? 'Error' : 'Belum Dimulai'}
                color={getStatusColor(overallStatus)}
                icon={getStatusIcon(overallStatus)}
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: theme.palette.primary.main
                }
              }}
            />
            
            <Typography variant="body2" color="textSecondary">
              {overallProgress}% Selesai
            </Typography>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || overallStatus === 'downloading'}
            sx={{ minWidth: 150 }}
          >
            {isDownloadingAll ? 'Mengunduh...' : 'Unduh Semua'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetAll}
            disabled={overallStatus === 'downloading'}
            sx={{ minWidth: 150 }}
          >
            Reset Semua
          </Button>
        </Box>
      </motion.div>

      {/* Data Cards */}
      <Grid container spacing={2}>
        {Object.entries(dataConfig).map(([dataType, config], index) => {
          const state = downloadStates[dataType];
          
          return (
            <Grid item xs={12} key={dataType}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              >
                <Card 
                  sx={{ 
                    border: state.status === 'error' ? `1px solid ${theme.palette.error.main}` : 'none',
                    boxShadow: state.status === 'error' ? theme.shadows[4] : theme.shadows[1]
                  }}
                >
                  <CardHeader
                    avatar={
                      <Box sx={{ 
                        color: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }}>
                        {config.icon}
                      </Box>
                    }
                    action={
                      <Chip
                        label={state.status === 'completed' ? 'Selesai' : 
                               state.status === 'downloading' ? 'Mengunduh...' : 
                               state.status === 'error' ? 'Error' : 'Belum Diunduh'}
                        color={getStatusColor(state.status)}
                        size="small"
                        icon={getStatusIcon(state.status)}
                      />
                    }
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {config.title}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="textSecondary">
                        {config.description}
                      </Typography>
                    }
                    sx={{ pb: 1 }}
                  />
                  
                  <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      {/* Progress Bar */}
                      {state.status === 'downloading' && (
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={state.progress}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2,
                                backgroundColor: theme.palette.info.main
                              }
                            }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                            {state.progress}% Selesai
                          </Typography>
                        </Box>
                      )}

                      {/* Error Message */}
                      {state.status === 'error' && (
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                            {state.error}
                          </Typography>
                        </Box>
                      )}

                      {/* Last Update */}
                      {state.status !== 'downloading' && state.status !== 'error' && (
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            Terakhir diunduh:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {formatLastUpdate(state.lastUpdate)}
                          </Typography>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        <Button
                          variant={state.status === 'completed' ? 'outlined' : 'contained'}
                          size="small"
                          startIcon={state.status === 'downloading' ? <CloudDownloadIcon /> : <DownloadIcon />}
                          onClick={() => handleDownload(dataType)}
                          disabled={state.status === 'downloading'}
                          sx={{ minWidth: 80 }}
                        >
                          {state.status === 'downloading' ? 'Unduh' : 
                           state.status === 'completed' ? 'Ulang' : 'Unduh'}
                        </Button>
                        
                        <Tooltip title="Reset Status">
                          <IconButton
                            size="small"
                            onClick={() => handleReset(dataType)}
                            disabled={state.status === 'downloading'}
                            color="secondary"
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
    </>
  );
};

ManualDataDownloadScreen.propTypes = {
  // No props required for this component
};

export default ManualDataDownloadScreen;