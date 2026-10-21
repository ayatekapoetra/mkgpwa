"use client";

import { useState } from "react";
import Link from "next/link";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { formatCurrency, getRelationName, getStatusMeta } from "../utils";
import EditHeaderDialog from "./EditHeaderDialog";

/** Displays the purchase order header summary (kode, org, supplier, totals). */
export default function DocumentHeader({ row, canEdit = false, onUpdated }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [initialMode, setInitialMode] = useState("all");
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="overline" color="text.secondary">
              Purchase Order
            </Typography>
            {row?.prioritas === "urgent" && (
              <Chip size="small" color="error" label="URGENT" sx={{ height: 20 }} />
            )}
          </Stack>
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
            )}
            {row?.purchaseRequest?.creator?.nama_lengkap || row?.author_pr ? (
              <Typography component="span" variant="body2" color="text.secondary">
                {" "}· Pembuat PR:{" "}
                <strong>
                  {row?.purchaseRequest?.creator?.nama_lengkap || row?.author_pr}
                </strong>
              </Typography>
            ) : null}{" "}
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
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Pemasok & Rekening
              </Typography>
              {canEdit && (
                <Button
                  size="small"
                  variant={rekening.no_rekening ? "outlined" : "contained"}
                  color={rekening.no_rekening ? "primary" : "warning"}
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    setInitialMode(rekening.no_rekening ? "rekening" : "new_rekening");
                    setOpenEdit(true);
                  }}
                  sx={{ textTransform: "none", py: 0.2, px: 1, fontSize: "0.75rem" }}
                >
                  {rekening.no_rekening ? "Ganti Rekening" : "+ Tambah Rekening"}
                </Button>
              )}
            </Stack>
            <Typography variant="body2" fontWeight={600}>
              {getRelationName(row?.pemasok)}
            </Typography>
            {rekening.no_rekening ? (
              <Typography variant="body2" color="text.secondary">
                {rekening.nm_bank || "-"} {rekening.no_rekening}
                {rekening.an ? ` (${rekening.an})` : ""}
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                Belum ada rekening terdaftar untuk PO ini
              </Typography>
            )}
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
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Narasi / Keterangan Dokumen
              </Typography>
              {canEdit && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    setInitialMode("narasi");
                    setOpenEdit(true);
                  }}
                  sx={{ textTransform: "none", py: 0.2, px: 1, fontSize: "0.75rem" }}
                >
                  Edit Narasi
                </Button>
              )}
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {row?.narasi || "-"}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      <EditHeaderDialog
        open={openEdit}
        row={row}
        initialMode={initialMode}
        onClose={() => setOpenEdit(false)}
        onUpdated={onUpdated}
      />
    </Box>
  );
}
