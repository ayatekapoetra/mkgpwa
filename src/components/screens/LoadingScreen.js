import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Fade,
  Grow,
  Backdrop,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';

// ==============================|| LOADING SCREEN ||============================== //

const LoadingScreen = ({ 
  message = 'Loading...', 
  submessage = '',
  variant = 'circular',
  fullScreen = true,
  showProgress = false,
  progress = 0,
  logo = null,
  animation = 'fade'
}) => {
  const theme = useTheme();

  const renderContent = () => {
    switch (variant) {
      case 'circular':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: theme.palette.primary.main,
                  mb: 2
                }} 
              />
            </motion.div>
            {message && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Typography 
                  variant="h6" 
                  color="textPrimary" 
                  sx={{ mb: 1 }}
                >
                  {message}
                </Typography>
              </motion.div>
            )}
            {submessage && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                >
                  {submessage}
                </Typography>
              </motion.div>
            )}
          </Box>
        );

      case 'dots':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                </motion.div>
              ))}
            </Box>
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" color="textPrimary">
                  {message}
                </Typography>
              </motion.div>
            )}
            {submessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Typography variant="body2" color="textSecondary">
                  {submessage}
                </Typography>
              </motion.div>
            )}
          </Box>
        );

      case 'pulse':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  mb: 2
                }}
              />
            </motion.div>
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" color="textPrimary">
                  {message}
                </Typography>
              </motion.div>
            )}
            {submessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Typography variant="body2" color="textSecondary">
                  {submessage}
                </Typography>
              </motion.div>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '200px',
        p: 3,
        backgroundColor: fullScreen ? theme.palette.background.default : 'transparent'
      }}
    >
      {/* Logo if provided */}
      {logo && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 3 }}
        >
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ 
              width: 120, 
              height: 'auto',
              mb: 3
            }}
          />
        </motion.div>
      )}

      {/* Main loading content */}
      {renderContent()}

      {/* Progress bar if enabled */}
      {showProgress && (
        <Box sx={{ width: '100%', maxWidth: 300, mt: 3 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: theme.palette.primary.main
                }
              }}
            />
          </motion.div>
          <Typography 
            variant="caption" 
            color="textSecondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.default
        }}
      >
        {animation === 'fade' ? (
          <Fade in={true} timeout={500}>
            {content}
          </Fade>
        ) : (
          <Grow in={true} timeout={500}>
            {content}
          </Grow>
        )}
      </Backdrop>
    );
  }

  return content;
};

LoadingScreen.propTypes = {
  message: PropTypes.string,
  submessage: PropTypes.string,
  variant: PropTypes.oneOf(['circular', 'dots', 'pulse']),
  fullScreen: PropTypes.bool,
  showProgress: PropTypes.bool,
  progress: PropTypes.number,
  logo: PropTypes.string,
  animation: PropTypes.oneOf(['fade', 'grow'])
};

export default LoadingScreen;