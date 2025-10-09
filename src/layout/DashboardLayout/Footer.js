// NEXT
import Link from "next/link";

// MATERIAL - UI
import Links from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// ==============================|| MAIN LAYOUT - FOOTER ||============================== //

const Footer = () => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ p: "24px 16px 0px", mt: "auto" }}
  >
    <Typography variant="caption">
      MakkuragaTama Dashboard Versi 1.0.1
    </Typography>
    <Stack
      spacing={1.5}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Links
        component={Link}
        href="https://makkuragatama.id"
        target="_blank"
        variant="caption"
        color="textPrimary"
      >
        Home
      </Links>
      <Links
        component={Link}
        href="https://makkuragatama.id/docs"
        target="_blank"
        variant="caption"
        color="textPrimary"
      >
        Documentation
      </Links>
      <Links
        component={Link}
        href="https://makkuragatama.id/support"
        target="_blank"
        variant="caption"
        color="textPrimary"
      >
        Support
      </Links>
    </Stack>
  </Stack>
);

export default Footer;
