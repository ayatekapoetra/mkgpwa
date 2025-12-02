"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import moment from "moment";

// MATERIAL - UI
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

import IconButton from "components/@extended/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import FormHelperText from "@mui/material/FormHelperText";

// PROJECT IMPORTS
import MainCard from "components/MainCard";
import InputForm from "components/InputForm";
import ConfirmDialog from "components/ConfirmDialog";
import BtnBack from "components/BtnBack";
import OptionCabang from "components/OptionCabang";
import OptionPenyewa from "components/OptionPenyewa";
import OptionLokasiKerja from "components/OptionLokasiPit";
import OptionEquipment from "components/OptionEquipment";
import OptionMaterialMining from "components/OptionMaterialMining";
import OptionKegiatanKerja from "components/OptionKegiatanKerja";
import OptionKaryawan from "components/OptionKaryawan";
import PhotoDropZoneFormik from "components/PhotoDropZoneFormik";
import OfflineIndicator from "components/OfflineIndicator";

// THIRD - PARTY
import {
  Building3,
  Android,
  Ankr,
  Arrow,
  AlignVertically,
  TruckFast,
  Timer1,
  Location,
  UserOctagon,
  GasStation,
  Trash,
  Autobrightness,
  Send2,
  AddSquare,
  CloseSquare,
} from "iconsax-react";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup"; // ⬅ WAJIB

import { useShowDailyTimesheet } from "api/daily-timesheet";
import { openNotification } from "api/notification";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Timesheet berhasil diupdate...",
  alert: { color: "success" },
};
const msgError = {
  open: true,
  title: "error",
  message: "",
  alert: { color: "error" },
};

const BASEURI = "https://cdn.makkuragatama.id";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import CircularLoader from "components/CircularLoader";
import ErrorBoundary from "components/ErrorBoundary";
import axiosServices from "utils/axios";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "TimeSheet", to: "/timesheet" },
  { title: "DT", to: "/timesheet" },
  { title: "Show", to: "#" },
];

// ==============================|| SAMPLE PAGE ||============================== //

