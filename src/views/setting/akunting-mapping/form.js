"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Autocomplete,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Formik } from "formik";
import * as Yup from "yup";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import { openNotification } from "api/notification";
import {
  SOURCE_TO_TARGET_DEFAULT,
  fetchAkuntingSources,
  fetchAkuntingTargets,
  upsertAkuntingMapping,
  useAkuntingMappingMeta,
  useGetAkuntingMappings,
} from "api/akunting-mapping";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting" },
  { title: "Akunting Mapping", to: "/akunting-mapping" },
  { title: "Form" },
];

const schema = Yup.object({
  source_system: Yup.string().required(),
  source_entity_type: Yup.string().required("Source type wajib"),
  source_entity_id: Yup.string().required("Source id wajib"),
  target_entity_type: Yup.string().required("Target type wajib"),
  target_entity_id: Yup.string().required("Target wajib dipilih"),
  status: Yup.string().required(),
});

function optionLabel(opt) {
  if (!opt) return "";
  const code = opt.code || opt.kode || "";
  const name = opt.name || opt.nama || opt.legal_name || "";
  return `[${code || opt.id}] ${name}`.trim();
}

export default function AkuntingMappingForm({ mappingId }) {
  const router = useRouter();
  const search = useSearchParams();
  const isEdit = Boolean(mappingId) || search.get("edit") === "1";
  const { meta } = useAkuntingMappingMeta();
  const { rows, dataLoading } = useGetAkuntingMappings(
    mappingId
      ? { source_system: "OPS_BE", status: "", limit: 500, offset: 0 }
      : null,
  );

  const existing = useMemo(
    () => (mappingId ? rows.find((r) => String(r.id) === String(mappingId)) : null),
    [rows, mappingId],
  );

  const sourceTypes = meta?.source_entity_types || [];
  const targetTypes = meta?.target_entity_types || [];
  const statuses = meta?.statuses || ["ACTIVE", "INACTIVE", "PENDING_REVIEW"];

  const [sourceOptions, setSourceOptions] = useState([]);
  const [targetOptions, setTargetOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState(false);

  useEffect(() => {
    fetchAkuntingTargets("COMPANY", { limit: 100 })
      .then(setCompanyOptions)
      .catch(() => setCompanyOptions([]));
  }, []);

  const initialValues = {
    company_id: existing?.company_id || "",
    source_system: existing?.source_system || "OPS_BE",
    source_entity_type: existing?.source_entity_type || "BUSINESS",
    source_entity_id: existing?.source_entity_id || "",
    source_entity_code: existing?.source_entity_code || "",
    source_entity_name: existing?.source_entity_name || "",
    target_entity_type:
      existing?.target_entity_type ||
      SOURCE_TO_TARGET_DEFAULT[existing?.source_entity_type || "BUSINESS"] ||
      "COMPANY",
    target_entity_id: existing?.target_entity_id || "",
    status: existing?.status || "ACTIVE",
    notes: existing?.notes || "",
  };

  const loadSources = async (type, q = "") => {
    if (!type) return;
    setLoadingSource(true);
    try {
      const rowsData = await fetchAkuntingSources(type, { q, limit: 100 });
      setSourceOptions(rowsData);
    } catch (_) {
      setSourceOptions([]);
    } finally {
      setLoadingSource(false);
    }
  };

  const loadTargets = async (type, companyId = "", q = "") => {
    if (!type) return;
    setLoadingTarget(true);
    try {
      const rowsData = await fetchAkuntingTargets(type, {
        company_id: companyId || undefined,
        q,
        limit: 100,
      });
      setTargetOptions(rowsData);
    } catch (_) {
      setTargetOptions([]);
    } finally {
      setLoadingTarget(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={isEdit ? "Edit Akunting Mapping" : "Tambah Akunting Mapping"}
        links={breadcrumbLinks}
      />
      <MainCard title={<BtnBack href="/akunting-mapping" />} content>
        {(isEdit && dataLoading && !existing) ? (
          <Typography>Memuat data...</Typography>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await upsertAkuntingMapping({
                  ...values,
                  company_id: values.company_id || null,
                  source_entity_code: values.source_entity_code || null,
                  source_entity_name: values.source_entity_name || null,
                  notes: values.notes || null,
                });
                openNotification({
                  open: true,
                  title: "Berhasil",
                  message: "Mapping tersimpan",
                  alert: { color: "success" },
                });
                router.push("/akunting-mapping");
              } catch (error) {
                openNotification({
                  open: true,
                  title: "Gagal",
                  message:
                    error?.response?.data?.diagnostic?.message ||
                    error?.message ||
                    "Gagal menyimpan mapping",
                  alert: { color: "error" },
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleSubmit,
              setFieldValue,
              isSubmitting,
            }) => {
              const selectedSource =
                sourceOptions.find((o) => String(o.id) === String(values.source_entity_id)) ||
                (values.source_entity_id
                  ? {
                      id: values.source_entity_id,
                      code: values.source_entity_code,
                      name: values.source_entity_name,
                    }
                  : null);
              const selectedTarget =
                targetOptions.find((o) => String(o.id) === String(values.target_entity_id)) ||
                (values.target_entity_id
                  ? { id: values.target_entity_id, code: "", name: values.target_entity_id }
                  : null);
              const selectedCompany =
                companyOptions.find((o) => String(o.id) === String(values.company_id)) || null;

              return (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        name="source_entity_type"
                        label="Source Entity Type"
                        value={values.source_entity_type}
                        onChange={(e) => {
                          const next = e.target.value;
                          setFieldValue("source_entity_type", next);
                          setFieldValue(
                            "target_entity_type",
                            SOURCE_TO_TARGET_DEFAULT[next] || values.target_entity_type,
                          );
                          setFieldValue("source_entity_id", "");
                          setFieldValue("source_entity_code", "");
                          setFieldValue("source_entity_name", "");
                          loadSources(next);
                          loadTargets(
                            SOURCE_TO_TARGET_DEFAULT[next] || values.target_entity_type,
                            values.company_id,
                          );
                        }}
                        error={touched.source_entity_type && Boolean(errors.source_entity_type)}
                        helperText={touched.source_entity_type && errors.source_entity_type}
                      >
                        {sourceTypes.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label || t.value}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Autocomplete
                        options={sourceOptions}
                        loading={loadingSource}
                        value={selectedSource}
                        getOptionLabel={optionLabel}
                        isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                        onOpen={() => loadSources(values.source_entity_type)}
                        onInputChange={(_, value, reason) => {
                          if (reason === "input") loadSources(values.source_entity_type, value);
                        }}
                        onChange={(_, opt) => {
                          setFieldValue("source_entity_id", opt?.id ? String(opt.id) : "");
                          setFieldValue("source_entity_code", opt?.code || "");
                          setFieldValue("source_entity_name", opt?.name || "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Source (dari OPS / mrt-test)"
                            error={touched.source_entity_id && Boolean(errors.source_entity_id)}
                            helperText={
                              (touched.source_entity_id && errors.source_entity_id) ||
                              "Pilih master OPS, atau ketik ID manual di bawah"
                            }
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="source_entity_id"
                        label="Source Entity ID"
                        value={values.source_entity_id}
                        onChange={handleChange}
                        error={touched.source_entity_id && Boolean(errors.source_entity_id)}
                        helperText={touched.source_entity_id && errors.source_entity_id}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="source_entity_code"
                        label="Source Code"
                        value={values.source_entity_code}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="source_entity_name"
                        label="Source Name"
                        value={values.source_entity_name}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>
                        Target Accounting (dbaccounting)
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={companyOptions}
                        value={selectedCompany}
                        getOptionLabel={optionLabel}
                        isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                        onChange={(_, opt) => {
                          setFieldValue("company_id", opt?.id || "");
                          loadTargets(values.target_entity_type, opt?.id || "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Filter Company (opsional)"
                            helperText="Membatasi pilihan target unit/site/partner/account"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        name="target_entity_type"
                        label="Target Entity Type"
                        value={values.target_entity_type}
                        onChange={(e) => {
                          setFieldValue("target_entity_type", e.target.value);
                          setFieldValue("target_entity_id", "");
                          loadTargets(e.target.value, values.company_id);
                        }}
                      >
                        {targetTypes.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label || t.value}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <Autocomplete
                        options={targetOptions}
                        loading={loadingTarget}
                        value={selectedTarget}
                        getOptionLabel={optionLabel}
                        isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                        onOpen={() => loadTargets(values.target_entity_type, values.company_id)}
                        onInputChange={(_, value, reason) => {
                          if (reason === "input") {
                            loadTargets(values.target_entity_type, values.company_id, value);
                          }
                        }}
                        onChange={(_, opt) => setFieldValue("target_entity_id", opt?.id || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Target Entity"
                            error={touched.target_entity_id && Boolean(errors.target_entity_id)}
                            helperText={touched.target_entity_id && errors.target_entity_id}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        name="status"
                        label="Status"
                        value={values.status}
                        onChange={handleChange}
                      >
                        {statuses.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        name="notes"
                        label="Catatan"
                        value={values.notes}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button variant="outlined" href="/akunting-mapping">
                          Batal
                        </Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                          {isSubmitting ? "Menyimpan..." : "Simpan Mapping"}
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </form>
              );
            }}
          </Formik>
        )}
      </MainCard>
    </Fragment>
  );
}
