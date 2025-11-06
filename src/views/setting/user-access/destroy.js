"use client";

import { Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import {
  CardActions,
  Grid,
  Button,
  Stack,
  Typography,
  Checkbox,
} from "@mui/material";
import { Trash } from "iconsax-react";

import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import BtnBack from "components/BtnBack";
import axiosServices from "utils/axios";

import { openNotification } from "api/notification";
import { useShowUserAccess } from "api/menu";

const msgSuccess = {
  open: true,
  title: "success",
  message: "User access berhasil dihapus...",
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
  { title: "User Access", to: "/user-access" },
  { title: "Delete" },
];

export default function DestroyUserAccess() {
  const route = useRouter();
  const { id } = useParams();
  const { data: accessData, dataLoading } = useShowUserAccess(id);

  const onSubmitHandle = async () => {
    try {
      await axiosServices.post(`/api/setting/akses-menu/${id}/destroy`);
      route.push("/user-access");
      openNotification(msgSuccess);
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || "Gagal menghapus data",
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
        heading={"Delete User Access"}
        links={breadcrumbLinks}
      />
      <MainCard
        title={<BtnBack href={"/user-access"} />}
        secondary={null}
        content={true}
      >
        <Grid
          container
          spacing={3}
          alignItems="flex-start"
          justifyContent="flex-start"
        >
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Konfirmasi Hapus Akses User
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Anda akan menghapus semua akses untuk user:{" "}
              <strong>
                {accessData[0]?.user?.nmlengkap || accessData[0]?.nmuser}
              </strong>
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Daftar Akses yang akan dihapus:
            </Typography>
            <Stack spacing={1}>
              {accessData.map((access) => (
                <MainCard
                  key={access.id}
                  sx={{ backgroundColor: "background.default" }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {access.submenu?.name || access.nmsubmenu}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {access.read === "Y" && (
                        <Checkbox checked disabled size="small" />
                      )}
                      {access.insert === "Y" && (
                        <Checkbox
                          checked
                          disabled
                          size="small"
                          color="success"
                        />
                      )}
                      {access.update === "Y" && (
                        <Checkbox
                          checked
                          disabled
                          size="small"
                          color="warning"
                        />
                      )}
                      {access.remove === "Y" && (
                        <Checkbox checked disabled size="small" color="error" />
                      )}
                    </Stack>
                  </Stack>
                </MainCard>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12}>
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
                onClick={onSubmitHandle}
                variant="contained"
                color="error"
                startIcon={<Trash variant="Bold" />}
              >
                Hapus Semua Akses
              </Button>
            </CardActions>
          </Grid>
        </Grid>
      </MainCard>
    </Fragment>
  );
}
