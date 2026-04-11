"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

import Button from "@mui/material/Button";
import { Stack, useMediaQuery, useTheme } from "@mui/material";

import IconButton from "components/@extended/IconButton";
import MainCard from "components/MainCard";
import { APP_DEFAULT_PATH } from "config";
import Breadcrumbs from "components/@extended/Breadcrumbs";

import { Filter, Add, Tag2 } from "iconsax-react";
import ListGroupTagKegiatan from "./list";
import FilterGroupTagKegiatan from "./filter";
import CircularLoader from "components/CircularLoader";

import { useGetGroupTagKegiatan } from "api/grouptag-kegiatan";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting", to: "/setting" },
  { title: "Group Tag Kegiatan" },
];

export default function GroupTagKegiatanScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    search: "",
    ctg: "",
    aktif: "",
  });
  const [openFilter, setOpenFilter] = useState(false);
  const { data, dataLoading } = useGetGroupTagKegiatan(params);

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

  return (
    <Fragment>
      <Breadcrumbs custom heading={"Group Tag Kegiatan"} links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile ? (
              <IconButton
                variant="contained"
                component={Link}
                href="/kegiatan-tag/create"
                color="primary"
              >
                <Add />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                component={Link}
                href="/kegiatan-tag/create"
                startIcon={<Tag2 />}
              >
                Tambah Group Tag
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
        <FilterGroupTagKegiatan
          params={params}
          setParams={setParams}
          open={openFilter}
          onClose={toggleFilterHandle}
          count={data?.total}
        />
        {dataLoading ? (
          <CircularLoader />
        ) : (
          <ListGroupTagKegiatan data={data} setParams={setParams} />
        )}
      </MainCard>
    </Fragment>
  );
}
