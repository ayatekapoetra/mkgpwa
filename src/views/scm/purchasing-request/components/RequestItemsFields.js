"use client";

import { useMemo, useState } from "react";
import { FieldArray } from "formik";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ArrowDown2, Trash } from "iconsax-react";

import SparepartInfoPanel from "./SparepartInfoPanel";
import { usePurchasingRequestBarangSearch } from "api/purchasing-request";
import {
  getBarangOptionLabel,
  getBarangPrimaryCode,
  getBarangSearchText,
  getRelationName,
  getSelectedOption,
} from "../utils";

export const EMPTY_REQUEST_ITEM = {
  barang_id: "",
  barang: null,
  equipment_id: "",
  equipment: null,
  qty_req: 1,
  stn: "",
  description: "",
};

/** Renders a rich spare-part option so similar parts are easier to distinguish. */
function BarangOptionRow({ option }) {
  const manufacture = getRelationName(option.manufacture);
  const brand = getRelationName(option.brand);
  const application =
    getRelationName(option.application) ||
    option.application ||
    option.category ||
    "";

  return (
    <Box sx={{ width: "100%", py: 0.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            {option.kode || getBarangPrimaryCode(option)} ·{" "}
            {option.nama || option.name || "-"}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {[
              option.num_part ? `PN ${option.num_part}` : null,
              manufacture ? `Mfr ${manufacture}` : null,
              brand ? `Brand ${brand}` : null,
              application ? `App ${application}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Detail sparepart terbatas"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
          {(option.satuan || option.stn) && (
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              label={option.satuan || option.stn}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

/** Renders one expandable request item editor. */
function RequestItemFields({
  item,
  index,
  itemCount,
  itemOptions,
  equipmentOptions,
  itemLoading,
  equipmentLoading = false,
  errors,
  setFieldValue,
  handleChange,
  onRemove,
}) {
  const [barangSearch, setBarangSearch] = useState("");
  const { rows: searchResults = [], loading: searchLoading } =
    usePurchasingRequestBarangSearch(barangSearch);

  // Merge local options with server search results, dedup by id.
  const mergedOptions = useMemo(() => {
    const map = new Map();
    [...searchResults, ...itemOptions].forEach((option) => {
      if (option?.id != null) map.set(String(option.id), option);
    });
    return Array.from(map.values());
  }, [itemOptions, searchResults]);

  const selectedBarang =
    item.barang || getSelectedOption(mergedOptions, item.barang_id);
  const selectedEquipment =
    item.equipment || getSelectedOption(equipmentOptions, item.equipment_id);

  return (
    <Accordion defaultExpanded={index === 0}>
      <AccordionSummary expandIcon={<ArrowDown2 />}>
        <Stack spacing={0.25} sx={{ width: "100%", pr: 1 }}>
          <Typography fontWeight={600}>
            Item {index + 1}:{" "}
            {selectedBarang?.nama || selectedBarang?.name || "Pilih barang"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {[
              selectedBarang?.kode,
              selectedBarang?.num_part ? `PN ${selectedBarang.num_part}` : null,
              getRelationName(selectedBarang?.manufacture)
                ? `Mfr ${getRelationName(selectedBarang.manufacture)}`
                : null,
              getRelationName(selectedBarang?.brand)
                ? `Brand ${getRelationName(selectedBarang.brand)}`
                : null,
              item.stn || selectedBarang?.satuan
                ? `Satuan ${item.stn || selectedBarang?.satuan}`
                : null,
              item.qty_req ? `Qty ${item.qty_req}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Lengkapi sparepart, qty, dan deskripsi item"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(0, 1fr) 110px 110px",
                md: "minmax(0, 2.2fr) 100px 110px minmax(0, 1.4fr)",
              },
              gap: 2,
              alignItems: "flex-start",
              "& .MuiFormControl-root": {
                minHeight: 72,
              },
              "& .MuiInputBase-root": {
                height: 40,
              },
              "& .MuiFormHelperText-root": {
                mx: 0,
                mt: 0.5,
                minHeight: 18,
                lineHeight: 1.2,
              },
            }}
          >
            <Autocomplete
              size="small"
              loading={itemLoading || searchLoading}
              options={mergedOptions}
              filterOptions={(options, state) => {
                const query = String(state.inputValue || "")
                  .trim()
                  .toLowerCase();
                if (!query) return options;
                return options.filter((option) =>
                  getBarangSearchText(option).includes(query),
                );
              }}
              onInputChange={(_, value, reason) => {
                if (reason === "input") setBarangSearch(value);
              }}
              value={selectedBarang}
              getOptionLabel={getBarangOptionLabel}
              isOptionEqualToValue={(option, valueOption) =>
                String(option.id) === String(valueOption.id)
              }
              onChange={(_, option) => {
                setFieldValue(`items.${index}.barang`, option);
                setFieldValue(`items.${index}.barang_id`, option?.id || "");
                setFieldValue(
                  `items.${index}.stn`,
                  option?.satuan || option?.stn || "",
                );
              }}
              renderOption={(props, option) => (
                <li {...props} key={`${option.id}-${option.kode || "barang"}`}>
                  <BarangOptionRow option={option} />
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Barang / Sparepart"
                  placeholder="Cari kode, nama, part number, brand, manufaktur"
                  error={Boolean(errors.items?.[index]?.barang_id) || Boolean(errors.items?.[index]?.description)}
                  helperText={
                    errors.items?.[index]?.description ||
                    errors.items?.[index]?.barang_id ||
                    `${mergedOptions.length} sparepart tersedia · ketik untuk cari lebih lanjut`
                  }
                />
              )}
            />
            <TextField
              size="small"
              name={`items.${index}.qty_req`}
              type="number"
              label="Qty"
              value={item.qty_req}
              onChange={handleChange}
              inputProps={{ min: 0.01, step: 0.01 }}
              required
              helperText=" "
              sx={{ maxWidth: { sm: 110 } }}
            />
            <TextField
              size="small"
              name={`items.${index}.stn`}
              label="Satuan"
              value={item.stn || ""}
              onChange={handleChange}
              required
              sx={{ maxWidth: { sm: 110 } }}
            />
            <Autocomplete
              size="small"
              loading={equipmentLoading}
              options={Array.isArray(equipmentOptions) ? equipmentOptions : []}
              value={selectedEquipment}
              getOptionLabel={(option) =>
                [
                  option?.kode,
                  option?.model || option?.nama || option?.name,
                  option?.manufaktur,
                ]
                  .filter(Boolean)
                  .join(" · ")
              }
              isOptionEqualToValue={(option, valueOption) =>
                String(option?.id) === String(valueOption?.id)
              }
              filterOptions={(options, state) => {
                const query = String(state.inputValue || "")
                  .trim()
                  .toLowerCase();
                if (!query) return options;
                return options.filter((option) =>
                  [
                    option?.kode,
                    option?.model,
                    option?.nama,
                    option?.name,
                    option?.manufaktur,
                    option?.kategori,
                    option?.tipe,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query),
                );
              }}
              onChange={(_, option) => {
                setFieldValue(`items.${index}.equipment`, option);
                setFieldValue(`items.${index}.equipment_id`, option?.id || "");
              }}
              componentsProps={{
                popper: {
                  sx: { zIndex: 2000 },
                  placement: "bottom-start",
                },
              }}
              ListboxProps={{
                style: { maxHeight: 280 },
              }}
              noOptionsText={
                equipmentLoading
                  ? "Memuat equipment..."
                  : "Equipment tidak ditemukan"
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <li
                    key={key || `${option.id}-${option.kode || "eq"}`}
                    {...optionProps}
                  >
                    <Stack sx={{ width: "100%", py: 0.25 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {option.kode || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          option.model || option.nama || option.name,
                          option.manufaktur,
                          option.kategori,
                          option.tipe,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Equipment"}
                      </Typography>
                    </Stack>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Equipment (opsional)"
                  helperText={
                    equipmentLoading
                      ? "Memuat daftar equipment..."
                      : Array.isArray(equipmentOptions) &&
                          equipmentOptions.length > 0
                        ? `${equipmentOptions.length} unit tersedia`
                        : " "
                  }
                />
              )}
              sx={{ gridColumn: { xs: "1", sm: "1 / -1", md: "auto" } }}
            />
            <TextField
              size="small"
              name={`items.${index}.description`}
              label="Deskripsi Item"
              value={item.description || ""}
              onChange={handleChange}
              fullWidth
              required={!item.barang_id}
              placeholder="Catatan kebutuhan, posisi pemasangan, atau referensi WO"
              InputLabelProps={{ shrink: true }}
              sx={{
                gridColumn: "1 / -1",
                "& .MuiOutlinedInput-root": {
                  height: 40,
                  pr: 0.5,
                  boxSizing: "border-box",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 1 }}>
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      startIcon={<Trash />}
                      disabled={itemCount === 1}
                      onClick={onRemove}
                      sx={{
                        height: 32,
                        minWidth: 96,
                        px: 1.25,
                        boxSizing: "border-box",
                      }}
                    >
                      Hapus
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <SparepartInfoPanel
            barang={selectedBarang}
            quantity={item.qty_req}
            unit={item.stn}
            equipment={selectedEquipment}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

/** Manages the repeatable list of spare-part request item fields. */
export default function RequestItemsFields({
  values,
  errors,
  itemOptions,
  equipmentOptions,
  itemLoading,
  equipmentLoading = false,
  setFieldValue,
  handleChange,
}) {
  return (
    <FieldArray name="items">
      {({ push, remove }) => (
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h5">Item Sparepart</Typography>
              <Typography variant="caption" color="text.secondary">
                {values.items.length} item · pastikan kode, PN, manufaktur, dan
                brand sudah sesuai
              </Typography>
            </Box>
            <Button
              startIcon={<Add />}
              onClick={() => push({ ...EMPTY_REQUEST_ITEM })}
            >
              Tambah Item
            </Button>
          </Stack>
          {values.items.map((item, index) => (
            <RequestItemFields
              key={item.id || index}
              item={item}
              index={index}
              itemCount={values.items.length}
              itemOptions={itemOptions}
              equipmentOptions={equipmentOptions}
              itemLoading={itemLoading}
              equipmentLoading={equipmentLoading}
              errors={errors}
              setFieldValue={setFieldValue}
              handleChange={handleChange}
              onRemove={() => remove(index)}
            />
          ))}
        </Stack>
      )}
    </FieldArray>
  );
}
