"use client";

import { useMemo } from "react";
import moment from "moment";
import { FieldArray, Formik, getIn } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import {
  Add,
  Calendar,
  ChartSuccess,
  InfoCircle,
  Magicpen,
  ReceiptItem,
  Trash,
  TruckFast,
} from "iconsax-react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import { useGetBisnisUnit } from "api/bisnis-unit";
import { useGetPenyewa } from "api/penyewa";
import {
  createRentalContract,
  getErrorMessage,
  updateRentalContract,
  useRentalContract,
  useRentalEquipmentModels,
  RENTAL_TOOLS,
} from "api/rental-contract";
import { openNotification } from "api/notification";

const toInputDate = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const emptyItem = () => ({
  tipe: "",
  model: "",
  quantity: 1,
  billing_unit: "HOUR",
  minimum_quantity: "200",
  minimum_period: "CALENDAR_MONTH",
  notes: "",
  rates: {
    BUCKET: { active: true, unit_price: "" },
    BREAKER: { active: false, unit_price: "" },
    LONGARM: { active: false, unit_price: "" },
  },
});

const billingUnits = [
  { value: "HOUR", label: "Per Jam", hint: "Dihitung per jam kerja (SMU)" },
  { value: "DAY", label: "Per Hari", hint: "Dihitung per hari kalender" },
  { value: "MONTH", label: "Per Bulan", hint: "Dihitung per bulan kalender" },
];

const minimumPeriods = [
  { value: "CALENDAR_MONTH", label: "Per Bulan Kalender" },
  { value: "DAY", label: "Per Hari" },
  { value: "RENTAL_TERM", label: "Seluruh Masa Sewa" },
];

const schema = Yup.object({
  contract_number: Yup.string().trim().required("Nomor kontrak wajib diisi"),
  bisnis_id: Yup.number()
    .positive("Pilih unit bisnis")
    .required("Unit bisnis wajib diisi"),
  penyewa_id: Yup.number()
    .positive("Pilih penyewa")
    .required("Penyewa wajib diisi"),
  start_date: Yup.date().required("Tanggal mulai wajib diisi"),
  end_date: Yup.date()
    .min(Yup.ref("start_date"), "Tanggal akhir harus setelah tanggal mulai")
    .required("Tanggal akhir wajib diisi"),
  items: Yup.array()
    .min(1, "Minimal satu item alat dalam kontrak")
    .test(
      "no-duplicate-models",
      "Tidak boleh ada model equipment yang duplikat dalam 1 form kontrak",
      (items) => {
        if (!items || !items.length) return true;
        const seen = new Set();
        for (const it of items) {
          const m = (it?.model || "").trim().toLowerCase();
          if (m) {
            if (seen.has(m)) return false;
            seen.add(m);
          }
        }
        return true;
      },
    )
    .of(
      Yup.object({
        tipe: Yup.string().trim().required("Kategori / Tipe alat wajib dipilih"),
        model: Yup.string().trim().required("Model equipment wajib dipilih"),
        quantity: Yup.number()
          .typeError("Jumlah unit harus berupa angka")
          .integer("Jumlah unit harus bilangan bulat")
          .min(1, "Jumlah unit minimal 1")
          .required("Jumlah unit wajib diisi"),
        billing_unit: Yup.string()
          .oneOf(["HOUR", "DAY", "MONTH"])
          .required("Satuan sewa wajib dipilih"),
        minimum_quantity: Yup.number().when("billing_unit", {
          is: "HOUR",
          then: (s) =>
            s
              .typeError("Minimum jam harus berupa angka")
              .min(0, "Minimum jam tidak boleh negatif"),
          otherwise: (s) => s.nullable(),
        }),
        rates: Yup.object().test(
          "at-least-one-active-tool-rate",
          "Minimal 1 tools wajib dicentang dan bernilai lebih dari 0",
          (rates) => {
            if (!rates) return false;
            const tools = ["BUCKET", "BREAKER", "LONGARM"];
            return tools.some((t) => {
              const r = rates[t];
              return r?.active && Number(r?.unit_price) > 0;
            });
          },
        ),
      }),
    ),
});

