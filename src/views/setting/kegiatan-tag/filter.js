"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardActions from "@mui/material/CardActions";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";

import MainCard from "components/MainCard";
import FilterMaterialMining from "components/FilterMaterialMining";
import FilterKegiatanKerja from "components/FilterKegiatanKerja";

import { Add, Tag2, TickCircle } from "iconsax-react";

export default function FilterGroupTagKegiatan({
  count,
  open,
  onClose,
  params,
  setParams,
  anchor = "right",
}) {
  const onResetFilterHandle = () => {
    setParams({
      ctg: "",
      kegiatan_id: "",
      material_id: "",
      page: 1,
      perPage: params.perPage || 25,
    });
  };

  return (
    <div>
      <SwipeableDrawer anchor={anchor} onClose={onClose} open={open}>
        <Stack p={1} sx={{ maxWidth: anchor == "right" ? "400px" : "100vw" }}>
          <MainCard content title={<HeaderFilter count={count} onClose={onClose} />}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="ctg">Kategori (ctg)</InputLabel>
                <FormControl fullWidth>
                  <Select
                    name="ctg"
                    value={params.ctg || ""}
                    onChange={(e) => setParams({ ...params, ctg: e.target.value, page: 1 })}
                    displayEmpty
                    input={<OutlinedInput startAdornment={<Tag2 size={18} />} />}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    <MenuItem value="HE">HE</MenuItem>
                    <MenuItem value="DT">DT</MenuItem>
                    <MenuItem value="WT">WT</MenuItem>
                    <MenuItem value="FT">FT</MenuItem>
                    <MenuItem value="LT">LT</MenuItem>
                    <MenuItem value="LV">LV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <FilterKegiatanKerja
                  label="Kegiatan"
                  value={params.kegiatan_id || ""}
                  name="kegiatan_id"
                  ctg={params.ctg}
                  setData={setParams}
                  startAdornment={<Tag2 size={18} />}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <FilterMaterialMining
                  label="Material"
                  value={params.material_id || ""}
                  name="material_id"
                  setData={setParams}
                  startAdornment={<Tag2 size={18} />}
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button onClick={onResetFilterHandle} variant="dashed" color="secondary" fullWidth>
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
        <Typography variant="body">Filter Group Tag Kegiatan</Typography>
        <Typography variant="caption">count {count || 0} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: "rotate(45deg)" }} />
      </IconButton>
    </Stack>
  );
}
