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
  OutlinedInput,
  FormHelperText,
  Select,
  MenuItem,
} from "@mui/material";

import { Tag2, Send2, Back, TickCircle } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionKegiatanKerja from "components/OptionKegiatanKerja";
import OptionMaterialMining from "components/OptionMaterialMining";
import axiosServices from "utils/axios";
import { openNotification } from "api/notification";
import { saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Group Tag Kegiatan berhasil dibuat...",
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
  { title: "Group Tag Kegiatan", to: "/kegiatan-tag" },
  { title: "Create" },
];

const initialValues = {
  ctg: "",
  kegiatan_id: "",
  nmkegiatan: "",
  material_id: "",
  nmmaterial: "",
  aktif: "Y",
};

export default function CreateGroupTagKegiatanScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    ctg: Yup.string()
      .oneOf(["HE", "DT", "WT", "FT", "LT", "LV"], "Pilih CTG yang valid")
      .required("CTG wajib dipilih"),
    kegiatan_id: Yup.string().required("Kegiatan wajib dipilih"),
    material_id: Yup.string().nullable(),
    aktif: Yup.string().oneOf(["Y", "N"]).required(),
  });

  const onSubmitHandle = async (values) => {
    const payload = {
      ctg: values.ctg,
      kegiatan_id: values.kegiatan_id,
      nmkegiatan: values.nmkegiatan,
      material_id: values.material_id || null,
      nmmaterial: values.nmmaterial || "",
      aktif: values.aktif,
    };

    const config = {
      url: `/master/grouptag-kegiatan/create`,
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `INSERT GROUP TAG KEGIATAN ${values.nmkegiatan || values.kegiatan_id}`,
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
      await axiosServices(config);
      route.push("/kegiatan-tag");
      openNotification(msgSuccess);
    } catch (err) {
      openNotification({
        ...msgError,
        message: err?.message || "Gagal mengirim data",
      });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Tambah Group Tag Kegiatan"} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={"/kegiatan-tag"} />} secondary={null} content>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({ errors, touched, values, setFieldValue, handleSubmit }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
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
                    {touched.ctg && errors.ctg && (
                      <FormHelperText>{errors.ctg}</FormHelperText>
                    )}
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

                <Grid item xs={12}>
                  <CardActions sx={{ justifyContent: "flex-start", px: 0 }}>
                    <Button
                      component={Link}
                      href="/kegiatan-tag"
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
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
