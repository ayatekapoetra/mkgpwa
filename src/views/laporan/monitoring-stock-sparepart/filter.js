"use client";

import { useEffect, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

import { useMonitoringStockOptions } from "api/monitoring-stock-sparepart";

const optionId = (option) => String(option?.id ?? option?.value ?? "");
const optionLabel = (option) =>
  typeof option === "string"
    ? option
    : option?.label ||
      option?.nama ||
      option?.name ||
      [option?.kode || option?.code, option?.part_number]
        .filter(Boolean)
        .join(" - ") ||
      optionId(option);
const selectedOption = (options, selected) =>
  options.find((option) => optionId(option) === String(selected)) || null;
const selectedOptions = (options, selected) => {
  const available = new Map(
    options.map((option) => [optionId(option), option]),
  );
  return (selected || [])
    .map(
      (item) =>
        available.get(String(typeof item === "object" ? item?.id : item)) ||
        item,
    )
    .filter(Boolean);
};
const statuses = [
  { id: "available", label: "Available" },
  { id: "low", label: "Low Stock" },
  { id: "out", label: "Out of Stock" },
  { id: "negative", label: "Negative" },
];

export default function MonitoringStockFilter({
  open,
  count,
  draftParams,
  setDraftParams,
  onApply,
  onReset,
  onClose,
}) {
  const [itemInput, setItemInput] = useState(draftParams.item_search || "");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");

  useEffect(() => {
    if (open) setItemInput(draftParams.item_search || "");
  }, [draftParams.item_search, open]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedItemSearch(itemInput.trim()),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [itemInput]);

  const businesses = useMonitoringStockOptions("businesses", open, {
    limit: 100,
  });
  const warehouses = useMonitoringStockOptions("warehouses", open, {
    bisnis_id: draftParams.bisnis_id,
    limit: 100,
  });
  const racks = useMonitoringStockOptions("racks", open, {
    bisnis_id: draftParams.bisnis_id,
    gudang_id: draftParams.gudang_id,
    limit: 100,
  });
  const categories = useMonitoringStockOptions("categories", open, {
    bisnis_id: draftParams.bisnis_id,
    gudang_id: draftParams.gudang_id,
    limit: 100,
  });
  const items = useMonitoringStockOptions("items", open, {
    bisnis_id: draftParams.bisnis_id,
    gudang_id: draftParams.gudang_id,
    search: debouncedItemSearch,
    limit: 100,
  });
  const update = (values) =>
    setDraftParams((previous) => ({ ...previous, ...values }));

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onOpen={() => {}}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: "100%" } }}
    >
      <Stack sx={{ width: { xs: "100vw", sm: 500 }, minHeight: "100%" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2 }}
        >
          <Stack>
            <Typography variant="h5">Filter Monitoring Stock</Typography>
            <Typography variant="caption" color="text.secondary">
              {count.toLocaleString("id-ID")} data pada filter aktif
            </Typography>
          </Stack>
          <IconButton aria-label="Tutup filter" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        <Grid
          container
          spacing={2}
          sx={{ p: 2, flex: 1, alignContent: "flex-start" }}
        >
          <Grid item xs={12}>
            <Autocomplete
              options={businesses.options}
              loading={businesses.loading}
              value={selectedOption(businesses.options, draftParams.bisnis_id)}
              onChange={(_, value) =>
                update({
                  bisnis_id: value ? optionId(value) : "",
                  gudang_id: "",
                  rack_ids: [],
                })
              }
              isOptionEqualToValue={(option, value) =>
                optionId(option) === optionId(value)
              }
              getOptionLabel={optionLabel}
              renderInput={(input) => (
                <TextField
                  {...input}
                  label="Bisnis"
                  InputProps={{
                    ...input.InputProps,
                    endAdornment: (
                      <>
                        {businesses.loading ? (
                          <CircularProgress size={18} />
                        ) : null}
                        {input.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={warehouses.options}
              loading={warehouses.loading}
              value={selectedOption(warehouses.options, draftParams.gudang_id)}
              onChange={(_, value) =>
                update({
                  gudang_id: value ? optionId(value) : "",
                  rack_ids: [],
                })
              }
              isOptionEqualToValue={(option, value) =>
                optionId(option) === optionId(value)
              }
              getOptionLabel={optionLabel}
              renderInput={(input) => (
                <TextField {...input} label="Warehouse" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={racks.options}
              loading={racks.loading}
              value={selectedOptions(racks.options, draftParams.rack_ids)}
              onChange={(_, value) => update({ rack_ids: value.slice(0, 100) })}
              isOptionEqualToValue={(option, value) =>
                optionId(option) === optionId(value)
              }
              getOptionLabel={optionLabel}
              renderInput={(input) => (
                <TextField
                  {...input}
                  label="Rack"
                  helperText={`${draftParams.rack_ids.length}/100 dipilih`}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={categories.options}
              loading={categories.loading}
              value={selectedOption(
                categories.options,
                draftParams.kategori_id,
              )}
              onChange={(_, value) =>
                update({ kategori_id: value ? optionId(value) : "" })
              }
              isOptionEqualToValue={(option, value) =>
                optionId(option) === optionId(value)
              }
              getOptionLabel={optionLabel}
              renderInput={(input) => <TextField {...input} label="Kategori" />}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              filterOptions={(options) => options}
              options={items.options}
              loading={items.loading}
              inputValue={itemInput}
              onInputChange={(_, value, reason) => {
                if (reason === "input" || reason === "clear") {
                  setItemInput(value.slice(0, 200));
                  update({ item_search: value.slice(0, 200) });
                }
              }}
              onChange={(_, value) => {
                const search =
                  typeof value === "string"
                    ? value
                    : value?.code || value?.part_number || value?.name || "";
                setItemInput(search.slice(0, 200));
                update({ item_search: search.slice(0, 200) });
              }}
              getOptionLabel={optionLabel}
              renderInput={(input) => (
                <TextField
                  {...input}
                  label="Kode / Part Number / Nama Barang"
                  inputProps={{ ...input.inputProps, maxLength: 200 }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={statuses}
              value={selectedOptions(statuses, draftParams.stock_status)}
              onChange={(_, value) => update({ stock_status: value })}
              isOptionEqualToValue={(option, value) =>
                optionId(option) === optionId(value)
              }
              getOptionLabel={optionLabel}
              renderInput={(input) => (
                <TextField {...input} label="Status Stock" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={draftParams.include_zero}
                  onChange={(event) =>
                    update({ include_zero: event.target.checked })
                  }
                />
              }
              label="Sertakan stock nol"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={draftParams.include_inactive_master}
                  onChange={(event) =>
                    update({ include_inactive_master: event.target.checked })
                  }
                />
              }
              label="Barang inactive"
            />
          </Grid>
        </Grid>
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={() => {
              onReset();
              setItemInput("");
            }}
          >
            Reset
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onApply}
            disabled={
              draftParams.rack_ids.length > 100 ||
              draftParams.item_search.length > 200
            }
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </SwipeableDrawer>
  );
}
