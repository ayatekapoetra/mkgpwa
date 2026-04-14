"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { CardActions, Grid, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

import { Building3, Send2, Trash, User, Location, Call, Sms, Clock } from "iconsax-react";
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
import { useShowPemasok } from "api/pemasok";
import { replayRequests, saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Pemasok berhasil diupdate...",
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
  { title: "Show" },
];

export default function ShowPemasokScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { pemasok: initialValues, pemasokLoading: dataLoading } = useShowPemasok(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const validationSchema = Yup.object({
    bisnis_id: Yup.number().required("Bisnis Unit wajib diisi"),
    kode: Yup.string().required("Kode wajib diisi"),
    nama: Yup.string().required("Nama wajib diisi"),
    email: Yup.string().email("Email tidak valid").nullable(),
    phone: Yup.string().matches(/^\d*$/, "Phone hanya angka").nullable(),
    duedate: Yup.number().min(0, "Jatuh tempo minimal 0").nullable(),
    namacp: Yup.string().nullable(),
    phonecp: Yup.string().matches(/^\d*$/, "No HP CP hanya angka").nullable(),
    aktif: Yup.string().oneOf(["Y", "N"]).required("Status wajib diisi"),
    rekening: Yup.array().of(
      Yup.object().shape({
        nm_bank: Yup.string().required("Nama bank wajib"),
        no_rekening: Yup.string().required("No rekening wajib"),
        an: Yup.string().nullable(),
      })
    ),
  });

  useEffect(() => {
    const handleOnline = async () => {
      await replayRequests();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const onSubmitHandle = async (values) => {
    const { bisnis, sts_sync, sts_sync_msg, createdby, created_at, updated_at, ...cleanValues } = values;

    const config = {
      url: `/master/pemasok/${id}/update`,
      method: "POST",
      data: { ...cleanValues, rekening: values.rekening || [] },
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `UPDATE PEMASOK ${values.nama}`,
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

  const onDeleteHandle = async () => {
    const config = {
      url: `/master/pemasok/${id}/destroy`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `DELETE PEMASOK ${initialValues?.nama}`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: "Offline: data disimpan ke antrian" });
      return;
    }

    try {
      await axiosServices(config);
      route.push("/pemasok");
      openNotification({ ...msgSuccess, message: "Pemasok berhasil dihapus..." });
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || "Gagal menghapus data" });
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Edit Pemasok"} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={"/pemasok"} />} secondary={null} content={true}>
        <Formik
          initialValues={{
            bisnis_id: initialValues?.bisnis_id || "",
            kode: initialValues?.kode || "",
            nama: initialValues?.nama || "",
            email: initialValues?.email || "",
            phone: initialValues?.phone || "",
            alamat: initialValues?.alamat || "",
            duedate: initialValues?.duedate || 0,
            namacp: initialValues?.namacp || "",
            phonecp: initialValues?.phonecp || "",
            aktif: initialValues?.aktif || "Y",
            rekening: initialValues?.rekening || [],
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
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
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Kode"
                    type="text"
                    name="kode"
                    errors={errors.kode}
                    touched={touched.kode}
                    value={values.kode || ""}
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
                    value={values.nama || ""}
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
                    value={values.email || ""}
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
                    value={values.phone || ""}
                    onChange={handleChange}
                    startAdornment={<Call />}
                  />
                  {Boolean(errors.phone) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.phone}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Alamat"
                    type="text"
                    name="alamat"
                    errors={errors.alamat}
                    touched={touched.alamat}
                    value={values.alamat || ""}
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
                    label="Jatuh Tempo (hari)"
                    type="number"
                    name="duedate"
                    errors={errors.duedate}
                    touched={touched.duedate}
                    value={values.duedate}
                    onChange={handleChange}
                    startAdornment={<Clock />}
                  />
                  {Boolean(errors.duedate) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.duedate}
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
                    value={values.namacp || ""}
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
                    value={values.phonecp || ""}
                    onChange={handleChange}
                    startAdornment={<Call />}
                  />
                  {Boolean(errors.phonecp) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.phonecp}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Status (Y/N)"
                    type="text"
                    name="aktif"
                    errors={errors.aktif}
                    touched={touched.aktif}
                    value={values.aktif || ""}
                    onChange={handleChange}
                    startAdornment={<User />}
                  />
                  {Boolean(errors.aktif) && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.aktif}
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
                    <Button onClick={() => setOpenDeleteDialog(true)} variant="outlined" color="error" startIcon={<Trash />}>
                      Hapus
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<Send2 />}>
                      Update
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </MainCard>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus Pemasok "{initialValues?.nama}"?</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button color="error" onClick={onDeleteHandle} startIcon={<Trash />}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