const ShowTimesheetScreen = () => {
  const route = useRouter();
  const { id } = useParams();
  const { data: initData, dataLoading } = useShowDailyTimesheet(id);
  console.log("initData--", initData);

  // Standardize initData handling to prevent client-side exceptions
  const standardizedInitData = {
    date_ops: initData?.date_ops || "",
    site_id: initData?.site_id || initData?.cabang_id || "",
    penyewa_id: initData?.penyewa_id || "",
    mainact: initData?.mainact || initData?.activity || "",
    longshift: initData?.longshift || initData?.overtime || "ls0",
    shift_id: initData?.shift_id || "",
    karyawan_id: initData?.karyawan_id || "",
    equipment_id: initData?.equipment_id || "",
    smustart: initData?.smustart || 0,
    smufinish: initData?.smufinish || 0,
    usedsmu: initData?.usedsmu || 0,
    bbm: initData?.bbm || 0,
    keterangan: initData?.keterangan || "",
    photo: initData?.photo || "",
    status: initData?.status || "",
    kegiatan: initData?.items || initData?.kegiatan || [],
  };

  const [openDialog, setOpenDialog] = useState(false);

  const validationSchema = Yup.object().shape({
    date_ops: Yup.date().required("Tanggal wajib diisi"),

    site_id: Yup.string().required("Cabang wajib dipilih"),

    penyewa_id: Yup.string().required("Penyewa wajib dipilih"),

    mainact: Yup.string()
      .oneOf(["mining", "barging", "rental"], "Pilih salah satu aktivitas")
      .required("Group Aktivitas wajib dipilih"),

    longshift: Yup.string()
      .oneOf(["ls0", "ls1", "ls2"], "Pilih salah satu status longshift")
      .required("Status Longshift wajib diisi"),

    shift_id: Yup.string()
      .oneOf(["1", "2"], "Pilih shift yang tersedia")
      .required("Shift kerja wajib dipilih"),

    karyawan_id: Yup.string().required("Operator / Driver wajib dipilih"),

    equipment_id: Yup.string().required("Kode Equipment wajib dipilih"),

    smustart: Yup.number()
      .typeError("HM/KM Start harus angka")
      .required("HM/KM Start wajib diisi"),

    smufinish: Yup.number()
      .typeError("HM/KM Finish harus angka")
      .required("HM/KM Finish wajib diisi")
      .min(
        Yup.ref("smustart"),
        "HM/KM Finish tidak boleh lebih kecil dari Start",
      ),

    usedsmu: Yup.number()
      .typeError("HM/KM Used harus angka")
      .required("HM/KM Used wajib diisi"),

    bbm: Yup.number()
      .typeError("Refuel BBM harus angka")
      .min(0, "Refuel BBM tidak boleh negatif")
      .required("Refuel BBM wajib diisi"),

    keterangan: Yup.string().nullable(),

    photo: Yup.string().nullable(),

    kegiatan: Yup.array()
      .of(
        Yup.object().shape({
          kegiatan_id: Yup.string()
            .nullable()
            .required("Jenis kegiatan wajib dipilih"),

          material_id: Yup.number()
            .nullable()
            .transform((value) =>
              value === "" || value === null || isNaN(value)
                ? null
                : Number(value),
            )
            .when(["$kategori", "kegiatan_id"], {
              is: (kategori, kegiatan_id) =>
                kategori === "DT" && kegiatan_id !== "3",
              then: (schema) => schema.required("Material wajib diisi"),
            }),

          lokasi_id: Yup.string().nullable().required("Lokasi wajib dipilih"),

          lokasi_to: Yup.string()
            .nullable()
            .when("$kategori", {
              is: "DT",
              then: (schema) => schema.required("Lokasi tujuan wajib diisi"),
            }),

          starttime: Yup.date()
            .typeError("Waktu Start tidak valid")
            .required("Waktu Start wajib diisi")
            .test(
              "after-or-equal-date_ops",
              "Waktu Start tidak boleh sebelum date_ops operational",
              function (value) {
                // ambil tanggal dari context Yup (lihat bagian Formik validate)
                const tanggalRoot =
                  this.resolve?.(Yup.ref("$date_ops")) ??
                  (this.options &&
                    this.options.context &&
                    this.options.context.date_ops);

                if (!value || !tanggalRoot) return true; // skip kalau kosong atau tanggal tidak tersedia

                // helper: konversi ke YMD number (YYYYMMDD) untuk perbandingan tanpa jam
                const toYMD = (d) => {
                  const dt = new Date(d);
                  // validasi date
                  if (Number.isNaN(dt.getTime())) return null;
                  const y = dt.getFullYear();
                  const m = dt.getMonth() + 1;
                  const day = dt.getDate();
                  return y * 10000 + m * 100 + day;
                };

                const startYMD = toYMD(value);
                const tanggalYMD = toYMD(tanggalRoot);

                if (startYMD === null || tanggalYMD === null) return true; // biarkan Yup tipeError menangani format

                return startYMD >= tanggalYMD;
              },
            ),

          endtime: Yup.date()
            .typeError("Waktu Finish tidak valid")
            .min(
              Yup.ref("starttime"),
              "Waktu Finish harus lebih besar dari Start",
            )
            .required("Waktu Finish wajib diisi"),

          smustart: Yup.number()
            .typeError("HM Start harus angka")
            .when("$kategori", {
              is: "HE",
              then: (schema) => schema.required("HM Start wajib diisi"),
            }),

          smufinish: Yup.number()
            .typeError("HM Finish harus angka")
            .when("$kategori", {
              is: "HE",
              then: (schema) =>
                schema
                  .required("HM Finish wajib diisi")
                  .min(
                    Yup.ref("smustart"),
                    "HM Finish tidak boleh lebih kecil dari Start",
                  ),
            }),

          seq: Yup.string().required("SEQ wajib diisi"),

          ritase: Yup.string()
            .nullable()
            .when("$kategori", {
              is: "DT",
              then: (schema) => schema.required("Ritase wajib diisi"),
            }),
        }),
      )
      .min(1, "Minimal satu kegiatan harus diisi")
      // 🔥 Cek tumpang tindih antar kegiatan
      .test(
        "no-overlap",
        "Kegiatan tidak boleh saling beririsan",
        function (kegiatanList) {
          if (!Array.isArray(kegiatanList)) return true;
          const sorted = [...kegiatanList].sort(
            (a, b) => new Date(a.starttime) - new Date(b.starttime),
          );

          for (let i = 0; i < sorted.length - 1; i++) {
            const currEnd = new Date(sorted[i].endtime);
            const nextStart = new Date(sorted[i + 1].starttime);

            if (currEnd > nextStart) {
              return this.createError({
                path: `kegiatan[${i + 1}].starttime`,
                message: "Waktu kegiatan tumpang tindih dengan sebelumnya",
              });
            }
          }

          return true;
        },
      ),
  });

  const toggleDialogHandle = () => {
    setOpenDialog(!openDialog);
  };

  const onsubmitHandle = async (values) => {
    console.log("values update---", values);
    try {
      const formData = new FormData();
      // Append all fields
      Object.keys(values).forEach((key) => {
        if (key === "kegiatan") {
          formData.append(key, JSON.stringify(values[key]));
        } else if (key === "photo" && values[key] instanceof File) {
          formData.append(key, values[key]);
        } else {
          formData.append(key, values[key] || "");
        }
      });

      const response = await axiosServices.post(
        `/api/operation/timesheet/${id}/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Check if response indicates offline save
      if (response.status === 0 && response.message?.includes("offline")) {
        openNotification({
          open: true,
          title: "info",
          message:
            "Data disimpan secara offline. Akan disinkronkan saat koneksi tersedia.",
          alert: { color: "info" },
        });
      } else {
        route.push("/timesheet");
        openNotification(msgSuccess);
      }
    } catch (error) {
      console.log(error);
      if (!navigator.onLine) {
        openNotification({
          open: true,
          title: "info",
          message:
            "Data disimpan secara offline. Akan disinkronkan saat koneksi tersedia.",
          alert: { color: "info" },
        });
      } else {
        openNotification({
          ...msgError,
          message: error?.diagnostic?.error || "...",
        });
      }
    }
  };

  const onRemoveHandle = async () => {
    try {
      await axiosServices.delete(`/api/operation/timesheet/${id}`);
      route.push("/timesheet");
      openNotification(msgSuccess);
    } catch (error) {
      console.log(error);
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || "...",
      });
    }
  };

  const onApproveHandle = async () => {
    try {
      await axiosServices.post(`/api/operation/timesheet/${id}/approved`);
      openNotification({
        open: true,
        title: "success",
        message: "Timesheet berhasil diapprove...",
        alert: { color: "success" },
      });
      // Refresh data atau redirect jika needed
      route.refresh();
    } catch (error) {
      console.log(error);
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || "Gagal approve timesheet",
      });
    }
  };

  if (dataLoading) {
    return <CircularLoader />;
  }

  return (
    <ErrorBoundary>
      <Fragment>
        <Breadcrumbs
          custom
          heading={"Show Daily Timesheet"}
          links={breadcrumbLinks}
        />
        <ConfirmDialog
          open={openDialog}
          message={
            <Stack>
              <Typography>
                {"Apakah anda yakin akan menghapus data ini ?"}
              </Typography>
              <Typography
                variant="body"
                component="pre" // agar whitespace dan newline terlihat
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                Data akan dihapus secara permanen dan tidak dapat diakses
                kembali
              </Typography>
            </Stack>
          }
          handleClose={toggleDialogHandle}
          handleAction={onRemoveHandle}
        />
        <MainCard
          title={<BtnBack href={"/timesheet"} />}
          secondary={<OfflineIndicator />}
          content={true}
        >
          <Formik
            enableReinitialize={true}
            initialValues={standardizedInitData}
            validationSchema={validationSchema}
            onSubmit={onsubmitHandle}
          >
            {({
              errors,
              handleChange,
              handleSubmit,
              touched,
              values,
              setFieldValue,
            }) => {
              console.log("values---", values);
              console.log("errors---", errors);

              return (
                <Form noValidate onSubmit={handleSubmit}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <InputForm
                        label="Tanggal"
                        type="date"
                        name="date_ops"
                        errors={errors.date_ops}
                        touched={touched.date_ops}
                        value={moment(values?.date_ops).format("YYYY-MM-DD")}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <OptionCabang
                        value={values.site_id}
                        name={"site_id"}
                        label="Nama Cabang"
                        error={errors.site_id}
                        touched={touched.site_id}
                        startAdornment={<Building3 />}
                        helperText={touched.site_id && errors.site_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <OptionPenyewa
                        value={values.penyewa_id}
                        name={"penyewa_id"}
                        label="Nama Penyewa"
                        error={errors.penyewa_id}
                        touched={touched.penyewa_id}
                        startAdornment={<Android />}
                        helperText={touched.penyewa_id && errors.penyewa_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="activity-label">
                          Group Kegiatan
                        </InputLabel>
                        <Select
                          labelId="activity-label"
                          name="mainact"
                          value={values.mainact}
                          placeholder="Pilih"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Location />
                                </InputAdornment>
                              }
                              label="Group Kegiatan"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={"mining"}>MINING</MenuItem>
                          <MenuItem value={"barging"}>BARGING</MenuItem>
                          <MenuItem value={"rental"}>RENTAL</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ mt: 2 }}>
                      <OptionKaryawan
                        label={"Operator"}
                        name={"karyawan_id"}
                        value={values.karyawan_id}
                        error={errors.karyawan_id}
                        touched={touched.karyawan_id}
                        startAdornment={<UserOctagon />}
                        helperText={touched.karyawan_id && errors.karyawan_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <OptionEquipment
                        value={values.equipment_id}
                        name={"equipment_id"}
                        label="Kode Equipemnt"
                        error={errors.equipment_id}
                        touched={touched.equipment_id}
                        startAdornment={<TruckFast />}
                        helperText={touched.equipment_id && errors.equipment_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <FormControl
                        fullWidth
                        error={errors.shift_id}
                      >
                        <InputLabel id="shift-label">Shift Kerja</InputLabel>
                        <Select
                          labelId="overtime-label"
                          name="shift_id"
                          value={values.shift_id || ""}
                          placeholder="Longshift"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Timer1 />
                                </InputAdornment>
                              }
                              label="Shift Kerja"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={"1"}>Shift 1</MenuItem>
                          <MenuItem value={"2"}>Shift 2</MenuItem>
                        </Select>
                        {touched.shift_id && errors.shift_id && (
                          <FormHelperText>{errors.shift_id}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="overtime-label">
                          Status Longshift
                        </InputLabel>
                        <Select
                          labelId="overtime-label"
                          name="longshift"
                          value={values.longshift}
                          placeholder="Longshift"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Timer1 />
                                </InputAdornment>
                              }
                              label="Status Longshift"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={"ls0"}>Tidak Longshift</MenuItem>
                          <MenuItem value={"ls1"}>Longshift 1</MenuItem>
                          <MenuItem value={"ls2"}>Longshift 2</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="Refuel BBM"
                        type="number"
                        name={"bbm"}
                        startAdornment={<GasStation />}
                        errors={errors}
                        touched={touched}
                        value={values.bbm}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="KM Start"
                        type="text"
                        name="smustart"
                        errors={errors}
                        touched={touched}
                        value={values.smustart}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="KM Finish"
                        type="text"
                        name="smufinish"
                        errors={errors}
                        touched={touched}
                        value={values.smufinish}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                      <InputForm
                        label="KM Used"
                        type="number"
                        name="usedsmu"
                        error={errors.usedsmu}
                        touched={touched.usedsmu}
                        value={values.usedsmu}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                      <InputForm
                        label="Keterangan"
                        type="text"
                        name="keterangan"
                        error={errors.keterangan}
                        touched={touched.keterangan}
                        value={values.keterangan}
                        onChange={handleChange}
                        multiline
                        rows={10}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                      <PhotoDropZoneFormik name="photo" baseUri={BASEURI} />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <FieldArray name="kegiatan">
                        {({ push, remove }) => (
                          <>
                            <MainCard
                              title={<div>Detail Kegiatan</div>}
                              secondary={
                                <Button
                                  onClick={() =>
                                    push({
                                      kegiatan_id: "",
                                      lokasi_id: "",
                                      lokasi_to: "",
                                      material_id: "",
                                      starttime: "",
                                      endtime: "",
                                    })
                                  }
                                  variant="contained"
                                  color="secondary"
                                  startIcon={<AddSquare />}
                                >
                                  Kegiatan
                                </Button>
                              }
                              sx={{ p: 1, mt: 2 }}
                              content={false}
                            >
                              {values.kegiatan?.map((item, idx) => {
                                return (
                                  <Grid
                                    key={idx}
                                    container
                                    spacing={1}
                                    sx={{ alignItems: "center", mb: 5 }}
                                  >
                                    <Grid item xs={12} sm={3}>
                                      <OptionKegiatanKerja
                                        value={item.kegiatan_id}
                                        label={"Jenis Kegiatan"}
                                        name={`kegiatan[${idx}].kegiatan_id`}
                                        error={
                                          touched.kegiatan?.[idx]
                                            ?.kegiatan_id &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.kegiatan_id,
                                          )
                                        }
                                        startAdornment={<Arrow />}
                                        setFieldValue={setFieldValue}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <OptionMaterialMining
                                        value={item.material_id}
                                        label={"Jenis Material"}
                                        name={`kegiatan[${idx}].material_id`}
                                        error={
                                          touched.kegiatan?.[idx]
                                            ?.material_id &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.material_id,
                                          )
                                        }
                                        startAdornment={<Ankr />}
                                        setFieldValue={setFieldValue}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <OptionLokasiKerja
                                        value={item.lokasi_id}
                                        label="Lokasi Awal"
                                        name={`kegiatan[${idx}].lokasi_id`}
                                        error={
                                          touched.kegiatan?.[idx]?.lokasi_id &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.lokasi_id,
                                          )
                                        }
                                        startAdornment={<AlignVertically />}
                                        setFieldValue={setFieldValue}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <OptionLokasiKerja
                                        value={item.lokasi_to}
                                        label="Lokasi Tujuan"
                                        name={`kegiatan[${idx}].lokasi_to`}
                                        error={
                                          touched.kegiatan?.[idx]?.lokasi_to &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.lokasi_to,
                                          )
                                        }
                                        startAdornment={<AlignVertically />}
                                        setFieldValue={setFieldValue}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="SEQ"
                                        type="text"
                                        name={`kegiatan[${idx}].seq`}
                                        error={
                                          touched.kegiatan?.[idx]?.seq &&
                                          Boolean(errors.kegiatan?.[idx]?.seq)
                                        }
                                        value={item.seq}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                      <InputForm
                                        name={`kegiatan[${idx}].starttime`}
                                        label="Job Start"
                                        type="datetime-local"
                                        value={moment(item.starttime).format(
                                          "YYYY-MM-DDTHH:mm",
                                        )}
                                        onChange={handleChange}
                                        touched
                                        errors={
                                          touched.kegiatan?.[idx]?.starttime &&
                                          errors.kegiatan?.[idx]?.starttime
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="Job Finish"
                                        type="datetime-local"
                                        name={`kegiatan[${idx}].endtime`}
                                        error={
                                          touched.kegiatan?.[idx]?.endtime &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.endtime,
                                          )
                                        }
                                        value={moment(item.endtime).format(
                                          "YYYY-MM-DDTHH:mm",
                                        )}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="KM Start"
                                        type="text"
                                        name={`kegiatan[${idx}].smustart`}
                                        error={
                                          touched.kegiatan?.[idx]?.smustart &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.smustart,
                                          )
                                        }
                                        value={item.smustart}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="KM Finish"
                                        type="text"
                                        name={`kegiatan[${idx}].smufinish`}
                                        error={
                                          touched.kegiatan?.[idx]?.smufinish &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.smufinish,
                                          )
                                        }
                                        value={item.smufinish}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="Rit"
                                        type="text"
                                        name={`kegiatan[${idx}].ritase`}
                                        error={
                                          touched.kegiatan?.[idx]?.ritase &&
                                          Boolean(
                                            errors.kegiatan?.[idx]?.ritase,
                                          )
                                        }
                                        value={item.ritase}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                      <Stack>
                                        <Button
                                          onClick={() => remove(idx)}
                                          variant="outlined"
                                          color="error"
                                          startIcon={<CloseSquare />}
                                        >
                                          Hapus Kegiatan
                                        </Button>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                );
                              })}
                            </MainCard>
                          </>
                        )}
                      </FieldArray>
                    </Grid>

                    <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        {
                          values.status !== "A" && (
                            <Stack direction="row" gap={1}>
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<Trash />}
                                onClick={toggleDialogHandle}
                              >
                                Hapus Timesheet
                              </Button>
                            </Stack>
                          )
                        }
                        <Stack direction="row" gap={1}>
                          {values.status !== "A" && (
                            <Button
                              color="warning"
                              variant="shadow"
                              startIcon={<Autobrightness />}
                              onClick={onApproveHandle}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            type="submit"
                            variant="shadow"
                            startIcon={<Send2 />}
                          >
                            Update Data
                          </Button>
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </Form>
              );
            }}
          </Formik>
        </MainCard>
      </Fragment>
    </ErrorBoundary>
  );
};

export default ShowTimesheetScreen;
