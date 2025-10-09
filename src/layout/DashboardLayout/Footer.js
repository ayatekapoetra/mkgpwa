// NEXT
import Link from "next/link";

// MATERIAL - UI
import Links from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

// ==============================|| MAIN LAYOUT - FOOTER ||============================== //

const Footer = () => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ p: "24px 16px 0px", mt: "auto" }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography
        variant="caption"
        sx={{ color: "primary.main", fontWeight: 500 }}
      >
        MakkuragaTama Dashboard
      </Typography>
      <Chip
        label="v1.1.2"
        size="small"
        color="success"
        variant="filled"
        sx={{ height: 22, fontSize: "0.8rem", fontWeight: 700 }}
      />
    </Stack>
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
