"use client";

import { useState } from "react";
import Link from "next/link";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";

import MainCard from "components/MainCard";
import ListTablePemasok from "./listtable";
import FilterPemasok from "./filter";

import { useGetPemasok } from "api/pemasok";
import Paginate from "components/Paginate";
import { Filter } from "iconsax-react";

const PemasokScreen = () => {
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPages: 25,
    nama_pemasok: "",
    kode: "",
  });

  const { data, dataLoading, dataError, page, perPage, total, lastPage } = useGetPemasok(params);

  const toggleFilterHandle = () => setOpenFilter((prev) => !prev);

  return (
    <MainCard
      title={
        <Button variant="contained" component={Link} href={`/pemasok/create`}>
          Add Pemasok
        </Button>
      }
      secondary={
        <List component="nav" sx={{ p: 0, "& .MuiListItemIcon-root": { minWidth: 32 } }}>
          <ListItemButton onClick={toggleFilterHandle}>
            <ListItemIcon>
              <Filter />
            </ListItemIcon>
          </ListItemButton>
        </List>
      }
      content={false}
    >
      <Stack spacing={2}>
        {dataError ? (
          <Typography variant="body2" color="error">
            Error fetching data: {JSON.stringify(dataError)}
          </Typography>
        ) : null}

        {dataLoading ? <Typography variant="body2">Loading...</Typography> : null}

        {!dataError && (
          <>
            <ListTablePemasok data={{ data: data || [] }} />

            <Stack sx={{ p: 2 }}>
              <Paginate
                page={page || params.page}
                total={total || 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.perPages}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
      </Stack>

      <FilterPemasok
        data={params}
        setData={setParams}
        open={openFilter}
        count={total || 0}
        onClose={toggleFilterHandle}
      />
    </MainCard>
  );
};

export default PemasokScreen;
