// ==============================|| OVERRIDES - MODAL ||============================== //

export default function Modal() {
  return {
    MuiModal: {
      styleOverrides: {
        root: {
          '&[aria-hidden="true"]': {
            pointerEvents: 'none !important',
            visibility: 'hidden !important'
          }
        }
      }
    }
  };
}
