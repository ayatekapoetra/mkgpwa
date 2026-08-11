"use client";

import moment from "moment";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";

import StatusChip from "./StatusChip";

/** Displays the purchasing request identity, organization, and status. */
export default function DocumentHeader({ row }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1}
        >
          <Box>
            <Typography variant="h3">{row.kode}</Typography>
            <Typography color="text.secondary">
              {row.date_ro ? moment(row.date_ro).format("DD MMMM YYYY") : "-"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StatusChip status={row.status} />
            <StatusChip status={row.prioritas} />
          </Stack>
        </Stack>
        <Divider />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Requester
            </Typography>
            <Typography>
              {row.creator?.nmlengkap || row.creator?.nama_lengkap || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Organisasi
            </Typography>
            <Typography>
              {row.bisnis?.name || "-"} · {row.cabang?.nama || "-"} ·{" "}
              {row.gudang?.nama || row.gudang?.name || "-"}
            </Typography>
          </Box>
        </Box>
        <Typography>{row.description || "Tanpa deskripsi"}</Typography>
      </Stack>
    </Paper>
  );
}
