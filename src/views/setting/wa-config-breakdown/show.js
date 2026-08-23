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
  TextField,
} from "@mui/material";
import { Tree, Send2, Back, Truck, Location } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import MainCard from "components/MainCard";
import axiosServices from "utils/axios";
import { openNotification } from "api/notification";
import { useShowEquipmentProjectWa } from "api/equipment-project-wa";
import OptionProject from "components/OptionProject";
import OptionArea from "components/OptionArea";
import OptionEquipment from "components/OptionEquipment";

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
  { title: "Equipment Project", to: "/wa-config-breakdown" },
  { title: "Detail" },
];

export default function ShowEquipmentProjectWa() {
  const router = useRouter();
  const { id } = useParams();
  const { data, dataLoading } = useShowEquipmentProjectWa(id);

  const initialValues = useMemo(
    () => ({
      project_id: data?.project_id?.toString() || "",
      nmproject: data?.nmproject || "",
      area: data?.area || "",
      equipment_id: data?.equipment_id?.toString() || "",
      recipients: data?.recipients || "",
      aktif: data?.aktif || "Y",
    }),
    [data]
  );

  const validationSchema = Yup.object({
    project_id: Yup.string().nullable(),
    area: Yup.string().required("Area wajib dipilih"),
    equipment_id: Yup.string().required("Equipment wajib dipilih"),
    recipients: Yup.string().nullable(),
    aktif: Yup.string().oneOf(["Y", "N"]).required(),
  });

  const handleUpdate = async (values, { setSubmitting }) => {
    try {
      await axiosServices({
        url: `/setting/equipment-project/${id}/update`,
        method: "POST",
        data: {
          project_id: values.project_id || null,
          nmproject: values.nmproject || "",
          area: values.area || "",
          equipment_id: values.equipment_id,
          recipients: values.recipients || "",
          aktif: values.aktif,
        },
      });
      openNotification(msgSuccessUpdate);
      router.push("/wa-config-breakdown");
    } catch (error) {
      openNotification({ ...msgError, message: error?.message || "Gagal mengupdate data" });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return <Typography>Memuat data...</Typography>;
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Equipment Project" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/wa-config-breakdown" />} secondary={null} content>
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
                  <OptionProject
                    label="Project (opsional)"
                    value={values.project_id}
                    name="project_id"
                    startAdornment={<Tree />}
                    error={errors.project_id}
                    touched={touched.project_id}
                    setFieldValue={(name, value, option) => {
                      setFieldValue(name, value || "");
                      setFieldValue("nmproject", option?.nama || "");
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={3} mb={3}>
                  <OptionArea
                    label="Area"
                    value={values.area}
                    name="area"
                    startAdornment={<Location />}
                    error={errors.area}
                    touched={touched.area}
                    setFieldValue={(name, value) => setFieldValue(name, value || "")}
                  />
                  {Boolean(errors.area) && touched.area && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.area}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={3} mb={3}>
                  <OptionEquipment
                    label="Equipment"
                    value={values.equipment_id}
                    name="equipment_id"
                    startAdornment={<Truck />}
                    error={errors.equipment_id}
                    touched={touched.equipment_id}
                    setFieldValue={(name, value) => setFieldValue(name, value || "")}
                  />
                  {Boolean(errors.equipment_id) && touched.equipment_id && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.equipment_id}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth>
                    <TextField
                      label="Recipients (nomor WhatsApp, pisahkan dengan koma)"
                      name="recipients"
                      value={values.recipients}
                      onChange={(e) => setFieldValue("recipients", e.target.value)}
                      multiline
                      rows={2}
                      placeholder="6281xxxxxxxxx, 6282xxxxxxxxx"
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth error={touched.aktif && Boolean(errors.aktif)}>
                    <InputLabel id="aktif-label">Aktif</InputLabel>
                    <Select
                      labelId="aktif-label"
                      name="aktif"
                      label="Aktif"
                      value={values.aktif}
                      onChange={(e) => setFieldValue("aktif", e.target.value)}
                    >
                      <MenuItem value="Y">Y</MenuItem>
                      <MenuItem value="N">N</MenuItem>
                    </Select>
                    {touched.aktif && errors.aktif && <FormHelperText>{errors.aktif}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>

              <CardActions sx={{ justifyContent: "flex-start", mt: 3, px: 0 }}>
                <Button type="submit" variant="contained" startIcon={<Send2 />} disabled={isSubmitting}>
                  Update
                </Button>
                <Button component={Link} href="/wa-config-breakdown" variant="text" startIcon={<Back />}>
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