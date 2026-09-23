"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ArrowDown2, ArrowUp2, Copy, Trash } from "iconsax-react";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import LoadingButton from "components/@extended/LoadingButton";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import { openNotification } from "api/notification";
import {
  createDailyActivity,
  getDailyActivityMasters,
  getDailyActivityOptions,
  updateDailyActivityStatus,
  useDailyActivity,
  useDailyActivityAccess,
} from "api/daily-activity";
import {
  STATUSES,
  alignBatchToOperation,
  emptyBatch,
  emptyHeader,
  groupItemsIntoBatches,
  moveBatchToSchedule,
  nextBatch,
  normalizeDetail,
  optionLabel,
  serializeBatch,
} from "./utils";

const categories = [
  { id: "mining", nama: "MINING" },
  { id: "rental", nama: "RENTAL" },
  { id: "explorasi", nama: "EXPLORASI" },
];
const weather = ["Cerah", "Mendung", "Hujan"];
const unitCategories = ["HE", "DT", "Drill"];
const EMPTY_MASTERS = {
  branches: [],
  sites: [],
  pits: [],
  equipments: [],
  operators: [],
  supervisors: [],
  activities: [],
  materials: [],
  contractors: [],
};
const EMPTY_PLACEMENT_OPTIONS = { sites: [], pits: [], equipments: [] };
const REQUIRED_HEADER_FIELDS = [
  "date_ops",
  "shift_id",
  "cabang_id",
  "lokasi_site_id",
  "lokasi_pit_id",
  "kontraktor",
  "cuaca",
  "category_id",
  "ctgunit",
];
const DRAFT_KEY = "daily-activity:create-draft:v1";

function selectValue(options, id) {
  return options.find((option) => String(option.id) === String(id)) || null;
}

const branchLabel = (option) =>
  `[${option?.kode || option?.initial || "-"}] ${option?.nama || option?.name || ""}`;

