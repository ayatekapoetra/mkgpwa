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
  usePurchasingRequestBisnis,
  usePurchasingRequestCabang,
  usePurchasingRequestGudang,
} from "api/purchasing-request";

const EMPTY_FILTERS = {
  bisnis_id: "",
  cabang_id: "",
  gudang_id: "",
  status: "",
  prioritas: "",
  kode: "",
  description: "",
  date_start: "",
  date_end: "",
  limit: 25,
};

/** Collects and applies purchasing request list filters in a side drawer. */
export default function PurchasingRequestFilter({
  open,
  params,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS, ...params });
  const { rows: bisnis = [] } = usePurchasingRequestBisnis({}, open);
  const { rows: cabang = [] } = usePurchasingRequestCabang(
    { bisnis_id: draft.bisnis_id },
    open,
  );
  const { rows: gudang = [] } = usePurchasingRequestGudang({}, open);
  useEffect(() => {
    if (open) {
      setDraft({ ...EMPTY_FILTERS, ...params });
    }
  }, [open, params]);
  const getSelectedOption = (options, id) => {
    return options.find((option) => String(option.id) === String(id)) || null;
  };
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
  const createFieldChangeHandler = (name) => {
    return (event) => {
      setDraft((current) => ({
        ...current,
        [name]: event.target.value,
      }));
    };
  };

  const handleDrawerOpen = () => {
    return undefined;
  };
  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={handleDrawerOpen}
      disableSwipeToOpen
      PaperProps={{ sx: { width: { xs: "100%", sm: 430 } } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h5">Filter Purchasing Request</Typography>
          <Typography variant="caption" color="text.secondary">
            Atur kriteria lalu terapkan filter
          </Typography>
        </Box>
        <Divider />
        <Stack spacing={2} sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
          <TextField
            label="Kode PR"
            value={draft.kode}
            onChange={createFieldChangeHandler("kode")}
          />
          <TextField
            label="Deskripsi"
            value={draft.description}
            onChange={createFieldChangeHandler("description")}
          />
          <Autocomplete
            options={bisnis}
            value={getSelectedOption(bisnis, draft.bisnis_id)}
            getOptionLabel={(option) =>
              option.name || option.initial || option.kode || ""
            }
            isOptionEqualToValue={(option, valueOption) =>
              String(option.id) === String(valueOption.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                bisnis_id: option?.id || "",
                cabang_id: "",
                gudang_id: "",
              }))
            }
            renderInput={(inputParams) => (
              <TextField {...inputParams} label="Bisnis Unit" />
            )}
          />
          <Autocomplete
            options={cabangOptions}
            value={getSelectedOption(cabangOptions, draft.cabang_id)}
            getOptionLabel={(option) =>
              option.nama || option.name || option.kode || ""
            }
            isOptionEqualToValue={(option, valueOption) =>
              String(option.id) === String(valueOption.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                cabang_id: option?.id || "",
                gudang_id: "",
              }))
            }
            renderInput={(inputParams) => (
              <TextField {...inputParams} label="Cabang" />
            )}
          />
          <Autocomplete
            options={gudangOptions}
            value={getSelectedOption(gudangOptions, draft.gudang_id)}
            getOptionLabel={(option) =>
              option.nama || option.name || option.kode || ""
            }
            isOptionEqualToValue={(option, valueOption) =>
              String(option.id) === String(valueOption.id)
            }
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                gudang_id: option?.id || "",
              }))
            }
            renderInput={(inputParams) => (
              <TextField {...inputParams} label="Gudang" />
            )}
          />
          <TextField
            select
            label="Status"
            value={draft.status}
            onChange={createFieldChangeHandler("status")}
          >
            <MenuItem value="">Semua Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Check</MenuItem>
            <MenuItem value="approved">Validate</MenuItem>
            <MenuItem value="finish">Finish</MenuItem>
          </TextField>
          <TextField
            select
            label="Prioritas"
            value={draft.prioritas}
            onChange={createFieldChangeHandler("prioritas")}
          >
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
            onChange={createFieldChangeHandler("date_start")}
          />
          <TextField
            type="date"
            label="Tanggal Akhir"
            InputLabelProps={{ shrink: true }}
            value={draft.date_end}
            onChange={createFieldChangeHandler("date_end")}
            inputProps={{ min: draft.date_start || undefined }}
          />
          <TextField
            select
            label="Baris per halaman"
            value={draft.limit}
            onChange={createFieldChangeHandler("limit")}
          >
            {[10, 25, 50, 100].map((value) => (
              <MenuItem key={value} value={value}>
                {value}
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
