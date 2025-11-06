"use client";

import { useRouter, useParams } from "next/navigation";
import { Fragment } from "react";
import Link from "next/link";
import {
  Grid,
  Stack,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  CardActions,
} from "@mui/material";

import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { SecurityUser, ColorSwatch, Send2 } from "iconsax-react";

import MainCard from "components/MainCard";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import OptionUser from "components/OptionUser";
import OptionSubmenuMulti from "components/OptionSubmenuMulti";
import axiosServices from "utils/axios";
import { saveRequest } from "lib/offlineFetch";

import { openNotification } from "api/notification";
import { useShowUserAccess } from "api/menu";

const breadcrumbLinks = [
  { title: "Home", to: "/" },
  { title: "Permission", to: "#" },
  { title: "User Access", to: "/user-access" },
  { title: "Edit" },
];

const msgSuccess = {
  open: true,
  title: "success",
  message: "User access berhasil diupdate...",
  alert: { color: "success" },
};
const msgError = {
  open: true,
  title: "error",
  message: "",
  alert: { color: "error" },
};

const defaultAccess = (submenu) => ({
  submenu,
  read: "N",
  insert: "N",
  update: "N",
  remove: "N",
  accept: "N",
  validate: "N",
  approve: "N",
});

const validationSchema = Yup.object({
  user_id: Yup.string().required("User karyawan wajib dipilih"),
  submenu: Yup.array()
    .min(1, "Minimal pilih satu submenu")
    .required("Submenu wajib dipilih"),
});

export default function ShowUserAccess() {
  const route = useRouter();
  const { id } = useParams();
  const { data: existingAccess, dataLoading } = useShowUserAccess(id);

  const initialValues = {
    user_id: id || "",
    user: existingAccess[0]?.user || null,
    submenu: existingAccess.map((acc) => acc.submenu) || [],
    access:
      existingAccess.map((acc) => ({
        submenu: acc.submenu,
        read: acc.read,
        insert: acc.insert,
        update: acc.update,
        remove: acc.remove,
        accept: acc.accept,
        validate: acc.validate,
        approve: acc.approve,
      })) || [],
  };

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/setting/akses-menu/create`,
      method: "POST",
      data: values,
      headers: { "Content-Type": "application/json" },
      status: "pending",
      pesan: `UPDATE USER ACCESS ${values.user?.nama}`,
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
      route.push("/user-access");
      openNotification(msgSuccess);
    } catch (error) {
      console.log(error);
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || "Gagal mengirim data",
      });
    }
  };

  if (dataLoading) {
    return <div>Loading data...</div>;
  }

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={"Edit User Access"}
        links={breadcrumbLinks}
      />
      <MainCard title={<BtnBack href="/user-access" />} content>
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({ values, errors, touched, setFieldValue, handleSubmit }) => {
            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <OptionUser
                      label="User Karyawan"
                      name="user_id"
                      objField="user"
                      value={values.user_id}
                      error={errors.user_id}
                      touched={touched.user_id}
                      startAdornment={<SecurityUser />}
                      setFieldValue={setFieldValue}
                      disabled={true}
                    />
                  </Grid>
                </Grid>

                <FieldArray
                  name="submenu"
                  render={() => (
                    <>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <OptionSubmenuMulti
                            value={values.submenu}
                            name="submenu"
                            label="Nama Menu"
                            error={errors.submenu}
                            touched={touched.submenu}
                            startAdornment={<ColorSwatch />}
                            setFieldValue={(_, newSubmenus) => {
                              const oldSubmenus = values.submenu;
                              const added = newSubmenus.filter(
                                (s) => !oldSubmenus.some((o) => o.id === s.id),
                              );
                              const removed = oldSubmenus.filter(
                                (o) => !newSubmenus.some((s) => s.id === o.id),
                              );

                              let newAccess = [...values.access];

                              added.forEach((submenuObj) => {
                                newAccess.push(defaultAccess(submenuObj));
                              });

                              removed.forEach((removedItem) => {
                                newAccess = newAccess.filter(
                                  (acc) => acc.submenu.id !== removedItem.id,
                                );
                              });

                              setFieldValue("submenu", newSubmenus);
                              setFieldValue("access", newAccess);
                            }}
                          />
                        </Grid>

                        {values.access.map((access, idx) => {
                          return (
                            <Grid item xs={12} sm={4} key={access.submenu.id}>
                              <MainCard sx={{ height: "100%" }}>
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 700 }}
                                >
                                  Menu {access.submenu.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Option untuk memberikan akses
                                </Typography>
                                {Object.keys(defaultAccess({}))
                                  .filter((k) => k !== "submenu")
                                  .map((key) => (
                                    <Stack key={`${access.submenu.id}-${key}`}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={
                                              values.access[idx][key] === "Y"
                                            }
                                            onChange={(e) => {
                                              const updated = [
                                                ...values.access,
                                              ];
                                              updated[idx][key] = e.target
                                                .checked
                                                ? "Y"
                                                : "N";
                                              setFieldValue("access", updated);
                                            }}
                                            color="primary"
                                          />
                                        }
                                        label={key.toUpperCase()}
                                      />
                                    </Stack>
                                  ))}
                              </MainCard>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </>
                  )}
                />

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <CardActions>
                    <Button
                      component={Link}
                      href="/user-access"
                      variant="outlined"
                      color="secondary"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Send2 />}
                    >
                      Update
                    </Button>
                  </CardActions>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
