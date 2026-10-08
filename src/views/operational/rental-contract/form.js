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
} from "iconsax-react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
  useRentalEquipmentOptions,
} from "api/rental-contract";
import { openNotification } from "api/notification";

// Normalisasi tanggal ke format `YYYY-MM-DD` yang dibutuhkan `<input type="date">`.
// Menggunakan moment (zona lokal) agar tidak selisih 1 hari ketika nilai API
// berupa ISO string UTC (mis. "2026-05-10T17:00:00.000Z" => 2026-05-11 di UTC+7).
const toInputDate = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const emptyGroup = () => ({
  equipment: [],
  role: "MAIN",
  effective_from: "",
  effective_to: "",
  billing_unit: "HOUR",
  unit_price: "",
  minimum_quantity: "0",
  minimum_period: "CALENDAR_MONTH",
  notes: "",
});

const units = [
  { value: "HOUR", label: "Per jam kerja", hint: "Durasi waktu kerja" },
  { value: "DAY", label: "Per hari kalender", hint: "Hari kalender" },
  { value: "MONTH", label: "Per bulan kalender", hint: "Bulan kalender" },
];

const minimumPeriods = [
  { value: "DAY", label: "Per hari" },
  { value: "CALENDAR_MONTH", label: "Per bulan kalender" },
  { value: "RENTAL_TERM", label: "Seluruh masa sewa" },
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
  groups: Yup.array()
    .min(1, "Minimal satu grup tarif wajib diisi")
    .of(
      Yup.object({
        equipment: Yup.array()
          .min(1, "Pilih minimal satu equipment")
          .of(
            Yup.object({
              id: Yup.mixed().required("Equipment wajib diisi"),
            }),
          )
          .required("Pilih minimal satu equipment"),
        role: Yup.string()
          .oneOf(["MAIN", "BACKUP"], "Role harus MAIN atau BACKUP")
          .default("MAIN")
          .required("Role wajib diisi"),
        effective_from: Yup.date().required("Wajib diisi"),
        effective_to: Yup.date()
          .min(Yup.ref("effective_from"), "Periode tarif tidak valid")
          .required("Wajib diisi"),
        billing_unit: Yup.string().oneOf(["HOUR", "DAY", "MONTH"]).required(),
        unit_price: Yup.number()
          .moreThan(0, "Harga harus lebih besar dari 0")
          .required("Wajib diisi"),
        minimum_quantity: Yup.number()
          .min(0, "Minimum tidak boleh negatif")
          .required("Wajib diisi"),
        minimum_period: Yup.string()
          .oneOf(["DAY", "CALENDAR_MONTH", "RENTAL_TERM"])
          .required(),
      }),
    )
    .test(
      "equipment-period-overlap",
      "Equipment yang sama tidak boleh memiliki periode tarif yang overlap antar grup",
      (groups) => {
        const entries = [];
        (groups || []).forEach((group, groupIndex) => {
          (group.equipment || []).forEach((eq, eqIndex) => {
            entries.push({
              equipmentId: String(eq.id ?? ""),
              key: `${groupIndex}-${eqIndex}`,
              from: group.effective_from,
              to: group.effective_to,
            });
          });
        });
        return entries.every((entry, index) =>
          entries
            .slice(index + 1)
            .every(
              (other) =>
                entry.equipmentId !== other.equipmentId ||
                entry.equipmentId === "" ||
                !entry.from ||
                !entry.to ||
                !other.from ||
                !other.to ||
                new Date(entry.from) > new Date(other.to) ||
                new Date(other.from) > new Date(entry.to),
            ),
        );
      },
    )
    .test(
      "within-contract-period",
      "Periode tarif harus berada dalam masa kontrak",
      (groups, context) => {
        const { start_date, end_date } = context.parent || {};
        return (groups || []).every(
          (group) =>
            (!start_date ||
              !group.effective_from ||
              new Date(group.effective_from) >= new Date(start_date)) &&
            (!end_date ||
              !group.effective_to ||
              new Date(group.effective_to) <= new Date(end_date)),
        );
      },
    ),
});

const optionLabel = (option) =>
  option
    ? `${option.kode || option.code || option.nomor || option.id} - ${option.nama || option.name || option.model || ""}`
    : "";

function SectionTitle({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={2}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: "primary.lighter",
            color: "primary.main",
            display: "flex",
          }}
        >
          <Icon size={20} />
        </Box>
        <Box>
          <Typography
            variant="overline"
            color="primary.main"
            fontWeight={800}
            letterSpacing={1}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.25 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}

