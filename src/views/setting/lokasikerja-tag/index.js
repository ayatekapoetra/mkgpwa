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
import ListGroupTagTimesheet from "./list";
import FilterGroupTagTimesheet from "./filter";
import CircularLoader from "components/CircularLoader";

import { useGetGroupTagTimesheet } from "api/grouptag-timesheet";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Setting", to: "/setting" },
  { title: "Group Tag Timesheet" },
];

export default function GroupTagTimesheetScreen() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [params, setParams] = useState({
    page: 1,
    perPage: 25,
    kegiatan: "",
    cabang_id: "",
    penyewa_id: "",
    lokasikerja_id: "",
  });
  const [openFilter, setOpenFilter] = useState(false);
  const { data, dataLoading } = useGetGroupTagTimesheet(params);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={"Group Tag Timesheet"}
        links={breadcrumbLinks}
      />
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile ? (
              <IconButton
                variant="contained"
                component={Link}
                href="/lokasikerja-tag/create"
                color="primary"
              >
                <Add />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                component={Link}
                href="/lokasikerja-tag/create"
                startIcon={<Tag2 />}
              >
                Tambah Group Tag
              </Button>
            )}
          </Stack>
        }
        secondary={
          <IconButton
            shape="rounded"
            color="secondary"
            onClick={toggleFilterHandle}
          >
            <Filter />
          </IconButton>
        }
        content={false}
        sx={{ mt: 1 }}
      >
        <FilterGroupTagTimesheet
          params={params}
          setParams={setParams}
          open={openFilter}
          count={data?.total}
          onClose={toggleFilterHandle}
        />
        {dataLoading ? (
          <CircularLoader />
        ) : (
          <ListGroupTagTimesheet data={data} setParams={setParams} />
        )}
      </MainCard>
    </Fragment>
  );
}
