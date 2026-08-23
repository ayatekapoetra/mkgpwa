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
  TextField,
} from "@mui/material";

import { Tree, Send2, Back, Truck, Location } from "iconsax-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionProject from "components/OptionProject";
import OptionArea from "components/OptionArea";
import OptionEquipmentMulti from "components/OptionEquipmentMulti";
import axiosServices from "utils/axios";
import { openNotification } from "api/notification";
import { saveRequest } from "lib/offlineFetch";

const msgSuccess = {
  open: true,
  title: "success",
  message: "Equipment Project WA berhasil dibuat...",
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
  { title: "Equipment Project", to: "/wa-config-breakdown" },
  { title: "Create" },
];

const initialValues = {
  project_id: "",
  nmproject: "",
  area: "",
  equipment_ids: [],
  recipients: "",
  aktif: "Y",
};

export default function CreateEquipmentProjectWaScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    project_id: Yup.string().nullable(),
    area: Yup.string().required("Area wajib dipilih"),
    equipment_ids: Yup.array().min(1, "Minimal pilih satu equipment").required("Equipment wajib dipilih"),
    recipients: Yup.string().nullable(),
  });

  const onSubmitHandle = async (values) => {
    const payload = {
      project_id: values.project_id || null,
      nmproject: values.nmproject || "",
      area: values.area || "",
      equipment_ids: values.equipment_ids,
      recipients: values.recipients || "",
      aktif: values.aktif,
    };

    const config = {
      url: `/setting/equipment-project/create`,
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `INSERT EQUIPMENT PROJECT WA ${values.equipment_ids.length} equipment`,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: "Offline: data disimpan ke antrian" });
      return;
    }

    try {
      await axiosServices(config);
      route.push("/wa-config-breakdown");
      openNotification(msgSuccess);
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || "Gagal mengirim data" });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Tambah Equipment Project"} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={"/wa-config-breakdown"} />} secondary={null} content>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({ errors, touched, values, setFieldValue, handleSubmit }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
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

                <Grid item xs={12} sm={6} mb={3}>
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

                <Grid item xs={12} sm={12}>
                  <OptionEquipmentMulti
                    label="Equipment (multi)"
                    value={values.equipment_ids}
                    name="equipment_ids"
                    startAdornment={<Truck />}
                    error={errors.equipment_ids}
                    touched={touched.equipment_ids}
                    setFieldValue={(name, value) => setFieldValue(name, value || [])}
                  />
                  {Boolean(errors.equipment_ids) && touched.equipment_ids && (
                    <Typography variant="body2" color="error" gutterBottom>
                      {errors.equipment_ids}
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

                <Grid item xs={12}>
                  <CardActions sx={{ justifyContent: "flex-start", px: 0 }}>
                    <Button component={Link} href="/wa-config-breakdown" variant="outlined" color="secondary" startIcon={<Back />}>
                      Batal
                    </Button>
                    <Button type="submit" variant="contained" color="primary" startIcon={<Send2 />}>
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