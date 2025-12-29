"use client";

import { Fragment, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import {
  CardActions,
  Grid,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";

import {
  Tag2,
  Send2,
  Location,
  Android,
  Building3,
  Back,
  Trash,
} from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionCabang from "components/OptionCabang";
import OptionPenyewa from "components/OptionPenyewa";
import OptionLokasiKerja from "components/OptionLokasiPit";
import axiosServices from "utils/axios";

import { openNotification } from "api/notification";
import { useShowGroupTagTimesheet } from "api/grouptag-timesheet";
import { replayRequests, saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Group Tag Timesheet berhasil diupdate...",
  alert: { color: "success" },
};
const msgError = {
  open: true,
  title: "error",
  message: "",
  alert: { color: "error" },
};

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting", to: "/setting" },
  { title: "Group Tag Timesheet", to: "/timesheet-tag" },
  { title: "Edit" },
];

export default function EditGroupTagTimesheetScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { data: initialValues, dataLoading } = useShowGroupTagTimesheet(id);

  console.log("DEBUG INITIAL VALUES FROM API:", initialValues);

  const validationSchema = Yup.object({
    kegiatan: Yup.string()
      .oneOf(
        ["rental", "barging", "mining", "explorasi"],
        "Pilih salah satu jenis kegiatan",
      )
      .required("Jenis kegiatan wajib dipilih"),
    cabang_id: Yup.string().required("Cabang wajib dipilih"),
    penyewa_id: Yup.string().required("Penyewa wajib dipilih"),
    pit_id: Yup.string().required("Lokasi Kerja wajib dipilih"),
  });

  useEffect(() => {
    const handleOnline = async () => {
      console.log("🔄 Koneksi kembali online → replay request offline...");
      await replayRequests();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const onSubmitHandle = async (values) => {
    const payload = {
      kegiatan: values.kegiatan,
      cabang_id: values.cabang_id,
      penyewa_id: values.penyewa_id,
      pit_id:
        typeof values.pit_id === "object" ? values.pit_id.id : values.pit_id,
    };

    const config = {
      url: `/api/master/grouptag-timesheet/${id}/update`,
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `UPDATE GROUP TAG KEGIATAN ${values.kegiatan.toUpperCase()}`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveRequest(config);
      openNotification({
        ...msgError,
        message: "Offline: data disimpan ke antrian",
      });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push("/timesheet-tag");
      openNotification(msgSuccess);
    } catch (err) {
      console.error("Submit error:", err);
      openNotification({
        ...msgError,
        message: err?.message || "Gagal mengirim data",
      });
    }
  };

  const onDeleteHandle = async () => {
    const config = {
      url: `/api/master/grouptag-timesheet/${id}/destroy`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `DELETE GROUP TAG KEGIATAN ${initialValues?.kegiatan?.toUpperCase()}`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveRequest(config);
      openNotification({
        ...msgError,
        message: "Offline: data disimpan ke antrian",
      });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push("/timesheet-tag");
      openNotification({
        ...msgSuccess,
        message: "Group Tag berhasil dihapus...",
      });
    } catch (err) {
      console.error("Delete error:", err);
      openNotification({
        ...msgError,
        message: err?.message || "Gagal menghapus data",
      });
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={"Edit Group Tag Timesheet"}
        links={breadcrumbLinks}
      />
      <MainCard
        title={<BtnBack href={"/timesheet-tag"} />}
        secondary={null}
        content={true}
      >
        <Formik
          initialValues={
            initialValues || {
              kegiatan: "",
              cabang_id: "",
              cabang: null,
              penyewa_id: "",
              penyewa: null,
              pit_id: "",
              pitkerja: null,
            }
          }
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({
            errors,
            handleChange,
            handleBlur,
            handleSubmit,
            touched,
            values,
            setFieldValue,
          }) => {
            console.log(errors);
            console.log("VALUES--", values);

            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid
                  container
                  spacing={3}
                  alignItems="flex-start"
                  justifyContent="flex-start"
                >
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={touched.kegiatan && Boolean(errors.kegiatan)}
                    >
                      <InputLabel id="kegiatan-label">
                        Jenis Kegiatan
                      </InputLabel>
                      <Select
                        labelId="kegiatan-label"
                        name="kegiatan"
                        value={values.kegiatan}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        input={
                          <OutlinedInput
                            startAdornment={
                              <InputAdornment position="start">
                                <Tag2 />
                              </InputAdornment>
                            }
                            label="Jenis Kegiatan"
                          />
                        }
                      >
                        <MenuItem value="">Pilih Kegiatan</MenuItem>
                        <MenuItem value="rental">RENTAL</MenuItem>
                        <MenuItem value="barging">BARGING</MenuItem>
                        <MenuItem value="mining">MINING</MenuItem>
                        <MenuItem value="explorasi">EXPLORASI</MenuItem>
                      </Select>
                      {touched.kegiatan && errors.kegiatan && (
                        <FormHelperText>{errors.kegiatan}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionCabang
                      value={values.cabang_id}
                      name={"cabang_id"}
                      label="Nama Cabang"
                      error={errors.cabang_id}
                      touched={touched.cabang_id}
                      startAdornment={<Building3 />}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        const cabang = value;
                        setFieldValue("cabang", cabang);
                      }}
                    />
                    {Boolean(errors.cabang_id) && touched.cabang_id && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.cabang_id}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionPenyewa
                      value={values.penyewa_id}
                      name={"penyewa_id"}
                      label="Nama Penyewa"
                      error={errors.penyewa_id}
                      touched={touched.penyewa_id}
                      startAdornment={<Android />}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        const penyewa = value;
                        setFieldValue("penyewa", penyewa);
                      }}
                    />
                    {Boolean(errors.penyewa_id) && touched.penyewa_id && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.penyewa_id}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionLokasiKerja
                      value={values.pit_id}
                      name={"pit_id"}
                      label="Lokasi Kerja (Pit)"
                      error={errors.pit_id}
                      touched={touched.pit_id}
                      startAdornment={<Location />}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        const pit = value;
                        setFieldValue("pit", pit);
                      }}
                    />
                    {Boolean(errors.pit_id) && touched.pit_id && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.pit_id}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <CardActions sx={{ justifyContent: "flex-start", px: 0 }}>
                      <Button
                        component={Link}
                        href="/timesheet-tag"
                        variant="outlined"
                        color="secondary"
                        startIcon={<Back />}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={onDeleteHandle}
                        variant="outlined"
                        color="error"
                        startIcon={<Trash />}
                      >
                        Hapus
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<Send2 />}
                      >
                        Update
                      </Button>
                    </CardActions>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
