"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
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

import { Tag2, Send2, Location, Android, Building3, Back } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionCabang from "components/OptionCabang";
import OptionPenyewa from "components/OptionPenyewa";
import OptionLokasiPitMulti from "components/OptionLokasiPitMulti";
import axiosServices from "utils/axios";

import { openNotification } from "api/notification";
import { saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Group Tag Timesheet berhasil dibuat...",
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
  { title: "Group Tag Timesheet", to: "/lokasikerja-tag" },
  { title: "Create" },
];

const initialValues = {
  kegiatan: "",
  cabang_id: "",
  cabang: null,
  penyewa_id: "",
  penyewa: null,
  pit_ids: [],
  pits: [],
};

export default function CreateGroupTagTimesheetScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    kegiatan: Yup.string()
      .oneOf(
        ["rental", "barging", "mining", "explorasi"],
        "Pilih salah satu jenis kegiatan",
      )
      .required("Jenis kegiatan wajib dipilih"),
    cabang_id: Yup.string().required("Cabang wajib dipilih"),
    penyewa_id: Yup.string().required("Penyewa wajib dipilih"),
    pit_ids: Yup.array()
      .min(1, "Minimal pilih satu lokasi kerja")
      .required("Lokasi Kerja wajib dipilih"),
  });

  const onSubmitHandle = async (values) => {
    const payload = {
      kegiatan: values.kegiatan,
      cabang_id: values.cabang_id,
      penyewa_id: values.penyewa_id,
      pit_ids: values.pit_ids.map((pit) =>
        typeof pit === "object" ? pit.id : pit,
      ),
    };

    const config = {
      url: `/api/master/grouptag-timesheet`,
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `INSERT GROUP TAG KEGIATAN ${values.kegiatan.toUpperCase()}`,
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
      route.push("/lokasikerja-tag");
      openNotification(msgSuccess);
    } catch (err) {
      console.error("Submit error:", err);
      openNotification({
        ...msgError,
        message: err?.message || "Gagal mengirim data",
      });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={"Tambah Group Tag Timesheet"}
        links={breadcrumbLinks}
      />
      <MainCard
        title={<BtnBack href={"/lokasikerja-tag"} />}
        secondary={null}
        content={true}
      >
        <Formik
          initialValues={initialValues}
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
                  <Grid item xs={12} sm={3}>
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

                  <Grid item xs={12} sm={4}>
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

                  <Grid item xs={12} sm={5}>
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

                  <Grid item xs={12} sm={12}>
                    <OptionLokasiPitMulti
                      value={values.pit_ids}
                      name={"pit_ids"}
                      label="Lokasi Kerja"
                      error={errors.pit_ids}
                      touched={touched.pit_ids}
                      startAdornment={<Location />}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        setFieldValue("pits", value);
                      }}
                    />
                    {Boolean(errors.pit_ids) && touched.pit_ids && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.pit_ids}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <CardActions sx={{ justifyContent: "flex-start", px: 0 }}>
                      <Button
                        component={Link}
                        href="/lokasikerja-tag"
                        variant="outlined"
                        color="secondary"
                        startIcon={<Back />}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<Send2 />}
                      >
                        Simpan
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