function GroupFields({
  group,
  groupIndex,
  errors,
  touched,
  handleChange,
  equipmentOptions,
  equipmentLoading,
  setFieldValue,
  groupsHelper,
  values,
}) {
  const groupError = getIn(errors, `groups.${groupIndex}`) || {};
  const groupTouched = getIn(touched, `groups.${groupIndex}`) || {};
  const unit = units.find((option) => option.value === group.billing_unit);
  const field = (name) => `groups.${groupIndex}.${name}`;
  const error = (name) => Boolean(groupTouched[name] && groupError[name]);

  const handleEquipmentChange = (_, selectedOptions) => {
    const selectedIds = new Set(
      selectedOptions.map((option) => String(option.id)),
    );
    const kept = (group.equipment || []).filter((eq) =>
      selectedIds.has(String(eq.id)),
    );
    const keptIds = new Set(kept.map((eq) => String(eq.id)));
    const added = selectedOptions
      .filter((option) => !keptIds.has(String(option.id)))
      .map((option) => ({
        id: option.id,
        kode: option.kode || option.code || option.nomor || option.id,
        nama: option.nama || option.name || option.model || "",
      }));
    setFieldValue(field("equipment"), [...kept, ...added]);
  };

  const setGroupRole = (role) => {
    setFieldValue(field("role"), role);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, borderColor: "divider" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.lighter",
              color: "primary.main",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
          >
            {String(groupIndex + 1).padStart(2, "0")}
          </Box>
          <Box>
            <Typography variant="h6">Grup Tarif {groupIndex + 1}</Typography>
            <Typography variant="caption" color="text.secondary">
              {group.equipment.length} equipment ·{" "}
              {group.role === "BACKUP" ? "Cadangan" : "Utama"}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Hapus grup">
            <span>
              <IconButton
                color="error"
                disabled={values.groups.length === 1}
                onClick={() => groupsHelper.remove(groupIndex)}
              >
                <Trash size={19} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Autocomplete
        multiple
        options={equipmentOptions || []}
        loading={equipmentLoading}
        value={group.equipment.map((eq) => ({
          id: eq.id,
          kode: eq.kode,
          nama: eq.nama,
        }))}
        getOptionLabel={optionLabel}
        isOptionEqualToValue={(a, b) => String(a?.id ?? "") === String(b?.id ?? "")}
        onChange={handleEquipmentChange}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                size="small"
                label={optionLabel(option)}
                {...tagProps}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Pilih equipment (multi-select)"
            placeholder="Cari dan pilih satu atau lebih equipment"
            error={error("equipment") || Boolean(groupError.equipment)}
            helperText={
              groupTouched.equipment &&
              (typeof groupError.equipment === "string"
                ? groupError.equipment
                : "Pilih minimal satu equipment")
            }
          />
        )}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Mulai berlaku"
            name={field("effective_from")}
            value={group.effective_from}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={error("effective_from")}
            helperText={groupTouched.effective_from && groupError.effective_from}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Berakhir"
            name={field("effective_to")}
            value={group.effective_to}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={error("effective_to")}
            helperText={groupTouched.effective_to && groupError.effective_to}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            size="small"
            select
            label="Skema tarif"
            name={field("billing_unit")}
            value={group.billing_unit}
            onChange={handleChange}
          >
            {units.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Harga satuan"
            name={field("unit_price")}
            value={group.unit_price}
            onChange={handleChange}
            inputProps={{ min: 0, step: "0.01" }}
            error={error("unit_price")}
            helperText={groupTouched.unit_price && groupError.unit_price}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Minimum kuantitas"
            name={field("minimum_quantity")}
            value={group.minimum_quantity}
            onChange={handleChange}
            inputProps={{ min: 0, step: "0.01" }}
            error={error("minimum_quantity")}
            helperText={
              groupTouched.minimum_quantity && groupError.minimum_quantity
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            select
            label="Minimum berlaku"
            name={field("minimum_period")}
            value={group.minimum_period}
            onChange={handleChange}
          >
            {minimumPeriods.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            size="small"
            label="Catatan tarif (opsional)"
            name={field("notes")}
            value={group.notes}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ height: "100%", pt: { xs: 0, sm: 0.5 } }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
            >
              Role grup
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={group.role || "MAIN"}
              onChange={(_, value) => {
                if (value) setGroupRole(value);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  lineHeight: 1.2,
                },
              }}
            >
              <ToggleButton
                value="MAIN"
                sx={{
                  color: "primary.main",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              >
                MAIN
              </ToggleButton>
              <ToggleButton
                value="BACKUP"
                sx={{
                  color: "warning.main",
                  "&.Mui-selected": {
                    bgcolor: "warning.main",
                    color: "warning.contrastText",
                  },
                }}
              >
                BACKUP
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Grid>

      </Grid>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        {unit?.label || "Skema tarif"} berlaku untuk seluruh equipment dalam
        grup ini.{" "}
        {group.billing_unit === "HOUR"
          ? "Basis: durasi waktu kerja."
          : `Basis: ${unit?.hint || "periode kalender"}.`}
      </Typography>
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
  const { data: equipmentOptions, loading: equipmentLoading } =
    useRentalEquipmentOptions({ limit: 1000 });
  const { bisnisUnit } = useGetBisnisUnit({ my_units: "true" });
  const { penyewa } = useGetPenyewa({ page: 1, perPage: 1000 });
  const bisnisOptions = bisnisUnit?.rows || [];
  const hasOutOfRange =
    getIn(errors, "groups") && typeof getIn(errors, "groups") === "string";
  const duplicateOverlap = hasOutOfRange;
  return (
    <Stack spacing={3}>
      <MainCard
        sx={{
          background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)",
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
                Tentukan siapa penyewanya, unit yang disewa, dan aturan harga
                yang berlaku.
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<ChartSuccess size={17} />}
            label={`${values.groups.length} grup tarif`}
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
          Cara membaca tarif
        </Typography>
        <Typography variant="body2">
          Setiap grup tarif berlaku untuk satu set equipment dengan konfigurasi
          tarif yang sama (periode, skema, harga, minimum). Equipment yang sama
          dapat muncul di beberapa grup jika periodenya tidak overlap.
        </Typography>
      </Alert>
      <MainCard>
        <SectionTitle
          icon={ChartSuccess}
          eyebrow="02 · EQUIPMENT & TARIF"
          title="Grup tarif per equipment"
          description="Setiap grup memiliki konfigurasi tarif bersama untuk equipment terpilih."
          action={
            <Button
              variant="outlined"
              startIcon={<Add size={17} />}
              onClick={() =>
                setFieldValue("groups", [...values.groups, emptyGroup()])
              }
            >
              Tambah grup
            </Button>
          }
        />
        <Divider sx={{ my: 2.5 }} />
        {duplicateOverlap && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.groups}
          </Alert>
        )}
        <FieldArray
          name="groups"
          render={(groupsHelper) => (
            <Stack spacing={2}>
              {values.groups.map((group, groupIndex) => (
                <GroupFields
                  key={groupIndex}
                  group={group}
                  groupIndex={groupIndex}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  equipmentOptions={equipmentOptions}
                  equipmentLoading={equipmentLoading}
                  setFieldValue={setFieldValue}
                  groupsHelper={groupsHelper}
                  values={values}
                />
              ))}
            </Stack>
          )}
        />
      </MainCard>
    </Stack>
  );
}

