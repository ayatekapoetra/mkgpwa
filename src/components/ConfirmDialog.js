import { Box, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Button } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function ConfirmDialog({
  open = false,
  message = 'Biarkan Google membantu aplikasi menentukan lokasi. Ini berarti mengirimkan data lokasi anonim ke Google, bahkan saat tidak ada aplikasi yang berjalan.',
  submessage = '',
  handleClose = () => {},
  handleAction = () => {}
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const onAgree = () => {
    handleAction(); // Eksekusi aksi
    handleClose(); // Tutup dialog setelah aksi
  };

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={handleClose} aria-labelledby="responsive-dialog-title">
      <Box sx={{ p: 1, py: 1.5 }}>
        <DialogTitle id="responsive-dialog-title">Konfirmasi System</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
          <DialogContentText>{submessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={handleClose}>
            Tidak
          </Button>
          <Button variant="contained" onClick={onAgree} autoFocus>
            Okey
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
