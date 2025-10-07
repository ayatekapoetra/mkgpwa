import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  WifiOff,
  CloudOff,
  BugReport,
  Info,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// ==============================|| ERROR SCREEN ||============================== //

const ErrorScreen = ({ 
  error,
  onRetry,
  onBack,
  showDetails = true,
  variant = 'network',
  actions = ['retry', 'back']
}) => {
  const theme = useTheme();

  const getErrorConfig = () => {
    switch (variant) {
      case 'network':
        return {
          icon: <WifiOff sx={{ fontSize: 64 }} />,
          title: 'Koneksi Internet Terputus',
          description: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
          color: 'warning',
          suggestions: [
            'Periksa koneksi Wi-Fi atau data seluler Anda',
            'Pastikan Anda memiliki akses internet',
            'Coba refresh halaman ini',
            'Hubungi administrator jika masalah berlanjut'
          ]
        };
      
      case 'server':
        return {
          icon: <CloudOff sx={{ fontSize: 64 }} />,
          title: 'Server Error',
          description: 'Server mengalami masalah. Tim kami sedang bekerja untuk memperbaikinya.',
          color: 'error',
          suggestions: [
            'Tunggu beberapa saat dan coba lagi',
            'Periksa status server di halaman status',
            'Hubungi administrator jika masalah berlanjut',
            'Coba gunakan koneksi internet yang berbeda'
          ]
        };
      
      case 'auth':
        return {
          icon: <ErrorIcon sx={{ fontSize: 64 }} />,
          title: 'Autentikasi Gagal',
          description: 'Sesi Anda telah berakhir atau terjadi masalah dengan autentikasi.',
          color: 'error',
          suggestions: [
            'Login kembali dengan akun Anda',
            'Periksa username dan password Anda',
            'Hubungi administrator jika Anda lupa password',
            'Pastikan akun Anda masih aktif'
          ]
        };
      
      case 'data':
        return {
          icon: <BugReport sx={{ fontSize: 64 }} />,
          title: 'Data Error',
          description: 'Terjadi kesalahan saat memproses data. Beberapa informasi mungkin tidak tersedia.',
          color: 'error',
          suggestions: [
            'Refresh halaman untuk mencoba lagi',
            'Hapus cache browser dan coba lagi',
            'Hubungi administrator dengan detail error',
            'Periksa format data yang Anda masukkan'
          ]
        };
      
      case 'permission':
        return {
          icon: <Warning sx={{ fontSize: 64 }} />,
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
          color: 'warning',
          suggestions: [
            'Login dengan akun yang memiliki izin yang sesuai',
            'Hubungi administrator untuk meminta akses',
            'Periksa pengaturan izin akun Anda',
            'Kembali ke halaman sebelumnya'
          ]
        };
      
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 64 }} />,
          title: 'Terjadi Kesalahan',
          description: error?.message || 'Terjadi kesalahan yang tidak diketahui.',
          color: 'error',
          suggestions: [
            'Refresh halaman dan coba lagi',
            'Periksa koneksi internet Anda',
            'Hubungi administrator jika masalah berlanjut',
            'Coba lagi nanti'
          ]
        };
    }
  };

  const errorConfig = getErrorConfig();

  const getErrorDetails = () => {
    if (!error || !showDetails) return null;

    const details = [];
    
    if (error.status) {
      details.push({
        label: 'Status Code',
        value: error.status,
        type: 'code'
      });
    }
    
    if (error.message) {
      details.push({
        label: 'Message',
        value: error.message,
        type: 'text'
      });
    }
    
    if (error.code) {
      details.push({
        label: 'Error Code',
        value: error.code,
        type: 'code'
      });
    }
    
    if (error.timestamp) {
      details.push({
        label: 'Timestamp',
        value: new Date(error.timestamp).toLocaleString(),
        type: 'text'
      });
    }
    
    if (error.endpoint) {
      details.push({
        label: 'Endpoint',
        value: error.endpoint,
        type: 'code'
      });
    }

    return details;
  };

  const errorDetails = getErrorDetails();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        p: 3
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          boxShadow: theme.shadows[10],
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Error Icon */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ color: theme.palette[errorConfig.color].main }}>
                {errorConfig.icon}
              </Box>
            </motion.div>
          </Box>

          {/* Error Title and Description */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ fontWeight: 600, color: theme.palette[errorConfig.color].main }}
              >
                {errorConfig.title}
              </Typography>
              <Typography 
                variant="body1" 
                color="textSecondary"
                sx={{ mb: 2 }}
              >
                {errorConfig.description}
              </Typography>
            </motion.div>
          </Box>

          {/* Error Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Alert severity={errorConfig.color} sx={{ mb: 3 }}>
              <AlertTitle>{errorConfig.title}</AlertTitle>
              {errorConfig.description}
            </Alert>
          </motion.div>

          {/* Suggestions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Solusi yang disarankan:
            </Typography>
            <List dense>
              {errorConfig.suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Info sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={suggestion}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: 'textSecondary'
                      }}
                    />
                  </ListItem>
                  {index < errorConfig.suggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* Error Details */}
          {showDetails && errorDetails && errorDetails.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Detail Error:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {errorDetails.map((detail, index) => (
                  <Chip
                    key={index}
                    label={`${detail.label}: ${detail.value}`}
                    variant="outlined"
                    size="small"
                    color={detail.type === 'code' ? 'secondary' : 'default'}
                    icon={detail.type === 'code' ? <BugReport fontSize="small" /> : <Info fontSize="small" />}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {actions.includes('retry') && onRetry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button
                  variant="contained"
                  onClick={onRetry}
                  startIcon={<Refresh />}
                  color={errorConfig.color}
                >
                  Coba Lagi
                </Button>
              </motion.div>
            )}
            
            {actions.includes('back') && onBack && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button
                  variant="outlined"
                  onClick={onBack}
                  color="secondary"
                >
                  Kembali
                </Button>
              </motion.div>
            )}
          </Box>

          {/* Additional Info */}
          {error?.retryCount !== undefined && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" color="textSecondary">
                Percobaan ke-{error.retryCount} dari {error.maxRetries || 3}
              </Typography>
            </Box>
          )}

          {error?.lastAttempt && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Percobaan terakhir: {new Date(error.lastAttempt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

ErrorScreen.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    endpoint: PropTypes.string,
    retryCount: PropTypes.number,
    maxRetries: PropTypes.number,
    lastAttempt: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onRetry: PropTypes.func,
  onBack: PropTypes.func,
  showDetails: PropTypes.bool,
  variant: PropTypes.oneOf(['network', 'server', 'auth', 'data', 'permission']),
  actions: PropTypes.arrayOf(PropTypes.oneOf(['retry', 'back']))
};

export default ErrorScreen;