const regroupItems = (items = []) => {
  const groups = [];
  const keyOf = (item) =>
    [
      item.effective_from || "",
      item.effective_to || "",
      item.billing_unit || "",
      String(item.unit_price ?? ""),
      String(item.minimum_quantity ?? "0"),
      item.minimum_period || "",
      item.notes || "",
      item.role || "MAIN",
    ].join("|");
  items.forEach((item) => {
    const key = keyOf(item);
    let group = groups.find((g) => g._key === key);
    if (!group) {
      group = {
        _key: key,
        equipment: [],
        role: item.role || "MAIN",
        effective_from: toInputDate(item.effective_from),
        effective_to: toInputDate(item.effective_to),
        billing_unit: item.billing_unit || "HOUR",
        unit_price: String(item.unit_price ?? ""),
        minimum_quantity: String(item.minimum_quantity ?? "0"),
        minimum_period: item.minimum_period || "CALENDAR_MONTH",
        notes: item.notes || "",
      };
      groups.push(group);
    }
    const eq = item.equipment || item.equipment_id;
    if (eq && (eq.id || typeof eq === "number" || typeof eq === "string")) {
      const full =
        typeof eq === "object"
          ? eq
          : { id: eq, kode: String(eq), nama: "" };
      group.equipment.push({
        id: full.id,
        kode: full.kode || full.code || full.nomor || full.id,
        nama: full.nama || full.name || full.model || "",
      });
    }
  });
  return groups.map(({ _key, ...rest }) => rest);
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
          groups: regroupItems(detail.items || row.items || []),
        }
      : {
          contract_number: "",
          bisnis_id: "",
          penyewa_id: "",
          start_date: "",
          end_date: "",
          notes: "",
          groups: [emptyGroup()],
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
              notes: values.notes,
              items: values.groups.flatMap((group) =>
                group.equipment.map((eq) => ({
                  equipment_id: Number(eq.id),
                  role: group.role,
                  effective_from: group.effective_from,
                  effective_to: group.effective_to,
                  billing_unit: group.billing_unit,
                  unit_price: String(group.unit_price),
                  minimum_quantity: String(group.minimum_quantity),
                  minimum_period: group.minimum_period,
                  notes: group.notes,
                })),
              ),
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
                    Draft belum memengaruhi invoice atau tagihan.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    onClick={() => router.push("/rental-contracts")}
                  >
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