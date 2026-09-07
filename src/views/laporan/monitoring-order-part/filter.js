"use client";

import { useEffect, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

import { useMonitoringOrderPartOptions } from "api/monitoring-order-part";
import {
  CURRENT_STAGES,
  FINANCE_STAGES,
  FULFILLMENT_STAGES,
  PROCUREMENT_STAGES,
  stageLabel,
} from "./presentation";

const optionId = (option) => String(option?.id ?? option?.value ?? "");
const optionLabel = (option) =>
  typeof option === "string"
    ? option
    : option?.label ||
      option?.name ||
      option?.nama ||
      [option?.code || option?.kode, option?.part_number]
        .filter(Boolean)
        .join(" - ") ||
      optionId(option);
const selectedOption = (options, selected) =>
  options.find((option) => optionId(option) === String(selected)) || null;
const dayRange = (from, to) =>
  Math.floor(
    (new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000,
  );

function OptionField({ label, result, value, onChange }) {
  return (
    <Autocomplete
      options={result.options}
      loading={result.loading}
      value={selectedOption(result.options, value)}
      onChange={(_, option) => onChange(option ? optionId(option) : "")}
      isOptionEqualToValue={(option, selected) =>
        optionId(option) === optionId(selected)
      }
      getOptionLabel={optionLabel}
      renderInput={(input) => (
        <TextField
          {...input}
          label={label}
          InputProps={{
            ...input.InputProps,
            endAdornment: (
              <>
                {result.loading ? <CircularProgress size={18} /> : null}
                {input.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

function StageField({ label, value, options, onChange }) {
  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <MenuItem value="">Semua</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {stageLabel(option)}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function MonitoringOrderPartFilter({
  open,
  count,
  draftParams,
  setDraftParams,
  onApply,
  onReset,
  onClose,
}) {
  const [itemInput, setItemInput] = useState("");
  const [optionSearch, setOptionSearch] = useState("");

  useEffect(() => {
    if (open) setItemInput(draftParams.item_search || "");
  }, [draftParams.item_search, open]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setOptionSearch(itemInput.trim()),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [itemInput]);

  const scope = {
    business_id: draftParams.business_id,
    branch_id: draftParams.branch_id,
    warehouse_id: draftParams.warehouse_id,
    limit: 100,
  };
  const businesses = useMonitoringOrderPartOptions("businesses", open, {
    limit: 100,
  });
  const branches = useMonitoringOrderPartOptions("branches", open, {
    business_id: draftParams.business_id,
    limit: 100,
  });
  const warehouses = useMonitoringOrderPartOptions("warehouses", open, {
    business_id: draftParams.business_id,
    branch_id: draftParams.branch_id,
    limit: 100,
  });
  const suppliers = useMonitoringOrderPartOptions("suppliers", open, scope);
  const items = useMonitoringOrderPartOptions("items", open, {
    ...scope,
    search: optionSearch,
  });
  const update = (values) =>
    setDraftParams((previous) => ({ ...previous, ...values }));
  const invalidDates =
    !draftParams.date_from ||
    !draftParams.date_to ||
    draftParams.date_from > draftParams.date_to ||
    dayRange(draftParams.date_from, draftParams.date_to) > 366;

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onOpen={() => {}}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: "100%" } }}
    >
      <Stack sx={{ width: { xs: "100vw", sm: 520 }, minHeight: "100%" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2 }}
        >
          <Stack>
            <Typography variant="h5">Filter Monitoring Order Part</Typography>
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
            <TextField
              select
              fullWidth
              label="Field Tanggal"
              value={draftParams.date_field}
              onChange={(event) => update({ date_field: event.target.value })}
            >
              {[
                "request",
                "validation",
                "approval",
                "po_created",
                "po_verified",
                "invoice",
                "payment",
                "delivery",
                "shipping",
                "receipt",
                "stage_changed",
              ].map((value) => (
                <MenuItem key={value} value={value}>
                  {stageLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Tanggal Mulai"
              value={draftParams.date_from}
              onChange={(event) => update({ date_from: event.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: draftParams.date_to }}
              error={invalidDates}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Tanggal Akhir"
              value={draftParams.date_to}
              onChange={(event) => update({ date_to: event.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draftParams.date_from }}
              error={invalidDates}
              helperText={invalidDates ? "Rentang maksimal 366 hari" : ""}
            />
          </Grid>
          <Grid item xs={12}>
            <OptionField
              label="Bisnis"
              result={businesses}
              value={draftParams.business_id}
              onChange={(value) =>
                update({ business_id: value, branch_id: "", warehouse_id: "" })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <OptionField
              label="Cabang"
              result={branches}
              value={draftParams.branch_id}
              onChange={(value) =>
                update({ branch_id: value, warehouse_id: "" })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <OptionField
              label="Gudang"
              result={warehouses}
              value={draftParams.warehouse_id}
              onChange={(value) => update({ warehouse_id: value })}
            />
          </Grid>
          <Grid item xs={12}>
            <OptionField
              label="Supplier"
              result={suppliers}
              value={draftParams.supplier_id}
              onChange={(value) => update({ supplier_id: value })}
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
                  const search = value.slice(0, 200);
                  setItemInput(search);
                  update({ item_search: search });
                }
              }}
              onChange={(_, value) => {
                const search =
                  typeof value === "string"
                    ? value
                    : value?.code || value?.part_number || value?.label || "";
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
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Kode PR"
              value={draftParams.pr_code}
              onChange={(event) =>
                update({ pr_code: event.target.value.slice(0, 100) })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Kode PO"
              value={draftParams.po_code}
              onChange={(event) =>
                update({ po_code: event.target.value.slice(0, 100) })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StageField
              label="Current Stage"
              value={draftParams.current_stage}
              options={CURRENT_STAGES}
              onChange={(value) => update({ current_stage: value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StageField
              label="Procurement"
              value={draftParams.procurement_stage}
              options={PROCUREMENT_STAGES}
              onChange={(value) => update({ procurement_stage: value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StageField
              label="Finance"
              value={draftParams.finance_stage}
              options={FINANCE_STAGES}
              onChange={(value) => update({ finance_stage: value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StageField
              label="Fulfillment"
              value={draftParams.fulfillment_stage}
              options={FULFILLMENT_STAGES}
              onChange={(value) => update({ fulfillment_stage: value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Prioritas"
              value={draftParams.priority}
              onChange={(event) => update({ priority: event.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              {["P1", "P2", "P3", "P4"].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={draftParams.overdue_only}
                  onChange={(event) =>
                    update({ overdue_only: event.target.checked })
                  }
                />
              }
              label="Overdue saja"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={draftParams.anomaly_only}
                  onChange={(event) =>
                    update({ anomaly_only: event.target.checked })
                  }
                />
              }
              label="Anomaly saja"
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
            disabled={invalidDates}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </SwipeableDrawer>
  );
}
