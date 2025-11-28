// NEXT
import Link from 'next/link';

// MATERIAL - UI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// PROJECT IMPORTS
import AnimateButton from 'components/@extended/AnimateButton';
import AuthWrapper from 'sections/auth/AuthWrapper';

// ================================|| CHECK MAIL ||================================ //

const CheckMail = () => {
  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Cek WhatsApp Anda</Typography>
            <Typography color="secondary" sx={{ mb: 0.5, mt: 1.25 }}>
              Link reset password telah dikirim ke WhatsApp Anda. Silakan klik link tersebut untuk melanjutkan proses reset password.
            </Typography>
            <Typography color="textSecondary" variant="body2" sx={{ mt: 2 }}>
              Link akan kadaluarsa dalam 1 jam.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <AnimateButton>
            <Button
              component={Link}
              href="/login"
              disableElevation
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              color="primary"
            >
              Sign in
            </Button>
          </AnimateButton>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
};

export default CheckMail;
