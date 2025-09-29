// MATERIAL - UI
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
// import Fade from '@mui/material/Fade';
// import Grow from '@mui/material/Grow';
// import Slide from '@mui/material/Slide';
// import Stack from '@mui/material/Stack';
import MuiSnackbar from '@mui/material/Snackbar';
// import Snackbar from '@mui/material/Snackbar';

// PROJECT IMPORTS
// import IconButton from './IconButton';

// ASSETS
import { MessageQuestion } from 'iconsax-react';
import { closeNotification, useGetNotification } from 'api/notification';
import { Fragment } from 'react';

// ANIMATION FUNCTION
// function TransitionSlideLeft(props) {
//   return <Slide {...props} direction="left" />;
// }

// function TransitionSlideUp(props) {
//   return <Slide {...props} direction="up" />;
// }

// function TransitionSlideRight(props) {
//   return <Slide {...props} direction="right" />;
// }

// function TransitionSlideDown(props) {
//   return <Slide {...props} direction="down" />;
// }

// function GrowTransition(props) {
//   return <Grow {...props} />;
// }

// ANIMATION OPTIONS
// const animation = {
//   SlideLeft: TransitionSlideLeft,
//   SlideUp: TransitionSlideUp,
//   SlideRight: TransitionSlideRight,
//   SlideDown: TransitionSlideDown,
//   Grow: GrowTransition,
//   Fade
// };

// ==============================|| MY ALERT NOTIFICATION ||============================== //

const AlertNotification = () => {
  const { notification } = useGetNotification();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    closeNotification();
  };

  if (notification) {
    return (
      <Fragment>
        <MuiSnackbar open={notification.open} autoHideDuration={5000} onClose={handleClose} anchorOrigin={notification.anchorOrigin}>
          <Alert
            onClose={handleClose}
            severity={notification.alert.color}
            variant={notification.variant}
            icon={<MessageQuestion variant="Bold" />}
            sx={{ width: '100%' }}
          >
            <AlertTitle>{notification.title}</AlertTitle>
            <Typography variant="h6" sx={{ whiteSpace: 'pre-line' }}>
              {notification.message}
            </Typography>
          </Alert>
        </MuiSnackbar>
      </Fragment>
    );
  }
};

export default AlertNotification;
