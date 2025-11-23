'use client';

import { useState } from 'react';
import { useGetBisnisUnit, createBisnisUnit, updateBisnisUnit, deleteBisnisUnit } from 'api/bisnis-unit';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import MainCard from 'components/MainCard';
import { useSnackbar } from 'notistack';
import { Add, Edit, Trash } from 'iconsax-react';

export default function BisnisUnitPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { bisnisUnit, bisnisUnitLoading, bisnisUnitMutate } = useGetBisnisUnit();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    initial: '',
    kode: '',
    name: '',
    email: '',
    phone: '',
    alamat: '',
    kota: '',
    npwp: ''
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      initial: '',
      kode: '',
      name: '',
      email: '',
      phone: '',
      alamat: '',
      kota: '',
      npwp: ''
    });
  };

  const handleEdit = (item) => {
    setFormData({
      initial: item.initial || '',
      kode: item.kode || '',
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      alamat: item.alamat || '',
      kota: item.kota || '',
      npwp: item.npwp || ''
    });
    setSelectedId(item.id);
    setEditMode(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await updateBisnisUnit(selectedId, formData);
        enqueueSnackbar('Bisnis Unit berhasil diupdate', { variant: 'success' });
      } else {
        await createBisnisUnit(formData);
        enqueueSnackbar('Bisnis Unit berhasil ditambahkan', { variant: 'success' });
      }
      bisnisUnitMutate();
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Gagal menyimpan data', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus bisnis unit ini?')) {
      try {
        await deleteBisnisUnit(id);
        enqueueSnackbar('Bisnis Unit berhasil dihapus', { variant: 'success' });
        bisnisUnitMutate();
      } catch (error) {
        enqueueSnackbar(error.message || 'Gagal menghapus data', { variant: 'error' });
      }
    }
  };

  return (
    <MainCard
      title="Master Bisnis Unit"
      secondary={
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Tambah Bisnis Unit
        </Button>
      }
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Initial</TableCell>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Kota</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bisnisUnitLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : bisnisUnit?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              bisnisUnit?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.initial}</TableCell>
                  <TableCell>{item.kode}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.kota}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                        <Edit size={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                        <Trash size={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Bisnis Unit' : 'Tambah Bisnis Unit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Initial"
              value={formData.initial}
              onChange={(e) => setFormData({ ...formData, initial: e.target.value })}
              fullWidth
              required
              inputProps={{ maxLength: 4 }}
            />
            <TextField
              label="Kode"
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              fullWidth
              inputProps={{ maxLength: 2 }}
            />
            <TextField
              label="Nama"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Alamat"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Kota"
              value={formData.kota}
              onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
              fullWidth
            />
            <TextField
              label="NPWP"
              value={formData.npwp}
              onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Batal</Button>
          <Button onClick={handleSubmit} variant="contained">
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