function SectionTitle({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ sm: "center" }}
      spacing={1.5}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: "primary.lighter",
            color: "primary.main",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </Box>
        <Box>
          {eyebrow && (
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 700 }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h5">{title}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}

const optionLabel = (option) => {
  if (!option) return "";
  if (typeof option === "string") return option;
  return (
    option.nama ||
    option.name ||
    option.kode ||
    option.code ||
    String(option.id || "")
  );
};

function ItemFields({
  item,
  index,
  itemsHelper,
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  modelsData = [],
}) {
  const field = (name) => `items[${index}].${name}`;
  const itemError = getIn(errors, `items[${index}]`) || {};
  const itemTouched = getIn(touched, `items[${index}]`) || {};

  const tipeOptions = useMemo(() => {
    const set = new Set();
    modelsData.forEach((m) => {
      if (m.tipe) set.add(m.tipe);
    });
    return Array.from(set).sort();
  }, [modelsData]);

  const modelOptions = useMemo(() => {
    if (!item.tipe) return [];
    const matched = modelsData.filter(
      (m) => (m.tipe || "").toLowerCase() === item.tipe.toLowerCase(),
    );
    const set = new Set();
    matched.forEach((m) => (m.models || []).forEach((mod) => set.add(mod)));
    return Array.from(set).sort();
  }, [modelsData, item.tipe]);

  const handleTipeChange = (_, option) => {
    const val = typeof option === "string" ? option : option || "";
    setFieldValue(field("tipe"), val);
    if (!val) {
      setFieldValue(field("model"), "");
    } else {
      const available = modelsData
        .filter((m) => (m.tipe || "").toLowerCase() === val.toLowerCase())
        .flatMap((m) => m.models || []);
      if (!available.includes(item.model)) {
        setFieldValue(field("model"), "");
      }
    }
  };

  const handleModelChange = (_, option) => {
    const val = typeof option === "string" ? option : option || "";
    setFieldValue(field("model"), val);
  };

  const hasRateError =
    itemError.rates && typeof itemError.rates === "string";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2.5,
        borderColor: "divider",
        position: "relative",
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: "primary.lighter",
                color: "primary.main",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              {index + 1}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {item.model
                  ? `${item.tipe ? item.tipe.toUpperCase() : "ALAT"} · ${item.model}`
                  : `Item Spesifikasi Alat #${index + 1}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.quantity ? `${item.quantity} Unit` : "1 Unit"} ·{" "}
                {item.billing_unit === "HOUR"
                  ? "Sewa Per Jam"
                  : item.billing_unit === "DAY"
                    ? "Sewa Per Hari"
                    : "Sewa Per Bulan"}
              </Typography>
            </Box>
          </Stack>

          {values.items.length > 1 && (
            <Tooltip title="Hapus item">
              <IconButton
                size="small"
                color="error"
                onClick={() => itemsHelper.remove(index)}
              >
                <Trash size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Divider />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={tipeOptions}
              value={item.tipe || null}
              onChange={handleTipeChange}
              freeSolo
              getOptionLabel={(opt) => (opt ? opt.toUpperCase() : "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  size="small"
                  label="Kategori / Tipe Alat"
                  placeholder="Pilih atau ketik tipe (mis. EXCAVATOR)"
                  error={itemTouched.tipe && !!itemError.tipe}
                  helperText={itemTouched.tipe && itemError.tipe}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={modelOptions}
              value={item.model || null}
              onChange={handleModelChange}
              freeSolo
              disabled={!item.tipe && modelOptions.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  size="small"
                  label="Model Equipment"
                  placeholder={
                    item.tipe
                      ? "Pilih atau ketik model (mis. PC200-8)"
                      : "Pilih tipe dahulu"
                  }
                  error={itemTouched.model && !!itemError.model}
                  helperText={itemTouched.model && itemError.model}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Jumlah Unit"
              name={field("quantity")}
              value={item.quantity}
              onChange={handleChange}
              inputProps={{ min: 1, step: 1 }}
              error={itemTouched.quantity && !!itemError.quantity}
              helperText={
                (itemTouched.quantity && itemError.quantity) ||
                "Kebutuhan unit kontrak (min. 1)"
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              required
              size="small"
              label="Satuan Sewa"
              name={field("billing_unit")}
              value={item.billing_unit}
              onChange={handleChange}
              error={itemTouched.billing_unit && !!itemError.billing_unit}
              helperText={itemTouched.billing_unit && itemError.billing_unit}
            >
              {billingUnits.map((u) => (
                <MenuItem key={u.value} value={u.value}>
                  {u.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {item.billing_unit === "HOUR" && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Minimum Jam Kerja"
                  name={field("minimum_quantity")}
                  value={item.minimum_quantity}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">Jam</InputAdornment>
                    ),
                  }}
                  error={
                    itemTouched.minimum_quantity &&
                    !!itemError.minimum_quantity
                  }
                  helperText={
                    (itemTouched.minimum_quantity &&
                      itemError.minimum_quantity) ||
                    "Klausul min. jam (mis. 200)"
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Periode Minimum"
                  name={field("minimum_period")}
                  value={item.minimum_period}
                  onChange={handleChange}
                >
                  {minimumPeriods.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}

          <Grid
            item
            xs={12}
            sm={item.billing_unit === "HOUR" ? 12 : 12}
            md={item.billing_unit === "HOUR" ? 6 : 12}
          >
            <TextField
              fullWidth
              size="small"
              label="Catatan Item (Opsional)"
              name={field("notes")}
              value={item.notes}
              onChange={handleChange}
              placeholder="Spesifikasi khusus, lampiran pekerjaan, dll."
            />
          </Grid>
        </Grid>

        <Card
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "background.default" : "#fafafa",
            borderColor: hasRateError ? "error.main" : "divider",
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              spacing={1}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Konfigurasi Multi-Tools & Tarif Sewa
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pilih attachment tools yang disepakati beserta nominal tarif
                  sewa (min. 1 tools aktif &gt; 0).
                </Typography>
              </Box>
              {hasRateError && (
                <Chip
                  size="small"
                  color="error"
                  label={itemError.rates}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            <Grid container spacing={2}>
              {RENTAL_TOOLS.map((tool) => {
                const toolActive = Boolean(item.rates?.[tool.type]?.active);
                const toolPrice = item.rates?.[tool.type]?.unit_price ?? "";
                const rateField = (prop) =>
                  `items[${index}].rates.${tool.type}.${prop}`;

                return (
                  <Grid item xs={12} md={4} key={tool.type}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: toolActive ? "background.paper" : "transparent",
                        borderColor: toolActive ? "primary.main" : "divider",
                        borderWidth: toolActive ? 2 : 1,
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      <Stack spacing={1.25}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={toolActive}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFieldValue(rateField("active"), checked);
                                if (!checked) {
                                  setFieldValue(rateField("unit_price"), "");
                                }
                              }}
                              color="primary"
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              fontWeight={toolActive ? 700 : 500}
                              color={toolActive ? "text.primary" : "text.secondary"}
                            >
                              {tool.label}
                            </Typography>
                          }
                        />

                        {toolActive ? (
                          <TextField
                            fullWidth
                            required
                            size="small"
                            type="number"
                            label={`Tarif ${tool.type}`}
                            name={rateField("unit_price")}
                            value={toolPrice}
                            onChange={handleChange}
                            inputProps={{ min: 0, step: 1000 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  Rp
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  {item.billing_unit === "HOUR"
                                    ? "/ Jam"
                                    : item.billing_unit === "DAY"
                                      ? "/ Hari"
                                      : "/ Bulan"}
                                </InputAdornment>
                              ),
                            }}
                            error={
                              toolActive &&
                              (!toolPrice || Number(toolPrice) <= 0)
                            }
                            helperText={
                              toolActive &&
                              (!toolPrice || Number(toolPrice) <= 0)
                                ? "Tarif wajib > 0"
                                : ""
                            }
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ pl: 4, display: "block" }}
                          >
                            Tidak diaktifkan
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </Paper>
  );
}

function ContractFields({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
}) {
  const { data: modelsData } = useRentalEquipmentModels();
  const { bisnisUnit } = useGetBisnisUnit({ my_units: "true" });
  const { penyewa } = useGetPenyewa({ page: 1, perPage: 1000 });
  const bisnisOptions = bisnisUnit?.rows || [];

  const itemArrayError =
    errors.items && typeof errors.items === "string" ? errors.items : null;

  return (
    <Stack spacing={3}>
      <MainCard
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 100%)`,
          borderColor: "primary.100",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1.25,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                display: "flex",
              }}
            >
              <Magicpen size={24} />
            </Box>
            <Box>
              <Typography variant="h4">Susun kesepakatan rental</Typography>
              <Typography color="text.secondary">
                Tentukan penyewa, spesifikasi model unit alat berat, dan tarif
                multi-tools attachment.
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<ChartSuccess size={17} />}
            label={`${values.items.length} Model Item`}
            color="primary"
            variant="outlined"
          />
        </Stack>
      </MainCard>

      <MainCard>
        <SectionTitle
          icon={ReceiptItem}
          eyebrow="01 · IDENTITAS"
          title="Informasi kontrak"
          description="Data ini menjadi identitas utama kesepakatan komersial."
        />
        <Divider sx={{ my: 2.5 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Nomor kontrak"
              name="contract_number"
              value={values.contract_number}
              onChange={handleChange}
              error={touched.contract_number && !!errors.contract_number}
              helperText={touched.contract_number && errors.contract_number}
              placeholder="Contoh: KTR-RNT-2026-001"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={bisnisOptions}
              value={
                bisnisOptions.find(
                  (option) => String(option.id) === String(values.bisnis_id),
                ) || null
              }
              getOptionLabel={(option) =>
                option?.nama ||
                option?.name ||
                option?.kode ||
                String(option?.id || "")
              }
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              onChange={(_, option) =>
                setFieldValue("bisnis_id", option?.id || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Unit bisnis"
                  error={touched.bisnis_id && !!errors.bisnis_id}
                  helperText={touched.bisnis_id && errors.bisnis_id}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={penyewa || []}
              value={
                (penyewa || []).find(
                  (option) => String(option.id) === String(values.penyewa_id),
                ) || null
              }
              getOptionLabel={optionLabel}
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              onChange={(_, option) =>
                setFieldValue("penyewa_id", option?.id || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Penyewa"
                  error={touched.penyewa_id && !!errors.penyewa_id}
                  helperText={touched.penyewa_id && errors.penyewa_id}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Mulai kontrak"
              name="start_date"
              value={values.start_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <Calendar size={18} style={{ marginRight: 8 }} />
                ),
              }}
              error={touched.start_date && !!errors.start_date}
              helperText={touched.start_date && errors.start_date}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Akhir kontrak"
              name="end_date"
              value={values.end_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <Calendar size={18} style={{ marginRight: 8 }} />
                ),
              }}
              error={touched.end_date && !!errors.end_date}
              helperText={touched.end_date && errors.end_date}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Catatan kontrak"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              placeholder="Tambahkan konteks site, pekerjaan, atau catatan legal..."
            />
          </Grid>
        </Grid>
      </MainCard>

      <Alert
        severity="info"
        icon={<InfoCircle size={22} />}
        sx={{ borderRadius: 2 }}
      >
        <Typography variant="body2" fontWeight={700}>
          Model Alat & Multi-Tools Attachment
        </Typography>
        <Typography variant="body2">
          Pilih kategori dan model equipment yang disewa. Setiap item dapat
          mengaktifkan beberapa varian attachment tools (Bucket, Breaker, Long
          Arm) dengan tarif sewa masing-masing.
        </Typography>
      </Alert>

      <MainCard>
        <FieldArray
          name="items"
          render={(itemsHelper) => (
            <Stack spacing={2.5}>
              <SectionTitle
                icon={TruckFast}
                eyebrow="02 · SPESIFIKASI ALAT & TARIF"
                title="Daftar Model Alat & Multi-Tools"
                description="Tentukan model unit, jumlah kebutuhan, dan skema tarif attachment."
                action={
                  <Button
                    variant="contained"
                    startIcon={<Add size={17} />}
                    onClick={() => itemsHelper.push(emptyItem())}
                  >
                    Tambah Model Alat
                  </Button>
                }
              />

              <Divider />

              {itemArrayError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {itemArrayError}
                </Alert>
              )}

              {values.items.map((item, index) => (
                <ItemFields
                  key={index}
                  item={item}
                  index={index}
                  itemsHelper={itemsHelper}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  modelsData={modelsData}
                />
              ))}
            </Stack>
          )}
        />
      </MainCard>
    </Stack>
  );
}

