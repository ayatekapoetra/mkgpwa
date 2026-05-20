"use client";

import { Fragment, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  CardActions,
  Grid,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  Select,
  MenuItem,
} from "@mui/material";
import { Tag2, Send2, Back, UserOctagon, Trash } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import axiosServices from "utils/axios";
import { openNotification } from "api/notification";
import { useShowGroupTagKegiatan } from "api/grouptag-kegiatan";
import OptionKegiatanKerja from "components/OptionKegiatanKerja";
import OptionMaterialMining from "components/OptionMaterialMining";
import OptionPenyewa from "components/OptionPenyewa";

const msgSuccessDelete = {
  open: true,
  title: "success",
  message: "Data berhasil dihapus",
  alert: { color: "success" },
};

const msgSuccessUpdate = {
  open: true,
  title: "success",
  message: "Data berhasil diupdate",
  alert: { color: "success" },
};

const msgError = {
  open: true,
  title: "error",
  message: "Terjadi kesalahan",
  alert: { color: "error" },
};

const breadcrumbLinks = [
  { title: "Home", to: "/" },
  { title: "Setting", to: "/setting" },
  { title: "Group Tag Kegiatan", to: "/kegiatan-tag" },
  { title: "Detail" },
];

export default function ShowGroupTagKegiatan() {
  const router = useRouter();
  const { id } = useParams();
  const { data, dataLoading } = useShowGroupTagKegiatan(id);

  const initialValues = useMemo(
    () => ({
      penyewa_id: data?.penyewa_id?.toString() || "",
      nmpenyewa: data?.nmpenyewa || "",
      ctg: data?.ctg || "",
      kegiatan_id: data?.kegiatan_id?.toString() || "",
      nmkegiatan: data?.nmkegiatan || "",
      material_id: data?.material_id?.toString() || "",
      nmmaterial: data?.nmmaterial || "",
      aktif: data?.aktif || "Y",
    }),
    [data]
  );

  const validationSchema = Yup.object({
    penyewa_id: Yup.string().required("Penyewa wajib dipilih"),
    ctg: Yup.string()
      .oneOf(["HE", "DT", "WT", "FT", "LT", "LV"], "Pilih CTG yang valid")
      .required("CTG wajib dipilih"),
    kegiatan_id: Yup.string().required("Kegiatan wajib dipilih"),
    material_id: Yup.string().nullable(),
    aktif: Yup.string().oneOf(["Y", "N"]).required(),
  });

  const handleDelete = async () => {
    if (!id) return;
    const confirm = window.confirm("Hapus data ini?");
    if (!confirm) return;

    try {
      await axiosServices({ url: `/master/grouptag-kegiatan/${id}/destroy`, method: "POST" });
      openNotification(msgSuccessDelete);
      router.push("/kegiatan-tag");
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.message || "Gagal menghapus data",
      });
    }
  };

  const handleUpdate = async (values, { setSubmitting }) => {
    try {
      await axiosServices({
        url: `/master/grouptag-kegiatan/${id}/update`,
        method: "POST",
        data: {
          ...values,
          penyewa_id: values.penyewa_id || null,
          nmpenyewa: values.nmpenyewa || "",
          material_id: values.material_id || null,
        },
      });
      openNotification(msgSuccessUpdate);
      router.push("/kegiatan-tag");
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.message || "Gagal mengupdate data",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return <Typography>Memuat data...</Typography>;
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Group Tag Kegiatan" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/kegiatan-tag" />} secondary={null} content>
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleUpdate}
        >
          {({ values, errors, touched, setFieldValue, handleSubmit, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} mb={3}>
                  <OptionPenyewa
                    label="Penyewa"
                    value={values.penyewa_id}
                    name="penyewa_id"
                    startAdornment={<UserOctagon/>}
                    error={errors.penyewa_id}
                    touched={touched.penyewa_id}
                    setFieldValue={(name, value, option) => {
                      setFieldValue(name, value || "");
                      setFieldValue("nmpenyewa", option?.nama || "");
                    }}
                  />
                  {Boolean(errors.penyewa_id) && touched.penyewa_id && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.penyewa_id}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth error={touched.ctg && Boolean(errors.ctg)}>
                    <InputLabel id="ctg-label">CTG</InputLabel>
                    <Select
                      labelId="ctg-label"
                      name="ctg"
                      label="CTG"
                      value={values.ctg}
                      onChange={(e) => setFieldValue("ctg", e.target.value)}
                      startAdornment={<Tag2 style={{ marginLeft: 8 }} />}
                    >
                      <MenuItem value="">Pilih CTG</MenuItem>
                      <MenuItem value="HE">HE</MenuItem>
                      <MenuItem value="DT">DT</MenuItem>
                      <MenuItem value="WT">WT</MenuItem>
                      <MenuItem value="FT">FT</MenuItem>
                      <MenuItem value="LT">LT</MenuItem>
                      <MenuItem value="LV">LV</MenuItem>
                    </Select>
                    {touched.ctg && errors.ctg && <FormHelperText>{errors.ctg}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <OptionKegiatanKerja
                    label="Kegiatan"
                    value={values.kegiatan_id}
                    name="kegiatan_id"
                    ctg={values.ctg}
                    error={errors.kegiatan_id}
                    touched={touched.kegiatan_id}
                    setFieldValue={(name, value, option) => {
                      setFieldValue(name, value);
                      setFieldValue("nmkegiatan", option?.nama || "");
                    }}
                  />
                  {Boolean(errors.kegiatan_id) && touched.kegiatan_id && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.kegiatan_id}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={5}>
                  <OptionMaterialMining
                    label="Material (opsional)"
                    value={values.material_id}
                    name="material_id"
                    error={errors.material_id}
                    touched={touched.material_id}
                    setFieldValue={(name, value, option) => {
                      setFieldValue(name, value || "");
                      setFieldValue("nmmaterial", option?.nama || "");
                    }}
                  />
                </Grid>
              </Grid>

              <CardActions sx={{ justifyContent: "flex-start", mt: 3, px: 0 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send2 />}
                  disabled={isSubmitting}
                >
                  Update
                </Button>
                <Button
                  onClick={handleDelete}
                  color="error"
                  variant="outlined"
                  startIcon={<Trash />}
                >
                  Hapus
                </Button>
                <Button component={Link} href="/kegiatan-tag" variant="text" startIcon={<Back />}>
                  Batal
                </Button>
              </CardActions>
            </Form>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
