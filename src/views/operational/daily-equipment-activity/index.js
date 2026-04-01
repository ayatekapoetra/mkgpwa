"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Stack, Button, Menu, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Add, Filter, DocumentDownload } from "iconsax-react";

import MainCard from "components/MainCard";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import { APP_DEFAULT_PATH } from "config";
import { useActivityPlan } from "api/activity-plan";
import { openNotification } from "api/notification";
import { generateDailyEquipmentActivityExcel, generateDailyEquipmentActivityPdfDT, generateDailyEquipmentActivityPdfHE } from "utils/excelExport";
import axiosServices from "utils/axios";

import ListActivity from "./list";
import FilterActivity from "./filter";

const breadcrumbLinks = [
  { title: "Home", to: APP_DEFAULT_PATH },
  { title: "Activity Equipment", to: "/daily-equipment-activity" },
];

const defaultParams = {
  page: 1,
  perPage: 25,
  date_ops: "",
  shift: "",
  status: "",
  ctg: "",
  equipment_id: "",
  karyawan_id: "",
  material_id: "",
  kegiatan_id: "",
  lokasi_id: "",
  lokasi_to: "",
  cabang_id: "",
  aktif: "Y",
};

export default function DailyEquipmentActivity() {
  const [params, setParams] = useState(defaultParams);
  const [openFilter, setOpenFilter] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const { data, dataLoading, dataError, mutate } = useActivityPlan(params);

  const handleOpenDownloadMenu = (event) => setDownloadAnchorEl(event.currentTarget);
  const handleCloseDownloadMenu = () => setDownloadAnchorEl(null);

  const handleDownloadExcel = async (category) => {
    try {
      setDownloadingExcel(true);
      const resp = await axiosServices.get("/api/operation/activity-plan/download", {
        params,
      });

      const rows = resp?.data?.rows;
      let activities = Array.isArray(rows)
        ? rows
        : Array.isArray(rows?.data)
          ? rows.data
          : [];

      if (category && category !== "ALL") {
        const ctgKey = category.toUpperCase();
        activities = activities.filter((a) => (a.ctg || "").toUpperCase() === ctgKey);
      }

      if (!activities || activities.length === 0) {
        openNotification({
          message: "Tidak ada data untuk di-export",
          type: "warning",
        });
        return;
      }

      if (category === "DT") {
        await generateDailyEquipmentActivityPdfDT(activities, undefined);
      } else if (category === "HE") {
        await generateDailyEquipmentActivityPdfHE(activities, undefined);
      } else {
        generateDailyEquipmentActivityExcel(activities, undefined, { ctg: category });
      }
      openNotification({
        message: "Excel berhasil di-download",
        type: "success",
      });
    } catch (error) {
      openNotification({
        message: error.message || "Gagal download excel",
        type: "error",
      });
    } finally {
      setDownloadingExcel(false);
      handleCloseDownloadMenu();
    }
  };

  return (
    <>
      <Breadcrumbs custom heading="Daily Equipment Activity" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button
            variant="contained"
            startIcon={<Add />}
            component={Link}
            href="/daily-equipment-activity/create"
          >
            Tambah Aktivitas
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Filter />}
              onClick={() => setOpenFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DocumentDownload />}
              onClick={handleOpenDownloadMenu}
              disabled={downloadingExcel}
            >
              Download
            </Button>
          </Stack>
        }
        content
      >
        <ListActivity
          data={data}
          loading={dataLoading}
          error={dataError}
          params={params}
          setParams={setParams}
          onEdit={() => {}}
        />
      </MainCard>

      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={handleCloseDownloadMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <List dense sx={{ minWidth: 220 }}>
          <ListItemButton onClick={() => handleDownloadExcel("HE")} disabled={downloadingExcel}>
            <ListItemIcon>
              <DocumentDownload />
            </ListItemIcon>
            <ListItemText primary="Download HE (Alat Berat)" />
          </ListItemButton>
          <ListItemButton onClick={() => handleDownloadExcel("DT")} disabled={downloadingExcel}>
            <ListItemIcon>
              <DocumentDownload />
            </ListItemIcon>
            <ListItemText primary="Download DT (Dumptruck)" />
          </ListItemButton>
          <ListItemButton onClick={() => handleDownloadExcel("ALL")} disabled={downloadingExcel}>
            <ListItemIcon>
              <DocumentDownload />
            </ListItemIcon>
            <ListItemText primary="Download Semua Equipment" />
          </ListItemButton>
        </List>
      </Menu>

      <FilterActivity
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        params={params}
        setParams={setParams}
      />
    </>
  );
}