const mapContractItemsToForm = (items = []) => {
  if (!items || !items.length) return [emptyItem()];
  return items.map((item) => {
    const ratesMap = {
      BUCKET: { active: false, unit_price: "" },
      BREAKER: { active: false, unit_price: "" },
      LONGARM: { active: false, unit_price: "" },
    };

    const rawRates = item.rates || item.tools_rates || [];
    if (Array.isArray(rawRates) && rawRates.length > 0) {
      rawRates.forEach((r) => {
        const type = (r.tools_type || "").toUpperCase();
        if (ratesMap[type]) {
          ratesMap[type].active =
            r.is_active === "Y" || r.is_active === true || r.is_active === 1;
          ratesMap[type].unit_price = String(r.unit_price ?? "");
        }
      });
    } else if (item.unit_price) {
      ratesMap.BUCKET.active = true;
      ratesMap.BUCKET.unit_price = String(item.unit_price ?? "");
    } else {
      ratesMap.BUCKET.active = true;
    }

    return {
      id: item.id || undefined,
      tipe: item.tipe || item.equipment?.tipe || "",
      model: item.model || item.equipment?.model || item.equipment?.nama || "",
      quantity: Number(item.quantity) || 1,
      billing_unit: item.billing_unit || "HOUR",
      minimum_quantity:
        item.minimum_quantity !== undefined && item.minimum_quantity !== null
          ? String(item.minimum_quantity)
          : "0",
      minimum_period: item.minimum_period || "CALENDAR_MONTH",
      notes: item.notes || "",
      rates: ratesMap,
    };
  });
};

