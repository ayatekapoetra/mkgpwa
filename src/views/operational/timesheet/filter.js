"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardActions from "@mui/material/CardActions";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// ASSETS
import {
  Add,
  Building,
  TagUser,
  Buildings2,
  CalendarCircle,
  Truck,
} from "iconsax-react";
import InputSearch from "components/InputSearch";
import SelectSearch from "components/SelectSearch";
import MainCard from "components/MainCard";
import FilterCabang from "components/FilterCabang";
import FilterOperatorDriver from "components/FilterOperatorDriver";
import FilterPenyewa from "components/FilterPenyewa";
import FilterEquipment from "components/FilterEquipment";

export default function FilterTimesheet({
  open,
  count,
  params,
  setParams,
  onClose,
  anchor = "right",
}) {
  const onResetFilter = () => {
    setParams((prev) => ({
      page: 1,
      perPage: prev.perPage || 25,
      site_id: "",
      karyawan_id: "",
      penyewa_id: "",
      equipment_id: "",
      startdate: "",
      enddate: "",
      status: "",
      type: "",
    }));
  };
  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == "right" ? "400px" : "100vw" }}>
          <MainCard
            content={true}
            title={<HeaderFilter count={count} onClose={onClose} />}
          >
            <Grid
              container
              spacing={1}
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <Grid item xs={12} sm={12} lg={12}>
                <SelectSearch
                  name={"hmkm"}
                  label={"Kategori"}
                  value={params.type}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, type: e.target.value }))
                  }
                  array={[
                    { key: "HM", teks: "Alat Berat" },
                    { key: "KM", teks: "DumpTruck" },
                  ]}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterCabang
                  name={"site_id"}
                  setData={setParams}
                  value={params.site_id}
                  startAdornment={<Building />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterOperatorDriver
                  name={"karyawan_id"}
                  setData={setParams}
                  value={params.karyawan_id}
                  startAdornment={<TagUser />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterPenyewa
                  name={"penyewa_id"}
                  label={"Penyewa"}
                  setData={setParams}
                  value={params.penyewa_id}
                  startAdornment={<Buildings2 />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterEquipment
                  name={"equipment_id"}
                  label={"Equipment"}
                  setData={setParams}
                  value={params.equipment_id}
                  startAdornment={<Truck />}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 2 }}>
                <InputSearch
                  label="Mulai Tanggal"
                  name="startdate"
                  size="medium"
                  type="date"
                  startAdornment={<CalendarCircle />}
                  value={params["startdate"]}
                  onChange={(e) => {
                    setParams((prev) => ({
                      ...prev,
                      startdate: e.target.value || "",
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 2 }}>
                <InputSearch
                  label="Hingga Tanggal"
                  name="enddate"
                  size="medium"
                  type="date"
                  startAdornment={<CalendarCircle />}
                  value={params["enddate"]}
                  onChange={(e) => {
                    setParams((prev) => ({
                      ...prev,
                      enddate: e.target.value || "",
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status Berkas</InputLabel>
                  <Select
                    labelId="status-label"
                    value={params.status || ""}
                    label="Status Berkas"
                    onChange={(e) => {
                      setParams((prev) => ({
                        ...prev,
                        status: e.target.value || "",
                      }));
                    }}
                  >
                    <MenuItem value="">Semua Status</MenuItem>
                    <MenuItem value="A">Approved</MenuItem>
                    <MenuItem value="W">Waiting</MenuItem>
                    <MenuItem value="R">Retry</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button
              onClick={onResetFilter}
              variant="dashed"
              color="secondary"
              fullWidth
            >
              Reset Filter
            </Button>
          </CardActions>
        </Stack>
      </SwipeableDrawer>
    </div>
  );
}

function HeaderFilter({ count = 0, onClose }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="body">Filter Penugasan</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: "rotate(45deg)" }} />
      </IconButton>
    </Stack>
  );
}
