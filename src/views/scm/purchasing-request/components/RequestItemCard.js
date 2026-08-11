"use client";

import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Shop } from "iconsax-react";

import SparepartInfoPanel from "./SparepartInfoPanel";
import {
  calculateItemTotals,
  formatCurrency,
  getBarangDisplayName,
  getBarangPrimaryCode,
  getRelationName,
  getSelectedOption,
} from "../utils";

/** Renders editable supplier and pricing fields for one selected item. */
function ValidationFields({ item, value, suppliers, onChange }) {
  const selectedSupplier =
    getSelectedOption(suppliers, value.pemasok_id) || item.pemasok || null;
  const totals = calculateItemTotals(value);

  // Grid helper: 12 columns on desktop, each field spans N columns.
  const col = (span) => ({
    gridColumn: { xs: "span 12", md: `span ${span}` },
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(12, 1fr)" },
        gap: 1.5,
      }}
    >
      {/* Supplier — lebar 4/12 */}
      <Autocomplete
        options={suppliers}
        value={selectedSupplier}
        getOptionLabel={(option) =>
          option.nama_pemasok || option.nama || option.name || option.kode || ""
        }
        isOptionEqualToValue={(option, valueOption) =>
          String(option.id) === String(valueOption.id)
        }
        onChange={(_, option) => onChange(item, "pemasok_id", option?.id || "")}
        size="small"
        sx={col(6)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Supplier"
            required
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <Shop size={18} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* Qty Approved — sempit 2/12 */}
      <TextField
        type="number"
        size="small"
        label="Qty Approved"
        value={value.qty_acc}
        onChange={(event) => onChange(item, "qty_acc", event.target.value)}
        sx={col(2)}
      />

      {/* Harga Satuan — 3/12 */}
      <TextField
        type="number"
        size="small"
        label="Harga Satuan"
        value={value.harga}
        onChange={(event) => onChange(item, "harga", event.target.value)}
        sx={col(4)}
      />

      {/* Currency — sempit 2/12 */}
      <TextField
        select
        size="small"
        label="Currency"
        value={value.currency}
        onChange={(event) => onChange(item, "currency", event.target.value)}
        sx={col(2)}
      >
        <MenuItem value="IDR">IDR</MenuItem>
        <MenuItem value="USD">USD</MenuItem>
      </TextField>

      {/* Kurs — hanya tampil jika USD, sempit 2/12 */}
      {value.currency === "USD" && (
        <TextField
          type="number"
          size="small"
          label="Kurs"
          value={value.kurs}
          onChange={(event) => onChange(item, "kurs", event.target.value)}
          sx={col(2)}
        />
      )}

      {/* Diskon — 3/12 */}
      <TextField
        type="number"
        size="small"
        label="Diskon"
        value={value.potongan}
        onChange={(event) => onChange(item, "potongan", event.target.value)}
        sx={col(3)}
      />

      {/* PPN — sempit 2/12 */}
      <TextField
        select
        size="small"
        label="PPN"
        value={value.ppn}
        onChange={(event) => onChange(item, "ppn", event.target.value)}
        sx={col(2)}
      >
        <MenuItem value={0}>0%</MenuItem>
        <MenuItem value={11}>11%</MenuItem>
      </TextField>

      {/* Metode — 2/12 */}
      <TextField
        select
        size="small"
        label="Metode"
        value={value.metode}
        onChange={(event) => onChange(item, "metode", event.target.value)}
        sx={col(2)}
      >
        <MenuItem value="tunai">Tunai</MenuItem>
        <MenuItem value="kredit">Kredit</MenuItem>
      </TextField>

      {/* Subtotal — read-only, 3/12 */}
      <TextField
        size="small"
        label="Subtotal"
        value={formatCurrency(totals.subtotal)}
        InputProps={{ readOnly: true }}
        sx={col(3)}
      />
    </Box>
  );
}

/** Displays the approved quantity, supplier, price, and subtotal for an item. */
function CommercialSummary({ item }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2,1fr)",
          md: "repeat(4,1fr)",
        },
        gap: 1.5,
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary">
          Qty Approved
        </Typography>
        <Typography>
          {item.qty_acc || "-"} {item.stn}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Supplier
        </Typography>
        <Typography>{item.pemasok?.nama_pemasok || item.pemasok?.nama || item.pemasok?.name || "-"}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Harga / PPN
        </Typography>
        <Typography>
          {formatCurrency(item.harga)} / {item.ppn || 0}%
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Subtotal
        </Typography>
        <Typography fontWeight={700}>
          {formatCurrency(item.subtotal)}
        </Typography>
      </Box>
    </Box>
  );
}

/** Displays one request item and its mode-specific selection or validation fields. */
export default function RequestItemCard({
  item,
  index,
  mode,
  suppliers,
  value,
  eligibleValidation,
  eligibleApproval,
  validationSelected,
  approvalSelected,
  onValidationChange,
  onApprovalChange,
  onDraftChange,
}) {
  const selected =
    (mode === "validate" && validationSelected) ||
    (mode === "approve" && approvalSelected);
  const barang = item.barang || null;
  const manufacture = getRelationName(barang?.manufacture);
  const brand = getRelationName(barang?.brand);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.lighter" : "background.paper",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700}>
              {index + 1}. {getBarangDisplayName(barang)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {[
                getBarangPrimaryCode(barang),
                barang?.num_part ? `PN ${barang.num_part}` : null,
                manufacture ? `Mfr ${manufacture}` : null,
                brand ? `Brand ${brand}` : null,
                item.equipment?.kode
                  ? `Unit ${item.equipment.kode}`
                  : "Tanpa equipment",
                `Request ${item.qty_req || "-"} ${item.stn || barang?.satuan || ""}`.trim(),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Box>
          {mode === "validate" && eligibleValidation && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={validationSelected}
                  onChange={(event) => onValidationChange(item.id, event)}
                />
              }
              label="Validasi"
            />
          )}
          {mode === "approve" && eligibleApproval && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={approvalSelected}
                  onChange={(event) => onApprovalChange(item.id, event)}
                />
              }
              label="Approve"
            />
          )}
        </Stack>

        <SparepartInfoPanel
          barang={barang}
          quantity={item.qty_acc || item.qty_req}
          unit={item.stn || barang?.satuan}
          equipment={item.equipment}
          showSupplierRecommendation={mode === "validate" && eligibleValidation}
          dense
        />

        {mode === "validate" && eligibleValidation && validationSelected ? (
          <ValidationFields
            item={item}
            value={value}
            suppliers={suppliers}
            onChange={onDraftChange}
          />
        ) : (
          <CommercialSummary item={item} />
        )}

        <Typography variant="caption" color="text.secondary">
          Validator:{" "}
          {item.validator?.nmlengkap || item.validator?.nama_lengkap || "-"} ·
          Approver:{" "}
          {item.approver?.nmlengkap || item.approver?.nama_lengkap || "-"}
        </Typography>
      </Stack>
    </Paper>
  );
}
