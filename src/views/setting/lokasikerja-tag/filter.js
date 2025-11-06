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
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";

import MainCard from "components/MainCard";
import OptionCabang from "components/OptionCabang";
import OptionPenyewa from "components/OptionPenyewa";
import OptionLokasiPit from "components/OptionLokasiPit";

import { Add, Tag2, Building3, Android, Location } from "iconsax-react";

export default function FilterGroupTagTimesheet({
  count,
  open,
  onClose,
  params,
  setParams,
  anchor = "right",
}) {
  const onResetFilterHandle = () => {
    setParams({
      kegiatan: "",
      cabang_id: "",
      penyewa_id: "",
      lokasikerja_id: "",
      page: 1,
      perPage: 25,
    });
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
              spacing={2}
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="kegiatan">Jenis Kegiatan</InputLabel>
                <FormControl fullWidth>
                  <Select
                    name="kegiatan"
                    value={params["kegiatan"] || ""}
                    onChange={(e) =>
                      setParams({
                        ...params,
                        kegiatan: e.target.value,
                        page: 1,
                      })
                    }
                    input={
                      <OutlinedInput
                        startAdornment={
                          <InputAdornment position="start">
                            <Tag2 size={20} />
                          </InputAdornment>
                        }
                      />
                    }
                    displayEmpty
                  >
                    <MenuItem value="">Semua Kegiatan</MenuItem>
                    <MenuItem value="rental">RENTAL</MenuItem>
                    <MenuItem value="barging">BARGING</MenuItem>
                    <MenuItem value="mining">MINING</MenuItem>
                    <MenuItem value="explorasi">EXPLORASI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <OptionCabang
                  value={params["cabang_id"] || ""}
                  name="cabang_id"
                  label="Pilih Cabang"
                  startAdornment={<Building3 size={20} />}
                  setFieldValue={(name, value) => {
                    setParams({ ...params, [name]: value, page: 1 });
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <OptionPenyewa
                  value={params["penyewa_id"] || ""}
                  name="penyewa_id"
                  label="Pilih Penyewa"
                  startAdornment={<Android size={20} />}
                  setFieldValue={(name, value) => {
                    setParams({ ...params, [name]: value, page: 1 });
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <OptionLokasiPit
                  value={params["lokasikerja_id"] || ""}
                  name="lokasikerja_id"
                  label="Pilih Lokasi Kerja"
                  startAdornment={<Location size={20} />}
                  setFieldValue={(name, value) => {
                    setParams({ ...params, [name]: value, page: 1 });
                  }}
                />
              </Grid>
            </Grid>
          </MainCard>
          <CardActions>
            <Button
              onClick={onResetFilterHandle}
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
        <Typography variant="body">Filter Group Tag</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: "rotate(45deg)" }} />
      </IconButton>
    </Stack>
  );
}
