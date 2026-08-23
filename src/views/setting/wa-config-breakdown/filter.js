"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardActions from "@mui/material/CardActions";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";

import MainCard from "components/MainCard";
import OptionProject from "components/OptionProject";
import OptionArea from "components/OptionArea";
import OptionEquipment from "components/OptionEquipment";

import { Add, Tree, Location, Truck } from "iconsax-react";

export default function FilterEquipmentProjectWa({
  count,
  open,
  onClose,
  params,
  setParams,
  anchor = "right",
}) {
  const onResetFilterHandle = () => {
    setParams({
      project_id: "",
      area: "",
      equipment_id: "",
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
                <OptionProject
                  value={params.project_id || ""}
                  name="project_id"
                  startAdornment={<Tree size={18} />}
                  setFieldValue={(name, value) => setParams({ ...params, [name]: value, page: 1 })}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <OptionArea
                  value={params.area || ""}
                  name="area"
                  startAdornment={<Location size={18} />}
                  setFieldValue={(name, value) => setParams({ ...params, [name]: value, page: 1 })}
                />
              </Grid>

              <Grid item xs={12} sm={12} lg={12}>
                <OptionEquipment
                  value={params.equipment_id || ""}
                  name="equipment_id"
                  startAdornment={<Truck size={18} />}
                  setFieldValue={(name, value) => setParams({ ...params, [name]: value, page: 1 })}
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
        <Typography variant="body">Filter Equipment Project</Typography>
        <Typography variant="caption">count {count || 0} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: "rotate(45deg)" }} />
      </IconButton>
    </Stack>
  );
}