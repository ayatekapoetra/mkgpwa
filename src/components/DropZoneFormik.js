import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Paper, List, ListItem, ListItemIcon, ListItemText, Avatar, Stack } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { useField, useFormikContext } from 'formik';
import { styled } from '@mui/material/styles';

const Dropzone = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isDragActive'
})(({ theme, isDragActive }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  textAlign: 'center',
  backgroundColor: isDragActive ? theme.palette.action.hover : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const DropZoneFormik = ({
  name,
  accept = '*',
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  label = 'Seret file ke sini atau klik untuk memilih'
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files) => {
    const validFiles = [];

    Array.from(files).forEach((file) => {
      if (file.size <= maxSize && (accept === '*' || file.type.match(new RegExp(accept.replace('*', '.*'))))) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      if (multiple) {
        setFieldValue(name, [...(field.value || []), ...validFiles]);
      } else {
        setFieldValue(name, validFiles[0]);
      }
    }
  };

  const removeFile = (index) => {
    if (multiple) {
      const updated = [...(field.value || [])];
      updated.splice(index, 1);
      setFieldValue(name, updated);
    } else {
      setFieldValue(name, null);
    }
  };

  const renderFiles = () => {
    const files = multiple ? field.value || [] : field.value ? [field.value] : [];

    return (
      <List dense>
        {files.map((file, index) => (
          <Paper key={index} variant="outlined" sx={{ mb: 1 }}>
            <ListItem
              secondaryAction={
                <IconButton edge="end" onClick={() => removeFile(index)} aria-label={`Hapus file ${file.name}`}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                {file.type.startsWith('image') ? <Avatar src={URL.createObjectURL(file)} variant="rounded" /> : <FileIcon />}
              </ListItemIcon>
              <ListItemText sx={{ ml: 1 }} primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
            </ListItem>
          </Paper>
        ))}
      </List>
    );
  };

  return (
    <Box>
      <input
        id={`${name}-input-file`}
        name={name}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        multiple={multiple}
        onChange={handleChange}
      />

      {/* Gunakan role button dan tambahkan keyboard handler agar sesuai aksesibilitas */}
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
        <Stack justifyContent="center" alignItems="center">
          <CloudUploadIcon fontSize="large" color="action" />
          <Typography variant="subtitle1">{label}</Typography>
          <Typography variant="caption" color="textSecondary">
            Format yang didukung: {accept === '*' ? 'Semua format' : accept}
          </Typography>
        </Stack>
      </Dropzone>

      {meta.touched && meta.error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {meta.error}
        </Typography>
      )}

      {field.value && renderFiles()}
    </Box>
  );
};

export default DropZoneFormik;
