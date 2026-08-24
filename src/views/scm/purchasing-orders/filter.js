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
  usePurchaseOrderGudang,
  usePurchaseOrderPemasok,
} from "api/purchase-orders";
import { getSelectedOption } from "./utils";

const EMPTY_FILTERS = {
  bisnis_id: "",
  cabang_id: "",
  gudang_id: "",
  pemasok_id: "",
  status: "",
  prioritas: "",
  kode: "",
  narasi: "",
  date_start: "",
  date_end: "",
  limit: 25,
};

/** Side drawer for purchasing order list filters. */
export default function PurchaseOrderFilter({
  open,
  params,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS, ...params });
  const { rows: bisnis = [] } = usePurchaseOrderBisnis({}, open);
  const { rows: cabang = [] } = usePurchaseOrderCabang(
    { bisnis_id: draft.bisnis_id },
    open,
  );
  const { rows: gudang = [] } = usePurchaseOrderGudang({}, open);
  const { rows: pemasok = [] } = usePurchaseOrderPemasok({}, open);

  useEffect(() => {
    if (open) setDraft({ ...EMPTY_FILTERS, ...params });
  }, [open, params]);

  const cabangOptions = cabang.filter(
    (row) =>
      !draft.bisnis_id ||
      !row.bisnis_id ||
      String(row.bisnis_id) === String(draft.bisnis_id),
  );
  const gudangOptions = gudang.filter(
    (row) =>
      !draft.cabang_id ||
      !row.cabang_id ||
      String(row.cabang_id) === String(draft.cabang_id),
  );

  const handleChange = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }));

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => undefined}
      disableSwipeToOpen
      PaperProps={{ sx: { width: { xs: "100%", sm: 430 } } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h5">Filter Purchase Order</Typography>
          <Typography variant="caption" color="text.secondary">
            Atur kriteria lalu terapkan filter
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={2} sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
          <TextField
            label="Kode PO / PR"
            value={draft.kode}
            onChange={handleChange("kode")}
          />
          <TextField
            label="Narasi"
            value={draft.narasi}
            onChange={handleChange("narasi")}
          />
          <Autocomplete
            options={bisnis}
            value={getSelectedOption(bisnis, draft.bisnis_id)}
            getOptionLabel={(option) =>
              option.name || option.initial || option.kode || ""
            }
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                bisnis_id: option?.id || "",
                cabang_id: "",
                gudang_id: "",
              }))
            }
            renderInput={(p) => <TextField {...p} label="Bisnis Unit" />}
          />
          <Autocomplete
            options={cabangOptions}
            value={getSelectedOption(cabangOptions, draft.cabang_id)}
            getOptionLabel={(option) => option.nama || option.name || option.kode || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                cabang_id: option?.id || "",
                gudang_id: "",
              }))
            }
            renderInput={(p) => <TextField {...p} label="Cabang" />}
          />
          <Autocomplete
            options={gudangOptions}
            value={getSelectedOption(gudangOptions, draft.gudang_id)}
            getOptionLabel={(option) => option.nama || option.name || option.kode || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({ ...current, gudang_id: option?.id || "" }))
            }
            renderInput={(p) => <TextField {...p} label="Gudang" />}
          />
          <Autocomplete
            options={pemasok}
            value={getSelectedOption(pemasok, draft.pemasok_id)}
            getOptionLabel={(option) => option.nama || option.kode || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({ ...current, pemasok_id: option?.id || "" }))
            }
            renderInput={(p) => <TextField {...p} label="Pemasok" />}
          />
          <TextField select label="Status" value={draft.status} onChange={handleChange("status")}>
            <MenuItem value="">Semua Status</MenuItem>
            <MenuItem value="open">Baru</MenuItem>
            <MenuItem value="verify">Menunggu Verifikasi</MenuItem>
            <MenuItem value="close">Diproses</MenuItem>
            <MenuItem value="reject">Ditolak</MenuItem>
          </TextField>
          <TextField select label="Prioritas" value={draft.prioritas} onChange={handleChange("prioritas")}>
            <MenuItem value="">Semua Prioritas</MenuItem>
            <MenuItem value="P1">P1 - Tinggi</MenuItem>
            <MenuItem value="P2">P2 - Sedang</MenuItem>
            <MenuItem value="P3">P3 - Rendah</MenuItem>
          </TextField>
          <TextField
            type="date"
            label="Tanggal Mulai"
            InputLabelProps={{ shrink: true }}
            value={draft.date_start}
            onChange={handleChange("date_start")}
          />
          <TextField
            type="date"
            label="Tanggal Akhir"
            InputLabelProps={{ shrink: true }}
            value={draft.date_end}
            onChange={handleChange("date_end")}
            inputProps={{ min: draft.date_start || undefined }}
          />
          <TextField select label="Baris per halaman" value={draft.limit} onChange={handleChange("limit")}>
            {[10, 25, 50, 100].map((v) => (
              <MenuItem key={v} value={v}>{v}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              onReset();
            }}
          >
            Reset
          </Button>
          <Button fullWidth variant="contained" onClick={() => onApply(draft)}>
            Terapkan
          </Button>
        </Stack>
      </Stack>
    </SwipeableDrawer>
  );
}
