"use client";

import { Autocomplete, Box, MenuItem, TextField } from "@mui/material";

import { getSelectedOption } from "../utils";

/**
 * Renders header fields in a 12-column grid:
 *   Row 1: Tanggal (6) | Prioritas (6)
 *   Row 2: Bisnis (4) | Cabang (4) | Gudang (4)
 *   Row 3: Deskripsi (12)
 */
export default function RequestHeaderFields({
  values,
  errors,
  touched,
  businessOptions,
  branchOptions,
  warehouseOptions,
  setFieldValue,
  handleChange,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(12, 1fr)" },
        gap: 2,
      }}
    >
      {/* Row 1: Tanggal PR (6) + Prioritas (6) */}
      <TextField
        size="small"
        name="date_ro"
        type="date"
        label="Tanggal PR"
        InputLabelProps={{ shrink: true }}
        value={values.date_ro}
        onChange={handleChange}
        required
        sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}
      />
      <TextField
        size="small"
        name="prioritas"
        select
        label="Prioritas"
        value={values.prioritas}
        onChange={handleChange}
        sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}
      >
        <MenuItem value="P1">P1 - Tinggi</MenuItem>
        <MenuItem value="P2">P2 - Sedang</MenuItem>
        <MenuItem value="P3">P3 - Rendah</MenuItem>
      </TextField>

      {/* Row 2: Bisnis (4) + Cabang (4) + Gudang (4) */}
      <Autocomplete
        size="small"
        options={businessOptions}
        value={getSelectedOption(businessOptions, values.bisnis_id)}
        getOptionLabel={(option) =>
          option.name || option.initial || option.kode || ""
        }
        isOptionEqualToValue={(option, valueOption) =>
          String(option.id) === String(valueOption.id)
        }
        onChange={(_, option) => {
          setFieldValue("bisnis_id", option?.id || "");
          setFieldValue("cabang_id", "");
          setFieldValue("gudang_id", "");
        }}
        sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Bisnis Unit"
            required
            error={touched.bisnis_id && Boolean(errors.bisnis_id)}
            helperText={touched.bisnis_id && errors.bisnis_id}
          />
        )}
      />
      <Autocomplete
        size="small"
        options={branchOptions}
        value={getSelectedOption(branchOptions, values.cabang_id)}
        getOptionLabel={(option) =>
          option.nama || option.name || option.kode || ""
        }
        isOptionEqualToValue={(option, valueOption) =>
          String(option.id) === String(valueOption.id)
        }
        onChange={(_, option) => {
          setFieldValue("cabang_id", option?.id || "");
          setFieldValue("gudang_id", "");
        }}
        sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Cabang"
            required
            error={touched.cabang_id && Boolean(errors.cabang_id)}
            helperText={touched.cabang_id && errors.cabang_id}
          />
        )}
      />
      <Autocomplete
        size="small"
        options={warehouseOptions}
        value={getSelectedOption(warehouseOptions, values.gudang_id)}
        getOptionLabel={(option) =>
          option.nama || option.name || option.kode || ""
        }
        isOptionEqualToValue={(option, valueOption) =>
          String(option.id) === String(valueOption.id)
        }
        onChange={(_, option) => setFieldValue("gudang_id", option?.id || "")}
        sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Gudang"
            required
            error={touched.gudang_id && Boolean(errors.gudang_id)}
            helperText={touched.gudang_id && errors.gudang_id}
          />
        )}
      />

      {/* Row 3: Deskripsi (12) */}
      <TextField
        size="small"
        name="description"
        label="Deskripsi / Narasi PR"
        value={values.description}
        onChange={handleChange}
        multiline
        minRows={2}
        placeholder="Catatan kebutuhan, referensi WO, atau konteks pengajuan"
        sx={{ gridColumn: "span 12" }}
      />
    </Box>
  );
}
