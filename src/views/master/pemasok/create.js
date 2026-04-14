"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { CardActions, Grid, Button, Typography } from "@mui/material";

import { Building3, Send2, User, Location, Call, Sms, Clock } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionBisnisUnit from "components/OptionBisnisUnit";
import InputForm from "components/InputForm";
import RekeningFields from "./rekening-fields";
import axiosServices from "utils/axios";

import { openNotification } from "api/notification";
import { saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Pemasok berhasil dibuat...",
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
  { title: "Pemasok", to: "/pemasok" },
  { title: "Create" },
];

const initialValues = {
  bisnis_id: "",
  kode: "",
  nama: "",
  email: "",
  phone: "",
  alamat: "",
  duedate: 0,
  namacp: "",
  phonecp: "",
  rekening: [],
};

export default function AddPemasokScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    bisnis_id: Yup.number().required("Bisnis Unit wajib diisi"),
    kode: Yup.string().required("Kode wajib diisi"),
    nama: Yup.string().required("Nama wajib diisi"),
    email: Yup.string().email("Email tidak valid").nullable(),
    phone: Yup.string().matches(/^\d*$/, "Phone hanya angka").nullable(),
    duedate: Yup.number().min(0, "Jatuh tempo minimal 0").nullable(),
    namacp: Yup.string().nullable(),
    phonecp: Yup.string().matches(/^\d*$/, "No HP CP hanya angka").nullable(),
    rekening: Yup.array().of(
      Yup.object().shape({
        nm_bank: Yup.string().required("Nama bank wajib"),
        no_rekening: Yup.string().required("No rekening wajib"),
        an: Yup.string().nullable(),
      })
    ),
  });

  const onSubmitHandle = async (values) => {
    const payload = {
      bisnis_id: values.bisnis_id,
      kode: values.kode,
      nama: values.nama,
      email: values.email || null,
      phone: values.phone || null,
      alamat: values.alamat || null,
      duedate: values.duedate || 0,
      namacp: values.namacp || "",
      phonecp: values.phonecp || "",
      rekening: values.rekening || [],
    };

    const config = {
      url: `/master/pemasok/create`,
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `INSERT PEMASOK ${values.nama}`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: "Offline: data disimpan ke antrian" });
      return;
    }

    try {
      await axiosServices(config);
      route.push("/pemasok");
      openNotification(msgSuccess);
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || "Gagal mengirim data" });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Add Pemasok"} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={"/pemasok"} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                <Grid item xs={12} sm={4} sx={{ mb: 4 }}>
                  <OptionBisnisUnit
                    value={values.bisnis_id}
                    name={"bisnis_id"}
                    label="Bisnis Unit"
                    error={errors.bisnis_id}
                    touched={Boolean(true)}
                    startAdornment={<Building3 />}
                    setFieldValue={setFieldValue}
                  />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ mb: 4 }}>
                  <InputForm
                    label="Kode"
                    type="text"
                    name="kode"
                    errors={errors.kode}
                    touched={touched.kode}
                    value={values.kode}
                    onChange={handleChange}
                    startAdornment={<User />}
                  />
                  {Boolean(errors.kode) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.kode}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Nama Pemasok"
                    type="text"
                    name="nama"
                    errors={errors.nama}
                    touched={touched.nama}
                    value={values.nama}
                    onChange={handleChange}
                    startAdornment={<User />}
                  />
                  {Boolean(errors.nama) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.nama}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Email"
                    type="email"
                    name="email"
                    errors={errors.email}
                    touched={touched.email}
                    value={values.email}
                    onChange={handleChange}
                    startAdornment={<Sms />}
                  />
                  {Boolean(errors.email) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.email}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Phone"
                    type="text"
                    name="phone"
                    errors={errors.phone}
                    touched={touched.phone}
                    value={values.phone}
                    onChange={handleChange}
                    startAdornment={<Call />}
                  />
                  {Boolean(errors.phone) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.phone}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={12} sx={{ mb: 4 }}>
                  <InputForm
                    multiline
                    label="Alamat"
                    type="text"
                    name="alamat"
                    rows={5}
                    errors={errors.alamat}
                    touched={touched.alamat}
                    value={values.alamat}
                    onChange={handleChange}
                    startAdornment={<Location />}
                  />
                  {Boolean(errors.alamat) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.alamat}
                    </Typography>
                  )}
                </Grid>

                

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Nama CP"
                    type="text"
                    name="namacp"
                    errors={errors.namacp}
                    touched={touched.namacp}
                    value={values.namacp}
                    onChange={handleChange}
                    startAdornment={<User />}
                  />
                  {Boolean(errors.namacp) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.namacp}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="No HP CP"
                    type="text"
                    name="phonecp"
                    errors={errors.phonecp}
                    touched={touched.phonecp}
                    value={values.phonecp}
                    onChange={handleChange}
                    startAdornment={<Call />}
                  />
                  {Boolean(errors.phonecp) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.phonecp}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <RekeningFields
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    setFieldValue={setFieldValue}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CardActions>
                    <Button component={Link} href="/pemasok" variant="outlined" color="secondary">
                      Batal
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<Send2 />}>
                      Simpan
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
