"use client";

import { useMemo, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "notistack";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import useSWR from "swr";

import { fetcher } from "utils/axios";
import { createDailyBreakdown } from "api/daily-breakdown-form";

const schema = Yup.object({
  equipment_id: Yup.string().required("Equipment wajib dipilih"),
  lokasi_id: Yup.string().required("Lokasi wajib dipilih"),
  breakdown_at: Yup.string().required("Waktu breakdown wajib diisi"),
  pengawas_id: Yup.string().required("Pengawas wajib dipilih"),
  penyewa_id: Yup.string().required("Penyewa wajib dipilih"),
  hmkm_start: Yup.string().nullable(),
  items: Yup.array().of(
    Yup.object({
      problem_issue: Yup.string().trim().min(3, "Minimal 3 karakter").required("Issue wajib diisi"),
    })
  ).min(1, "Minimal 1 issue"),
});

const dateTimeLocal = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const parseActivityTime = (value) => {
  if (!value) return null;
  const parsed = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toBackendDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const unwrapOptions = (value) => {
  const payload = value?.rows ?? value?.data?.rows ?? value?.data ?? value;
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

export default function DailyBreakdownDrawer({ open, onClose, sourceItemId, equipmentId, equipmentKode, equipmentKategori, cabangId, karyawanId, karyawanName, intervalStart, intervalFinish, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);

  const listQuery = new URLSearchParams({ page: "1", perPages: "1000" }).toString();
  const supervisorQuery = cabangId ? `?cabang_id=${encodeURIComponent(cabangId)}` : "";
  const { data: lokasiData, isLoading: lokasiLoading } = useSWR(open ? `/master/lokasi-kerja/list?${listQuery}` : null, fetcher, { revalidateOnFocus: false });
  const { data: shiftData, isLoading: shiftLoading } = useSWR(open ? "/master/shift/list" : null, fetcher, { revalidateOnFocus: false });
  const { data: karyawanData, isLoading: karyawanLoading } = useSWR(open ? `/master/karyawan/pengawas${supervisorQuery}` : null, fetcher, { revalidateOnFocus: false });
  const { data: penyewaData, isLoading: penyewaLoading } = useSWR(open ? `/master/penyewa/list?${listQuery}` : null, fetcher, { revalidateOnFocus: false });

  const lokasiList = unwrapOptions(lokasiData);
  const shiftList = unwrapOptions(shiftData);
  const karyawanList = unwrapOptions(karyawanData);
  const penyewaList = unwrapOptions(penyewaData);

  const minimumBreakdownAt = parseActivityTime(intervalStart);
  const maximumBreakdownAt = parseActivityTime(intervalFinish);
  const initialBreakdownAt = useMemo(() => {
    const minimum = parseActivityTime(intervalStart);
    const maximum = parseActivityTime(intervalFinish);
    const now = open ? new Date() : minimum || new Date();
    if (minimum && maximum && now >= minimum && now <= maximum) {
      return dateTimeLocal(now);
    }
    return minimum ? dateTimeLocal(minimum) : dateTimeLocal(now);
  }, [intervalStart, intervalFinish, open]);

  const initialValues = {
    equipment_id: equipmentId || "",
    lokasi_id: "",
    breakdown_at: initialBreakdownAt,
    shift_id: "",
    pengawas_id: "",
    penyewa_id: "",
    hmkm_start: "",
    items: [{ problem_issue: "", status: "WT" }],
  };

  const handleSubmit = async (values, helpers) => {
    const selectedBreakdownAt = parseActivityTime(values.breakdown_at);
    if (!selectedBreakdownAt || (minimumBreakdownAt && selectedBreakdownAt < minimumBreakdownAt) || (maximumBreakdownAt && selectedBreakdownAt > maximumBreakdownAt)) {
      helpers.setStatus("Waktu breakdown harus berada dalam interval Daily Activity yang dipilih.");
      helpers.setSubmitting(false);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        source_item_id: sourceItemId || null,
        equipment_id: values.equipment_id,
        karyawan_id: karyawanId || null,
        karyawan_name: karyawanName || null,
        lokasi_id: values.lokasi_id,
        breakdown_at: toBackendDateTime(values.breakdown_at),
        shift_id: values.shift_id || null,
        pengawas_id: values.pengawas_id,
        penyewa_id: values.penyewa_id,
        smu: null,
        hmkm_start: values.hmkm_start ? parseFloat(values.hmkm_start) : 0,
        hmkm_end: 0,
        category: equipmentKategori || "",
        items: values.items.map((item) => ({
          problem_issue: item.problem_issue.trim(),
          status: "WT",
          category: equipmentKategori || "",
        })),
      };
      const result = await createDailyBreakdown(payload);
      enqueueSnackbar("Breakdown berhasil dibuat. Equipment status telah diperbarui.", { variant: "success" });
      helpers.resetForm();
      onSuccess?.(result);
      onClose?.();
    } catch (error) {
      const msg = error?.diagnostic?.message || error?.response?.data?.diagnostic?.message || error?.message || "Gagal membuat breakdown";
      enqueueSnackbar(msg, { variant: "error" });
      helpers.setStatus(msg);
    } finally {
      setSaving(false);
      helpers.setSubmitting(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100vw", md: 600 }, maxWidth: "100%", height: "100%" } }}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: "divider", bgcolor: "error.main", color: "#fff" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5 }}>Form Daily Breakdown</Typography>
              <Typography variant="h5" fontWeight={800}>{equipmentKode || "Equipment"}</Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
          <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
            {({ values, errors, touched, status, setFieldValue, handleChange, handleSubmit: formikSubmit, isSubmitting }) => (
              <Box component="form" onSubmit={formikSubmit}>
                <Stack spacing={2.25}>
                  {status && <Alert severity="error">{status}</Alert>}

                  <TextField
                    fullWidth
                    label="Equipment"
                    value={equipmentKode || equipmentId || "-"}
                    size="small"
                    InputProps={{ readOnly: true }}
                    error={touched.equipment_id && Boolean(errors.equipment_id)}
                    helperText={touched.equipment_id && errors.equipment_id}
                  />

                  {/* Breakdown At */}
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Waktu Breakdown"
                    name="breakdown_at"
                    value={values.breakdown_at}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: minimumBreakdownAt ? dateTimeLocal(minimumBreakdownAt) : undefined,
                      max: maximumBreakdownAt ? dateTimeLocal(maximumBreakdownAt) : undefined,
                    }}
                    size="small"
                    error={touched.breakdown_at && Boolean(errors.breakdown_at)}
                    helperText={touched.breakdown_at && errors.breakdown_at}
                  />
                  {minimumBreakdownAt && maximumBreakdownAt && (
                    <Alert severity="info">
                      Interval aktivitas: {dateTimeLocal(minimumBreakdownAt).replace("T", " ")} sampai {dateTimeLocal(maximumBreakdownAt).replace("T", " ")}.
                    </Alert>
                  )}

                  {/* Lokasi */}
                  <Autocomplete
                    fullWidth
                    options={lokasiList}
                    loading={lokasiLoading}
                    value={lokasiList.find((e) => String(e.id) === String(values.lokasi_id)) || null}
                    onChange={(_, val) => setFieldValue("lokasi_id", val?.id || "")}
                    getOptionLabel={(opt) => opt?.nama || ""}
                    isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                    renderInput={(params) => <TextField {...params} label="Lokasi" required size="small" error={touched.lokasi_id && Boolean(errors.lokasi_id)} helperText={touched.lokasi_id && errors.lokasi_id} />}
                  />

                  {/* Shift */}
                  <Autocomplete
                    fullWidth
                    options={shiftList}
                    loading={shiftLoading}
                    value={shiftList.find((e) => String(e.id) === String(values.shift_id)) || null}
                    onChange={(_, val) => setFieldValue("shift_id", val?.id || "")}
                    getOptionLabel={(opt) => opt?.nama || opt?.kode || ""}
                    isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                    renderInput={(params) => <TextField {...params} label="Shift" size="small" />}
                  />

                  {/* Pengawas */}
                  <Autocomplete
                    fullWidth
                    options={karyawanList}
                    loading={karyawanLoading}
                    value={karyawanList.find((e) => String(e.id) === String(values.pengawas_id)) || null}
                    onChange={(_, val) => setFieldValue("pengawas_id", val?.id || "")}
                    getOptionLabel={(opt) => [opt?.nama, opt?.nik || opt?.ktp].filter(Boolean).join(" - ")}
                    isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                    renderInput={(params) => <TextField {...params} label="Pengawas" required size="small" error={touched.pengawas_id && Boolean(errors.pengawas_id)} helperText={touched.pengawas_id && errors.pengawas_id} />}
                  />

                  {/* Penyewa */}
                  <Autocomplete
                    fullWidth
                    options={penyewaList}
                    loading={penyewaLoading}
                    value={penyewaList.find((e) => String(e.id) === String(values.penyewa_id)) || null}
                    onChange={(_, val) => setFieldValue("penyewa_id", val?.id || "")}
                    getOptionLabel={(opt) => opt?.nama || ""}
                    isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
                    renderInput={(params) => <TextField {...params} label="Penyewa" required size="small" error={touched.penyewa_id && Boolean(errors.penyewa_id)} helperText={touched.penyewa_id && errors.penyewa_id} />}
                  />

                  {/* HM/KM Start */}
                  <TextField
                    fullWidth
                    type="number"
                    label="HM/KM Start"
                    name="hmkm_start"
                    value={values.hmkm_start}
                    onChange={handleChange}
                    size="small"
                  />

                  <Divider />

                  {/* Issues */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                        Permasalahan (Issue)
                      </Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={() => setFieldValue("items", [...values.items, { problem_issue: "", status: "WT" }])}>
                        Tambah
                      </Button>
                    </Stack>
                    <Stack spacing={1.5}>
                      {values.items.map((item, index) => (
                        <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label={`Issue ${index + 1}`}
                            value={item.problem_issue}
                            onChange={(e) => setFieldValue(`items.${index}.problem_issue`, e.target.value)}
                            size="small"
                            error={touched.items?.[index]?.problem_issue && Boolean(errors.items?.[index]?.problem_issue)}
                            helperText={touched.items?.[index]?.problem_issue && errors.items?.[index]?.problem_issue}
                          />
                          {values.items.length > 1 && (
                            <IconButton color="error" size="small" onClick={() => setFieldValue("items", values.items.filter((_, i) => i !== index))}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Stack>

                {/* Footer */}
                <Box sx={{ position: "sticky", bottom: 0, left: 0, right: 0, bgcolor: "background.paper", borderTop: 1, borderColor: "divider", p: 2, mt: 2.5, mx: -2.5 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Button fullWidth variant="outlined" color="error" onClick={onClose} disabled={saving}>
                      Batal
                    </Button>
                    <Button fullWidth variant="contained" color="error" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />} type="submit" disabled={saving || isSubmitting}>
                      Simpan Breakdown
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}
          </Formik>
        </Box>
      </Box>
    </Drawer>
  );
}