function MasterSelect({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
  loading = false,
  required = false,
  getOptionLabel = optionLabel,
  renderOption,
}) {
  return (
    <Autocomplete
      options={options}
      value={selectValue(options, value)}
      onChange={(_, option) => onChange(option)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
      disabled={disabled}
      loading={loading}
      renderOption={renderOption}
      sx={{
        "& .MuiOutlinedInput-root": { py: "0 !important" },
        "& .MuiAutocomplete-input": { py: "14px !important" },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={!!error}
          helperText={error}
        />
      )}
    />
  );
}

function BatchCard({
  batch,
  index,
  masters,
  availableEquipments = [],
  equipmentLoading = false,
  header,
  errors,
  onChange,
  onDuplicate,
  onRemove,
}) {
  const [expanded, setExpanded] = useState(true);
  const [bulkOperatorId, setBulkOperatorId] = useState("");
  const allowedCategories =
    header.ctgunit.toUpperCase() === "DRILL"
      ? ["AD", "MD"]
      : [header.ctgunit.toUpperCase()];
  const equipmentOptions = availableEquipments.filter(
    (item) =>
      !header.ctgunit ||
      allowedCategories.includes(String(item.kategori || "").toUpperCase()),
  );
  const activities = masters.activities.filter((item) => {
    const subcategory = String(item.subctg || "").toLowerCase();
    if (batch.status === "breakdown") return subcategory === "breakdown";
    if (batch.status === "standby") return subcategory === "standby";
    return subcategory !== "breakdown" && subcategory !== "standby";
  });
  const activityOptions = activities.length ? activities : masters.activities;

  useEffect(() => {
    if (Object.keys(errors).length) setExpanded(true);
  }, [errors]);

  const patchAssignment = (equipmentId, values) =>
    onChange({
      equipment_assignments: {
        ...batch.equipment_assignments,
        [equipmentId]: {
          ...(batch.equipment_assignments[equipmentId] || {}),
          ...values,
        },
      },
    });

  const patchClock = (field, clock) => {
    const startDate = String(
      batch.start_time || `${header.date_ops}T00:00`,
    ).slice(0, 10);
    const startClock =
      field === "start_time"
        ? clock
        : String(batch.start_time || "").slice(11, 16);
    const finishClock =
      field === "finish_time"
        ? clock
        : String(batch.finish_time || "").slice(11, 16);
    const finishDate = new Date(`${startDate}T00:00:00`);
    if (finishClock && startClock && finishClock <= startClock)
      finishDate.setDate(finishDate.getDate() + 1);
    const offset = finishDate.getTimezoneOffset() * 60000;
    const localFinishDate = new Date(finishDate.getTime() - offset)
      .toISOString()
      .slice(0, 10);
    onChange({
      start_time: `${startDate}T${startClock}`,
      finish_time: `${localFinishDate}T${finishClock}`,
    });
  };

  const applyBulkOperator = () => {
    const operator = selectValue(masters.operators, bulkOperatorId);
    if (!operator) return;
    onChange({
      equipment_assignments: Object.fromEntries(
        batch.equipment_ids.map((id) => [
          id,
          {
            ...(batch.equipment_assignments[id] || {}),
            karyawan_id: String(operator.id),
            karyawan_name: optionLabel(operator),
          },
        ]),
      ),
    });
  };

  return (
    <Card
      id={`batch-${batch.client_id}`}
      variant="outlined"
      sx={{ scrollMarginTop: 96 }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          gap={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: expanded ? 2 : 0 }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              label={STATUSES.find((item) => item.id === batch.status)?.label}
              color={STATUSES.find((item) => item.id === batch.status)?.color}
              size="small"
            />
            <Typography variant="subtitle1">Batch {index + 1}</Typography>
            {!expanded && (
              <Typography variant="body2" color="text.secondary">
                {String(batch.start_time).slice(11, 16)}-
                {String(batch.finish_time).slice(11, 16)} ·{" "}
                {batch.kegiatan_name || "Kegiatan belum dipilih"} ·{" "}
                {batch.equipment_ids.length} unit
              </Typography>
            )}
          </Stack>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              size="small"
              startIcon={<Copy size={16} />}
              onClick={onDuplicate}
            >
              Duplikat
            </Button>
            <IconButton
              onClick={() => setExpanded((value) => !value)}
              aria-label={
                expanded
                  ? `Ringkas Batch ${index + 1}`
                  : `Buka Batch ${index + 1}`
              }
            >
              {expanded ? <ArrowUp2 size={18} /> : <ArrowDown2 size={18} />}
            </IconButton>
            <IconButton
              color="error"
              onClick={onRemove}
              aria-label={`Hapus Batch ${index + 1}`}
            >
              <Trash size={20} />
            </IconButton>
          </Stack>
        </Stack>
        {expanded && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Urutan"
                  value={batch.sequence}
                  inputProps={{ maxLength: 50 }}
                  onChange={(e) => onChange({ sequence: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={5}>
                <TextField
                  fullWidth
                  required
                  type="time"
                  label="Waktu Mulai"
                  value={String(batch.start_time).slice(11, 16)}
                  onChange={(e) => patchClock("start_time", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.start_time}
                  helperText={errors.start_time}
                />
              </Grid>
              <Grid item xs={6} sm={5}>
                <TextField
                  fullWidth
                  required
                  type="time"
                  label="Waktu Selesai"
                  value={String(batch.finish_time).slice(11, 16)}
                  onChange={(e) => patchClock("finish_time", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.finish_time}
                  helperText={
                    errors.finish_time ||
                    (String(batch.finish_time).slice(0, 10) !==
                    String(batch.start_time).slice(0, 10)
                      ? "Hari berikutnya"
                      : "")
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <MasterSelect
                  required
                  label="Kegiatan"
                  options={activityOptions}
                  value={batch.kegiatan_id}
                  error={errors.kegiatan_id}
                  onChange={(item) =>
                    onChange({
                      kegiatan_id: String(item?.id || ""),
                      kegiatan_name: optionLabel(item),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <MasterSelect
                  label="Material"
                  options={masters.materials}
                  value={batch.material_id}
                  disabled={batch.status !== "beroperasi"}
                  onChange={(item) =>
                    onChange({
                      material_id: String(item?.id || ""),
                      material_name: optionLabel(item),
                    })
                  }
                />
              </Grid>
              {batch.status === "breakdown" && (
                <Grid item xs={12} md={6}>
                  <MasterSelect
                    label="Pengawas"
                    options={masters.supervisors}
                    value={batch.pengawas_id}
                    onChange={(item) =>
                      onChange({
                        pengawas_id: String(item?.id || ""),
                        pengawas_name: optionLabel(item),
                      })
                    }
                  />
                </Grid>
              )}
              {batch.status === "breakdown" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Masalah Breakdown"
                    value={batch.issue_breakdown}
                    onChange={(e) =>
                      onChange({ issue_breakdown: e.target.value })
                    }
                    error={!!errors.issue_breakdown}
                    helperText={errors.issue_breakdown}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Keterangan Batch"
                  value={batch.note}
                  onChange={(e) => onChange({ note: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  limitTags={2}
                  options={equipmentOptions}
                  loading={equipmentLoading}
                  disabled={!header.cabang_id || !header.lokasi_site_id}
                  noOptionsText={header.lokasi_site_id ? "Tidak ada unit pada mobilisasi terakhir" : "Pilih cabang dan site terlebih dahulu"}
                  value={batch.equipment_ids
                    .map((id) => selectValue(masters.equipments, id) || selectValue(equipmentOptions, id))
                    .filter(Boolean)}
                  onChange={(_, options) => {
                    const equipmentIds = options.map((item) => String(item.id));
                    const assignments = Object.fromEntries(
                      Object.entries(batch.equipment_assignments).filter(
                        ([id]) => equipmentIds.includes(id),
                      ),
                    );
                    onChange({
                      equipment_ids: equipmentIds,
                      equipment_assignments: assignments,
                    });
                  }}
                  getOptionLabel={(item) =>
                    `${item.kode || optionLabel(item)}${item.model ? ` - ${item.model}` : ""}`
                  }
                  isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                  renderOption={(props, item, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} sx={{ mr: 1 }} />
                      {item.kode || optionLabel(item)}
                      {item.model ? ` - ${item.model}` : ""}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Pilih Unit"
                      error={!!errors.equipment_ids}
                      helperText={
                        errors.equipment_ids ||
                        `${batch.equipment_ids.length} unit dipilih`
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
            {batch.equipment_ids.length > 0 && <Divider sx={{ my: 2 }} />}
            <Stack spacing={1.5}>
              {batch.equipment_ids.length > 1 && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "flex-start" }}
                >
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <MasterSelect
                      label="Operator untuk semua unit"
                      options={masters.operators}
                      value={bulkOperatorId}
                      onChange={(item) =>
                        setBulkOperatorId(String(item?.id || ""))
                      }
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    disabled={!bulkOperatorId}
                    onClick={applyBulkOperator}
                    sx={{ minHeight: 40, whiteSpace: "nowrap" }}
                  >
                    Terapkan ke semua
                  </Button>
                </Stack>
              )}
              {batch.equipment_ids.map((equipmentId) => {
                const equipment =
                  selectValue(masters.equipments, equipmentId) || {};
                const assignment =
                  batch.equipment_assignments[equipmentId] || {};
                const category = String(equipment.kategori || "").toUpperCase();
                const operators = masters.operators.filter((item) => {
                  const text =
                    `${item.section || ""} ${item.jabatan || ""} ${item.position || ""}`.toLowerCase();
                  if (category === "DT")
                    return text.includes("driver") || text.includes("drv");
                  if (category === "HE")
                    return text.includes("operator") || text.includes("opr");
                  return true;
                });
                return (
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    key={equipmentId}
                  >
                    <Grid item xs={12} md={3}>
                      <Typography fontWeight={700}>
                        {equipment.kode || equipmentId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {equipment.model || category || "-"}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={batch.status === "breakdown" ? 6 : 9}
                    >
                      <MasterSelect
                        label="Operator / Driver"
                        options={
                          operators.length ? operators : masters.operators
                        }
                        value={assignment.karyawan_id}
                        onChange={(item) =>
                          patchAssignment(equipmentId, {
                            karyawan_id: String(item?.id || ""),
                            karyawan_name: optionLabel(item),
                          })
                        }
                      />
                    </Grid>
                    {batch.status === "breakdown" && (
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="HM/KM sebelum BD"
                          value={assignment.hm_km_bd || ""}
                          onChange={(e) =>
                            patchAssignment(equipmentId, {
                              hm_km_bd: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    )}
                  </Grid>
                );
              })}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DailyActivityForm({ headerId = null }) {
  const edit = !!headerId;
  const router = useRouter();
  const { data: session } = useSession();
  const { permissions, accessLoading, accessError } = useDailyActivityAccess();
  const {
    data: detail,
    dataLoading: detailLoading,
    dataError,
  } = useDailyActivity(headerId, edit && permissions.read);
  const [header, setHeader] = useState(emptyHeader);
  const [batches, setBatches] = useState([]);
  const [activeStatus, setActiveStatus] = useState("beroperasi");
  const [masters, setMasters] = useState(EMPTY_MASTERS);
  const [placementOptions, setPlacementOptions] = useState(EMPTY_PLACEMENT_OPTIONS);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementError, setPlacementError] = useState("");
  const [masterLoading, setMasterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ header: {}, batches: {} });
  const [dirty, setDirty] = useState(false);
  const [draftReady, setDraftReady] = useState(edit);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const restoredDraft = useRef(false);

  useEffect(() => {
    let mounted = true;
    getDailyActivityMasters()
      .then((value) => {
        if (!mounted) return;
        setMasters(value);
        if (value._failed?.length)
          openNotification({
            message: `Sebagian data master gagal dimuat: ${value._failed.join(", ")}`,
            type: "warning",
          });
      })
      .catch((error) =>
        openNotification({
          message: error?.message || "Gagal memuat master data",
          type: "error",
        }),
      )
      .finally(() => mounted && setMasterLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!edit || !detail || !normalizeDetail(detail).header?.id) return;
    const normalized = normalizeDetail(detail);
    setHeader({
      ...emptyHeader(),
      ...normalized.header,
      shift_id: String(normalized.header.shift_id || "1"),
    });
    setBatches(groupItemsIntoBatches(normalized.items));
  }, [detail, edit]);

  useEffect(() => {
    if (edit || !session?.cabang_id) return;
    setHeader((current) =>
      current.cabang_id
        ? current
        : { ...current, cabang_id: String(session.cabang_id) },
    );
  }, [edit, session?.cabang_id]);

  useEffect(() => {
    let active = true;
    if (!header.cabang_id) {
      setPlacementOptions(EMPTY_PLACEMENT_OPTIONS);
      setPlacementError("");
      return () => { active = false; };
    }

    setPlacementLoading(true);
    setPlacementError("");
    getDailyActivityOptions({
      cabang_id: header.cabang_id,
      lokasi_site_id: header.lokasi_site_id
    })
      .then((value) => {
        if (!active) return;
        setPlacementOptions({
          sites: Array.isArray(value?.sites) ? value.sites : [],
          pits: Array.isArray(value?.pits) ? value.pits : [],
          equipments: Array.isArray(value?.equipments) ? value.equipments : []
        });
      })
      .catch((error) => {
        if (!active) return;
        setPlacementOptions(EMPTY_PLACEMENT_OPTIONS);
        setPlacementError(error?.message || "Gagal memuat opsi berdasarkan mobilisasi");
      })
      .finally(() => {
        if (active) setPlacementLoading(false);
      });

    return () => { active = false; };
  }, [header.cabang_id, header.lokasi_site_id]);

  useEffect(() => {
    if (edit || restoredDraft.current) return;
    restoredDraft.current = true;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (draft?.header && Array.isArray(draft.batches)) {
        setHeader({ ...emptyHeader(), ...draft.header });
        setBatches(draft.batches);
        setDirty(true);
        setDraftSavedAt(draft.savedAt || "");
        openNotification({
          message: "Draft Daily Activity berhasil dipulihkan",
          type: "info",
        });
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, [edit]);

  useEffect(() => {
    if (edit || !draftReady || !dirty) return undefined;
    const timeout = setTimeout(() => {
      const savedAt = new Date().toISOString();
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ header, batches, savedAt }),
        );
        setDraftSavedAt(savedAt);
      } catch {
        openNotification({
          message: "Draft tidak dapat disimpan di perangkat ini",
          type: "warning",
        });
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [batches, dirty, draftReady, edit, header]);

  useEffect(() => {
    const warnUnsavedChanges = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnUnsavedChanges);
    return () => window.removeEventListener("beforeunload", warnUnsavedChanges);
  }, [dirty]);

  const statusBatches = batches.filter(
    (batch) => batch.status === activeStatus,
  );
  const headerComplete = REQUIRED_HEADER_FIELDS.every((key) => header[key]);
  const errorCounts = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((status) => [
          status.id,
          batches
            .filter((batch) => batch.status === status.id)
            .reduce(
              (total, batch) =>
                total +
                Object.keys(errors.batches[batch.client_id] || {}).length,
              0,
            ),
        ]),
      ),
    [batches, errors.batches],
  );
  const assignmentCount = batches.reduce(
    (total, batch) => total + batch.equipment_ids.length,
    0,
  );
  const totalErrors =
    Object.keys(errors.header).length +
    Object.values(errors.batches).reduce(
      (total, value) => total + Object.keys(value).length,
      0,
    );

  const updateHeader = (patch) => {
    const changesSchedule =
      (patch.date_ops && patch.date_ops !== header.date_ops) ||
      (patch.shift_id && patch.shift_id !== header.shift_id);
    if (
      changesSchedule &&
      batches.length &&
      !window.confirm(
        "Tanggal atau shift berubah. Sesuaikan seluruh waktu batch ke shift baru?",
      )
    )
      return;
    if (
      patch.ctgunit &&
      patch.ctgunit !== header.ctgunit &&
      batches.some((batch) => batch.equipment_ids.length) &&
      !window.confirm(
        "Kategori unit berubah. Unit yang tidak sesuai akan dihapus dari batch. Lanjutkan?",
      )
    )
      return;

    setHeader((current) => ({ ...current, ...patch }));
    if (changesSchedule) {
      const date = patch.date_ops || header.date_ops;
      const shift = patch.shift_id || header.shift_id;
      setBatches((current) =>
        current.map((batch) =>
          moveBatchToSchedule(batch, date, header.shift_id, shift),
        ),
      );
    }
    if (patch.ctgunit && patch.ctgunit !== header.ctgunit) {
      const allowed =
        patch.ctgunit.toUpperCase() === "DRILL"
          ? ["AD", "MD"]
          : [patch.ctgunit.toUpperCase()];
      setBatches((current) =>
        current.map((batch) => {
          const equipmentIds = batch.equipment_ids.filter((id) => {
            const equipment = selectValue(masters.equipments, id);
            return (
              equipment &&
              allowed.includes(String(equipment.kategori || "").toUpperCase())
            );
          });
          return {
            ...batch,
            equipment_ids: equipmentIds,
            equipment_assignments: Object.fromEntries(
              Object.entries(batch.equipment_assignments).filter(([id]) =>
                equipmentIds.includes(id),
              ),
            ),
          };
        }),
      );
    }
    setDirty(true);
    setErrors((current) => {
      const headerErrors = { ...current.header };
      Object.keys(patch).forEach((key) => delete headerErrors[key]);
      return { ...current, header: headerErrors };
    });
  };
  const updateBatch = (id, patch) => {
    setBatches((current) =>
      current.map((batch) =>
        batch.client_id === id ? { ...batch, ...patch } : batch,
      ),
    );
    setDirty(true);
    setErrors((current) => {
      const batchErrors = { ...(current.batches[id] || {}) };
      Object.keys(patch).forEach((key) => delete batchErrors[key]);
      return { ...current, batches: { ...current.batches, [id]: batchErrors } };
    });
  };
  const addBatch = () => {
    if (!headerComplete) {
      setErrors((current) => ({
        ...current,
        header: {
          ...current.header,
          batches: "Lengkapi informasi umum sebelum menambah batch",
        },
      }));
      document
        .getElementById("daily-activity-header")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBatches((current) => {
      const fresh = emptyBatch(activeStatus, header.date_ops, header.shift_id);
      if (!current.length) return [...current, fresh];
      const previous = current[current.length - 1];
      return [
        ...current,
        nextBatch(
          {
            ...fresh,
            start_time: previous.start_time,
            finish_time: previous.finish_time,
          },
          activeStatus,
        ),
      ];
    });
    setErrors((current) => {
      const headerErrors = { ...current.header };
      delete headerErrors.batches;
      return { ...current, header: headerErrors };
    });
    setDirty(true);
  };
  const duplicateBatch = (batch) => {
    setBatches((current) => [...current, nextBatch(batch)]);
    setDirty(true);
  };
  const removeBatch = (id) => {
    setBatches((current) => current.filter((item) => item.client_id !== id));
    setErrors((current) => {
      const batchErrors = { ...current.batches };
      delete batchErrors[id];
      return { ...current, batches: batchErrors };
    });
    setDirty(true);
  };

  const validate = (batchValues = batches) => {
    const headerErrors = {};
    const availableEquipmentIds = new Set(
      placementOptions.equipments.map((item) => String(item.id)),
    );
    REQUIRED_HEADER_FIELDS.forEach((key) => {
      if (!header[key]) headerErrors[key] = "Wajib diisi";
    });
    const batchErrors = {};
    if (!batchValues.length)
      headerErrors.batches = "Minimal satu batch wajib ditambahkan";
    batchValues.forEach((batch) => {
      const value = {};
      if (!batch.start_time) value.start_time = "Wajib diisi";
      if (!batch.finish_time) value.finish_time = "Wajib diisi";
      if (
        batch.start_time &&
        batch.finish_time &&
        new Date(batch.finish_time) <= new Date(batch.start_time)
      )
        value.finish_time = "Harus setelah waktu start";
      if (!batch.kegiatan_id) value.kegiatan_id = "Kegiatan wajib dipilih";
      if (!batch.equipment_ids.length)
        value.equipment_ids = "Minimal satu equipment wajib dipilih";
      else if (
        batch.equipment_ids.some((id) => !availableEquipmentIds.has(String(id)))
      )
        value.equipment_ids =
          "Terdapat unit yang tidak sesuai dengan mobilisasi terakhir Cabang dan Site";
      if (batch.status === "breakdown" && !batch.issue_breakdown.trim())
        value.issue_breakdown = "Issue breakdown wajib diisi";
      batchErrors[batch.client_id] = value;
    });
    batchValues.forEach((batch, index) => {
      batchValues.slice(index + 1).forEach((other) => {
        const overlaps =
          new Date(batch.start_time) < new Date(other.finish_time) &&
          new Date(other.start_time) < new Date(batch.finish_time);
        const shared = batch.equipment_ids.some((id) =>
          other.equipment_ids.includes(id),
        );
        if (overlaps && shared) {
          batchErrors[batch.client_id].equipment_ids =
            "Unit yang sama memiliki waktu tumpang tindih dengan batch lain";
          batchErrors[other.client_id].equipment_ids =
            "Unit yang sama memiliki waktu tumpang tindih dengan batch lain";
        }
      });
    });
    setErrors({ header: headerErrors, batches: batchErrors });
    const valid =
      !Object.keys(headerErrors).length &&
      Object.values(batchErrors).every((value) => !Object.keys(value).length);
    if (!valid) {
      const firstInvalidBatch = batchValues.find(
        (batch) => Object.keys(batchErrors[batch.client_id] || {}).length,
      );
      if (Object.keys(headerErrors).some((key) => key !== "batches")) {
        document
          .getElementById("daily-activity-header")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (firstInvalidBatch) {
        setActiveStatus(firstInvalidBatch.status);
        setTimeout(
          () =>
            document
              .getElementById(`batch-${firstInvalidBatch.client_id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" }),
          0,
        );
      }
    }
    return valid;
  };

  const save = async (event) => {
    event?.preventDefault();
    const normalizedBatches = batches.map((batch) =>
      alignBatchToOperation(batch, header.date_ops, header.shift_id),
    );
    setBatches(normalizedBatches);
    if (!validate(normalizedBatches)) return;
    setSaving(true);
    const headerPayload = {
      ...header,
      shift_id: Number(header.shift_id),
      author_id: session?.employee_id || null,
      cabang_id: Number(header.cabang_id),
    };
    try {
      if (edit) {
        for (const status of STATUSES) {
          const items = normalizedBatches
            .filter((batch) => batch.status === status.id)
            .map(serializeBatch);
          await updateDailyActivityStatus(
            headerId,
            status.id,
            headerPayload,
            items,
          );
        }
      } else {
        await createDailyActivity({
          ...headerPayload,
          items: normalizedBatches.map(serializeBatch),
        });
      }
      openNotification({
        message: edit
          ? "Daily activity berhasil diperbarui"
          : "Daily activity berhasil disimpan",
        type: "success",
      });
      if (!edit) localStorage.removeItem(DRAFT_KEY);
      setDirty(false);
      router.push("/daily-activity");
      router.refresh();
    } catch (error) {
      openNotification({
        message:
          error?.diagnostic?.message ||
          error?.message ||
          "Gagal menyimpan daily activity",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading || masterLoading || (edit && detailLoading))
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  if (accessError || dataError)
    return (
      <Alert severity="error">
        Gagal memuat data. Pastikan koneksi internet tersedia.
      </Alert>
    );
  if (
    (!edit && !permissions.insert) ||
    (edit && (!permissions.read || !permissions.update))
  )
    return (
      <Alert severity="warning">
        Anda tidak memiliki akses untuk {edit ? "mengubah" : "membuat"} daily
        activity.
      </Alert>
    );

  return (
    <Box component="form" noValidate onSubmit={save} aria-busy={saving}>
      <Breadcrumbs
        custom
        heading={edit ? "Edit Daily Activity" : "Buat Daily Activity"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Daily Activity", to: "/daily-activity" },
          { title: edit ? "Edit" : "Buat" },
        ]}
      />
      {!edit && draftSavedAt && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Draft tersimpan otomatis pukul{" "}
          {new Date(draftSavedAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </Alert>
      )}
      {masters._failed?.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Sebagian pilihan belum tersedia. Muat ulang halaman jika data yang
          Anda perlukan tidak ditemukan.
        </Alert>
      )}
      {placementError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {placementError}
        </Alert>
      )}
      <MainCard
        id="daily-activity-header"
        title="Informasi Umum"
        sx={{ scrollMarginTop: 96 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lengkapi seluruh field bertanda * untuk mulai menambahkan batch.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              type="date"
              label="Tanggal"
              value={header.date_ops}
              onChange={(e) => updateHeader({ date_ops: e.target.value })}
              InputLabelProps={{ shrink: true }}
              error={!!errors.header.date_ops}
              helperText={errors.header.date_ops}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl required fullWidth error={!!errors.header.shift_id}>
              <InputLabel>Shift</InputLabel>
              <Select
                label="Shift"
                value={header.shift_id}
                onChange={(e) => updateHeader({ shift_id: e.target.value })}
              >
                <MenuItem value="1">Siang</MenuItem>
                <MenuItem value="2">Malam</MenuItem>
              </Select>
              <FormHelperText>{errors.header.shift_id}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <MasterSelect
              required
              label="Cabang"
              options={masters.branches}
              value={header.cabang_id}
              error={errors.header.cabang_id}
              getOptionLabel={branchLabel}
              renderOption={(props, item) => (
                <li {...props} key={item.id}>
                  <Stack>
                    <Typography fontWeight={700}>
                      {branchLabel(item)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.bisnis?.name ||
                        item.bisnis?.nama ||
                        item.bisnis_nama ||
                        "-"}
                    </Typography>
                  </Stack>
                </li>
              )}
              onChange={(item) =>
                updateHeader({
                  cabang_id: String(item?.id || ""),
                  lokasi_site_id: "",
                  lokasi_site_nama: "",
                  lokasi_pit_id: "",
                  lokasi_pit_nama: "",
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MasterSelect
              required
              label="Site Penyewa"
              options={placementOptions.sites}
              value={header.lokasi_site_id}
              error={errors.header.lokasi_site_id}
              disabled={!header.cabang_id}
              loading={placementLoading}
              onChange={(item) =>
                updateHeader({
                  lokasi_site_id: String(item?.id || ""),
                  lokasi_site_nama: optionLabel(item),
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MasterSelect
              required
              label="Kontraktor"
              options={masters.contractors}
              value={
                masters.contractors.find(
                  (item) => optionLabel(item) === header.kontraktor,
                )?.id
              }
              error={errors.header.kontraktor}
              onChange={(item) =>
                updateHeader({ kontraktor: optionLabel(item) })
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MasterSelect
              required
              label="Lokasi Pit"
              options={placementOptions.pits}
              value={header.lokasi_pit_id}
              error={errors.header.lokasi_pit_id}
              disabled={!header.cabang_id}
              loading={placementLoading}
              onChange={(item) =>
                updateHeader({
                  lokasi_pit_id: String(item?.id || ""),
                  lokasi_pit_nama: optionLabel(item),
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl required fullWidth error={!!errors.header.cuaca}>
              <InputLabel>Cuaca</InputLabel>
              <Select
                label="Cuaca"
                value={header.cuaca}
                onChange={(e) => updateHeader({ cuaca: e.target.value })}
              >
                {weather.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.header.cuaca}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <MasterSelect
              required
              label="Kategori Kegiatan"
              options={categories}
              value={header.category_id}
              error={errors.header.category_id}
              onChange={(item) => updateHeader({ category_id: item?.id || "" })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl required fullWidth error={!!errors.header.ctgunit}>
              <InputLabel>Kategori Unit</InputLabel>
              <Select
                label="Kategori Unit"
                value={header.ctgunit}
                onChange={(e) => updateHeader({ ctgunit: e.target.value })}
              >
                {unitCategories.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.header.ctgunit}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Catatan Umum"
              value={header.notes || ""}
              onChange={(e) => updateHeader({ notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </MainCard>
      <MainCard
        sx={{ mt: 2 }}
        title="Status dan Batch"
        secondary={
          <Button
            startIcon={<Add />}
            variant="contained"
            disabled={!headerComplete}
            onClick={addBatch}
          >
            Tambah Batch
          </Button>
        }
      >
        {!headerComplete && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Lengkapi informasi umum untuk mengaktifkan tombol Tambah Batch.
          </Alert>
        )}
        <Tabs
          aria-label="Status batch Daily Activity"
          value={activeStatus}
          onChange={(_, value) => setActiveStatus(value)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          {STATUSES.map((status) => (
            <Tab
              key={status.id}
              value={status.id}
              label={`${status.label} (${batches.filter((batch) => batch.status === status.id).length})${errorCounts[status.id] ? ` · ${errorCounts[status.id]} error` : ""}`}
            />
          ))}
        </Tabs>
        {errors.header.batches && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.header.batches}
          </Alert>
        )}
        <Stack spacing={2}>
          {statusBatches.map((batch, index) => (
            <BatchCard
              key={batch.client_id}
              batch={batch}
              index={index}
              masters={masters}
              availableEquipments={placementOptions.equipments}
              equipmentLoading={placementLoading}
              header={header}
              errors={errors.batches[batch.client_id] || {}}
              onChange={(patch) => updateBatch(batch.client_id, patch)}
              onDuplicate={() => duplicateBatch(batch)}
              onRemove={() => removeBatch(batch.client_id)}
            />
          ))}
          {!statusBatches.length && (
            <Alert severity="info">
              Belum ada batch{" "}
              {STATUSES.find((item) => item.id === activeStatus)?.label}. Klik
              Tambah Batch.
            </Alert>
          )}
        </Stack>
      </MainCard>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1.5}
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 5,
          mt: 2,
          mx: { xs: -2, sm: 0 },
          p: 2,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: { sm: 1 },
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="body2"
          color={totalErrors ? "error.main" : "text.secondary"}
        >
          {batches.length} batch · {assignmentCount} assignment
          {totalErrors ? ` · ${totalErrors} error` : ""}
        </Typography>
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button
            color="secondary"
            onClick={() => {
              if (
                !dirty ||
                window.confirm("Perubahan belum disimpan. Tetap keluar?")
              )
                router.push("/daily-activity");
            }}
          >
            Batal
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={saving}
            disabled={placementLoading || Boolean(placementError)}
          >
            {edit ? "Simpan Perubahan" : "Simpan Daily Activity"}
          </LoadingButton>
        </Stack>
      </Stack>
    </Box>
  );
}
