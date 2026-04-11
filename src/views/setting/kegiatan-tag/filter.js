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
import TextField from "@mui/material/TextField";

import MainCard from "components/MainCard";
import FilterMaterialMining from "components/FilterMaterialMining";

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
      search: "",
      ctg: "",
      material_id: "",
      aktif: "",
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
                <TextField
                  fullWidth
                  label="Cari (kegiatan/material)"
                  value={params.search || ""}
                  onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
                  InputProps={{
                    startAdornment: (
                      <OutlinedInput
                        startAdornment={<Tag2 size={18} />}
                        sx={{ display: "none" }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="ctg">Kategori (ctg)</InputLabel>
                <FormControl fullWidth>
                  <OutlinedInput
                    id="ctg"
                    name="ctg"
                    placeholder="Isi kode ctg (opsional)"
                    value={params.ctg || ""}
                    onChange={(e) => setParams({ ...params, ctg: e.target.value, page: 1 })}
                    startAdornment={<Tag2 size={18} style={{ marginRight: 8 }} />}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <FilterMaterialMining
                  label="Material"
                  value={params.material_id || ""}
                  name="material_id"
                  onChange={(val) => setParams({ ...params, material_id: val || "", page: 1 })}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="aktif">Status</InputLabel>
                <FormControl fullWidth>
                  <Select
                    name="aktif"
                    value={params.aktif || ""}
                    onChange={(e) => setParams({ ...params, aktif: e.target.value, page: 1 })}
                    displayEmpty
                    input={<OutlinedInput startAdornment={<TickCircle size={18} />} />}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    <MenuItem value="Y">Aktif</MenuItem>
                    <MenuItem value="N">Non-aktif</MenuItem>
                  </Select>
                </FormControl>
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
