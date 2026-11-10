"use client";

import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from "@mui/material";

import {
  usePurchaseOrderBisnis,
  usePurchaseOrderCabang,
  usePurchaseOrderPemasok,
} from "api/purchase-orders";
import { getSelectedOption } from "views/scm/purchasing-orders/utils";

import { buildDefaultFilters, STATUS_OPTIONS } from "./utils";

export default function FakturPembelianFilter({
  open,
  params,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState({ ...buildDefaultFilters(), ...params });
  const { rows: bisnis = [] } = usePurchaseOrderBisnis({}, open);
  const { rows: cabang = [] } = usePurchaseOrderCabang(
    { bisnis_id: draft.bisnis_id },
    open,
  );
  const { rows: pemasok = [] } = usePurchaseOrderPemasok({}, open);

  useEffect(() => {
    if (open) setDraft({ ...buildDefaultFilters(), ...params });
  }, [open, params]);

  const setField = (key) => (event) =>
    setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{ sx: { width: { xs: "100%", sm: 380 } } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h5" mb={2}>
          Filter Faktur
        </Typography>

        <Stack spacing={2}>
          <TextField
            select
            size="small"
            label="Status"
            value={draft.status}
            onChange={setField("status")}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Autocomplete
            size="small"
            options={bisnis}
            value={getSelectedOption(bisnis, draft.bisnis_id)}
            onChange={(_, val) =>
              setDraft((prev) => ({
                ...prev,
                bisnis_id: val?.id ?? "",
                cabang_id: "",
              }))
            }
            getOptionLabel={(opt) => opt?.name || opt?.initial || ""}
            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
            renderInput={(p) => <TextField {...p} label="Bisnis Unit" />}
          />

          <Autocomplete
            size="small"
            options={cabang}
            value={getSelectedOption(cabang, draft.cabang_id)}
            onChange={(_, val) =>
              setDraft((prev) => ({ ...prev, cabang_id: val?.id ?? "" }))
            }
            getOptionLabel={(opt) => opt?.nama || ""}
            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
            renderInput={(p) => <TextField {...p} label="Cabang" />}
          />

          <Autocomplete
            size="small"
            options={pemasok}
            value={getSelectedOption(pemasok, draft.pemasok_id)}
            onChange={(_, val) =>
              setDraft((prev) => ({ ...prev, pemasok_id: val?.id ?? "" }))
            }
            getOptionLabel={(opt) => opt?.nama || ""}
            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
            renderInput={(p) => <TextField {...p} label="Pemasok" />}
          />

          <TextField
            select
            size="small"
            label="Skema Pembayaran"
            value={draft.top_type}
            onChange={setField("top_type")}
          >
            <MenuItem value="">Semua</MenuItem>
            <MenuItem value="CASH">Tunai</MenuItem>
            <MenuItem value="CREDIT">Kredit</MenuItem>
            <MenuItem value="INSTALLMENT">Termin</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Metode"
            value={draft.metode}
            onChange={setField("metode")}
          >
            <MenuItem value="">Semua</MenuItem>
            <MenuItem value="tunai">Tunai</MenuItem>
            <MenuItem value="kredit">Kredit</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="No. Faktur"
            value={draft.kdfb}
            onChange={setField("kdfb")}
          />
          <TextField
            size="small"
            label="No. PO"
            value={draft.no_po}
            onChange={setField("no_po")}
          />
          <TextField
            size="small"
            label="No. Pengajuan Dana"
            value={draft.no_pd}
            onChange={setField("no_pd")}
          />
          <TextField
            size="small"
            type="date"
            label="Jatuh tempo s/d"
            InputLabelProps={{ shrink: true }}
            value={draft.due_before}
            onChange={setField("due_before")}
          />
          <TextField
            select
            size="small"
            label="Lewat jatuh tempo"
            value={draft.overdue_only}
            onChange={setField("overdue_only")}
          >
            <MenuItem value="">Semua</MenuItem>
            <MenuItem value="true">Hanya yang lewat</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Cari (faktur / PO / pemasok)"
            value={draft.q}
            onChange={setField("q")}
          />
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onApply(draft)}
          >
            Terapkan
          </Button>
          <Button fullWidth variant="outlined" onClick={() => onReset()}>
            Reset
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
}