export default function RentalContractForm({ id = null }) {
  const router = useRouter();
  const edit = Boolean(id);
  const { data: detail, loading } = useRentalContract(id);

  const initialValues = useMemo(() => {
    const row = detail?.header || detail || {};
    return edit && detail
      ? {
          contract_number: row.contract_number || "",
          bisnis_id: row.bisnis_id || "",
          penyewa_id: row.penyewa_id || "",
          start_date: toInputDate(row.start_date),
          end_date: toInputDate(row.end_date),
          notes: row.notes || "",
          items: mapContractItemsToForm(detail.items || row.items || []),
        }
      : {
          contract_number: "",
          bisnis_id: "",
          penyewa_id: "",
          start_date: "",
          end_date: "",
          notes: "",
          items: [emptyItem()],
        };
  }, [detail, edit]);

  if (loading) return <Typography>Memuat kontrak...</Typography>;
  if (edit && (detail?.header?.status || detail?.status) === "APPROVED")
    return (
      <Alert severity="info">
        Kontrak yang sudah disetujui bersifat read-only. Buat amendemen atau
        kontrak revisi untuk perubahan.
      </Alert>
    );

  return (
    <>
      <Breadcrumbs
        custom
        heading={edit ? "Edit Kontrak Rental" : "Buat Kontrak Rental"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          {
            title: "Kontrak Tarif Rental",
            to: "/rental-contracts",
          },
          { title: edit ? "Edit" : "Buat" },
        ]}
      />
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, helpers) => {
          try {
            const payload = {
              contract_number: values.contract_number,
              bisnis_id: Number(values.bisnis_id),
              penyewa_id: Number(values.penyewa_id),
              start_date: values.start_date,
              end_date: values.end_date,
              notes: values.notes || "",
              items: values.items.map((it) => {
                const itemRates = [];
                ["BUCKET", "BREAKER", "LONGARM"].forEach((toolType) => {
                  const cfg = it.rates?.[toolType] || {};
                  const isActive = Boolean(cfg.active);
                  const price = Number(cfg.unit_price || 0);
                  itemRates.push({
                    tools_type: toolType,
                    unit_price: isActive ? price : 0,
                    is_active: isActive ? "Y" : "N",
                  });
                });

                return {
                  tipe: it.tipe,
                  model: it.model,
                  quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
                  billing_unit: it.billing_unit,
                  minimum_quantity:
                    it.billing_unit === "HOUR"
                      ? Number(it.minimum_quantity) || 0
                      : null,
                  minimum_period:
                    it.billing_unit === "HOUR"
                      ? it.minimum_period || "CALENDAR_MONTH"
                      : null,
                  notes: it.notes || "",
                  rates: itemRates,
                };
              }),
            };

            const saved = edit
              ? await updateRentalContract(id, payload)
              : await createRentalContract(payload);

            openNotification({
              title: "success",
              message: edit
                ? "Draft kontrak diperbarui"
                : "Draft kontrak dibuat",
              alert: { color: "success" },
            });
            router.push(`/rental-contracts/${saved?.id || id}`);
          } catch (error) {
            openNotification({
              title: "error",
              message: getErrorMessage(error),
              alert: { color: "error" },
            });
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <form onSubmit={props.handleSubmit}>
            <ContractFields {...props} />
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                position: { md: "sticky" },
                bottom: 16,
                bgcolor: "background.paper",
                zIndex: 2,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                spacing={1.5}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <InfoCircle size={19} color="#697586" />
                  <Typography variant="body2" color="text.secondary">
                    Draft belum memengaruhi invoice atau tagihan operasional.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button onClick={() => router.push("/rental-contracts")}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={props.isSubmitting}
                  >
                    {props.isSubmitting ? "Menyimpan..." : "Simpan draft"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </form>
        )}
      </Formik>
    </>
  );
}
