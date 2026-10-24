// ==============================|| OVERRIDES - DRAWER ||============================== //

export default function Drawer() {
  return {
    MuiDrawer: {
      styleOverrides: {
        root: {
          '&[aria-hidden="true"]': {
            pointerEvents: 'none !important',
            visibility: 'hidden !important'
          }
        },
        paper: {
          backgroundImage: 'none'
        }
      }
    }
  };
}
