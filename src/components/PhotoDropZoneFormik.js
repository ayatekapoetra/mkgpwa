import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Stack, Avatar, Button, Dialog, DialogContent, DialogActions } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useField, useFormikContext } from 'formik';
import { styled } from '@mui/material/styles';

const Dropzone = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isDragActive'
})(({ theme, isDragActive }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  position: 'relative',
  minHeight: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const PhotoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 200,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}));

const PhotoDropZoneFormik = ({
  name,
  baseUri = '',
  maxSize = 5 * 1024 * 1024, // 5MB
  label = 'Seret foto ke sini atau klik untuk memilih'
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();
  const [dragActive, setDragActive] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = useCallback(
    (files) => {
      const file = files[0]; // Only one file
      if (file.size <= maxSize && file.type.startsWith('image/')) {
        setFieldValue(name, file);
      }
    },
    [maxSize, setFieldValue, name]
  );

  const handleChangePhoto = () => {
    document.getElementById(`${name}-input-file`).click();
  };

  const handleViewPhoto = () => {
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
  };

  const renderContent = () => {
    if (field.value && field.value instanceof File) {
      // New uploaded file
      return (
        <PhotoContainer>
          <Avatar src={URL.createObjectURL(field.value)} variant="rounded" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }} onClick={handleChangePhoto}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }} onClick={handleViewPhoto}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Stack>
        </PhotoContainer>
      );
    } else if (field.value && typeof field.value === 'string') {
      // Existing photo URL
      return (
        <PhotoContainer>
          <Avatar
            src={typeof field.value === 'string' ? `${baseUri}/${field.value}` : field.value}
            variant="rounded"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }} onClick={handleChangePhoto}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }} onClick={handleViewPhoto}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Stack>
        </PhotoContainer>
      );
    } else {
      // No photo
      return (
        <PhotoContainer sx={{ border: `2px dashed`, borderColor: 'divider' }}>
          <Stack justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
            <CloudUploadIcon fontSize="large" color="action" />
            <Typography variant="subtitle1">{label}</Typography>
            <Typography variant="caption" color="textSecondary">
              Format yang didukung: Gambar (PNG, JPG, JPEG)
            </Typography>
          </Stack>
        </PhotoContainer>
      );
    }
  };

  return (
    <Box>
      <input id={`${name}-input-file`} name={name} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />

      <Dropzone
        role="button"
        tabIndex={0}
        aria-label={label}
        isDragActive={dragActive}
        onClick={() => document.getElementById(`${name}-input-file`).click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById(`${name}-input-file`).click();
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {renderContent()}
      </Dropzone>

      {meta.touched && meta.error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {meta.error}
        </Typography>
      )}

      <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <img
            src={typeof field.value === 'string' ? `${baseUri}/${field.value}` : URL.createObjectURL(field.value)}
            alt="Full view"
            style={{ width: '100%', height: 'auto' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotoDropZoneFormik;
