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
import moment from "moment";

import {
  usePurchaseOrderBisnis,
  usePurchaseOrderCabang,
  usePurchaseOrderPemasok,
} from "api/purchase-orders";
import { getSelectedOption } from "views/scm/purchasing-orders/utils";

export const defaultDateStart = () => moment().startOf("month").format("YYYY-MM-DD");
export const defaultDateEnd = () => moment().format("YYYY-MM-DD");

export const EMPTY_FILTERS = {
  bisnis_id: "",
  cabang_id: "",
  pemasok_id: "",
  status: "pending",
  q: "",
  date_start: defaultDateStart(),
  date_end: defaultDateEnd(),
  limit: 25,
};

/** Side drawer filter for Orders Payments list. */
export default function OrderPaymentFilter({
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
  const { rows: pemasok = [] } = usePurchaseOrderPemasok({}, open);

  useEffect(() => {
    if (open) {
      setDraft({
        ...EMPTY_FILTERS,
        date_start: defaultDateStart(),
        date_end: defaultDateEnd(),
        ...params,
      });
    }
  }, [open, params]);

  const cabangOptions = cabang.filter(
    (row) =>
      !draft.bisnis_id ||
      !row.bisnis_id ||
      String(row.bisnis_id) === String(draft.bisnis_id),
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
          <Typography variant="h5">Filter Orders Payments</Typography>
          <Typography variant="caption" color="text.secondary">
            Atur kriteria lalu terapkan filter
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={2} sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
          <TextField
            label="Cari"
            placeholder="No bayar / PO / PD / pemasok"
            value={draft.q || ""}
            onChange={handleChange("q")}
          />
          <TextField
            select
            label="Status"
            value={draft.status || "pending"}
            onChange={handleChange("status")}
          >
            <MenuItem value="pending">Belum Bayar</MenuItem>
            <MenuItem value="paid">Sudah Bayar</MenuItem>
            <MenuItem value="all">Semua</MenuItem>
          </TextField>
          <TextField
            type="date"
            label="Tanggal mulai"
            InputLabelProps={{ shrink: true }}
            value={draft.date_start || ""}
            onChange={handleChange("date_start")}
            inputProps={{ max: draft.date_end || undefined }}
          />
          <TextField
            type="date"
            label="Tanggal akhir"
            InputLabelProps={{ shrink: true }}
            value={draft.date_end || ""}
            onChange={handleChange("date_end")}
            inputProps={{ min: draft.date_start || undefined }}
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
              }))
            }
            renderInput={(p) => <TextField {...p} label="Bisnis Unit" />}
          />
          <Autocomplete
            options={cabangOptions}
            value={getSelectedOption(cabangOptions, draft.cabang_id)}
            getOptionLabel={(option) =>
              option.nama || option.name || option.kode || ""
            }
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                cabang_id: option?.id || "",
              }))
            }
            renderInput={(p) => <TextField {...p} label="Cabang" />}
          />
          <Autocomplete
            options={pemasok}
            value={getSelectedOption(pemasok, draft.pemasok_id)}
            getOptionLabel={(option) => option.nama || option.kode || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                pemasok_id: option?.id || "",
              }))
            }
            renderInput={(p) => <TextField {...p} label="Pemasok" />}
          />
          <TextField
            select
            label="Baris per halaman"
            value={draft.limit || 25}
            onChange={handleChange("limit")}
          >
            {[10, 25, 50, 100].map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              const reset = {
                ...EMPTY_FILTERS,
                date_start: defaultDateStart(),
                date_end: defaultDateEnd(),
              };
              setDraft(reset);
              onReset(reset);
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
