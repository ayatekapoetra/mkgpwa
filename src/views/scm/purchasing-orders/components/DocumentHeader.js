"use client";

import Link from "next/link";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
  Box,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { formatCurrency, getRelationName, getStatusMeta } from "../utils";

/** Displays the purchase order header summary (kode, org, supplier, totals). */
export default function DocumentHeader({ row }) {
  const meta = getStatusMeta(row?.status);
  const rekening = row?.rekpemasok || {};
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Purchase Order
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {row?.kdpo || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            PR Sumber:{" "}
            {row?.pr && row?.kode_pr ? (
              <MuiLink
                component={Link}
                href={`/purchasing-request/${row.pr}`}
                fontWeight={700}
                underline="hover"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                <LinkOutlinedIcon sx={{ fontSize: 16 }} />
                {row.kode_pr}
              </MuiLink>
            ) : (
              row?.kode_pr || "-"
            )}{" "}
            · {meta.label}
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
          <Typography variant="caption" color="text.secondary">
            Grand Total
          </Typography>
          <Typography variant="h5" fontWeight={700} color="primary">
            {formatCurrency(row?.grandtotal)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total: {formatCurrency(row?.total)} · PPN:{" "}
            {formatCurrency(row?.ppn_rp)}
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Organisasi
            </Typography>
            <Typography variant="body2">
              {getRelationName(row?.bisnis)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getRelationName(row?.cabang)} · {getRelationName(row?.gudang)}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Pemasok & Rekening
            </Typography>
            <Typography variant="body2">{getRelationName(row?.pemasok)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {rekening.nm_bank || "-"} {rekening.no_rekening || ""}
              {rekening.an ? ` (${rekening.an})` : ""}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Verifikasi & Finalisasi
            </Typography>
            <Typography variant="body2">
              Verifier: {row?.verified?.nama_lengkap || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Finalisasi: {row?.author?.nama_lengkap || "-"}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Narasi
            </Typography>
            <Typography variant="body2">{row?.narasi || "-"}</Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
