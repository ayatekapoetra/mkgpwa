"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

import Button from "@mui/material/Button";
import { Stack, useMediaQuery, useTheme } from "@mui/material";

import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";

import { Filter, Add, Tree } from "iconsax-react";
import ListEquipmentProjectWa from "./list";
import FilterEquipmentProjectWa from "./filter";
import CircularLoader from "components/CircularLoader";

import { useGetEquipmentProjectWa } from "api/equipment-project-wa";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting", to: "/setting" },
  { title: "Equipment Project" },
];

export default function EquipmentProjectWaScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    project_id: "",
    area: "",
    equipment_id: "",
  });
  const [openFilter, setOpenFilter] = useState(false);
  const { data, dataLoading } = useGetEquipmentProjectWa(params);

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Equipment Project"} links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile ? (
              <IconButton
                variant="contained"
                component={Link}
                href="/wa-config-breakdown/create"
                color="primary"
              >
                <Add />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                component={Link}
                href="/wa-config-breakdown/create"
                startIcon={<Tree />}
              >
                Tambah Equipment Project
              </Button>
            )}
          </Stack>
        }
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
        sx={{ mt: 1 }}
      >
        <FilterEquipmentProjectWa
          params={params}
          setParams={setParams}
          open={openFilter}
          onClose={toggleFilterHandle}
          count={data?.total}
        />
        {dataLoading ? <CircularLoader /> : <ListEquipmentProjectWa data={data} setParams={setParams} />}
      </MainCard>
    </Fragment>
  );
}