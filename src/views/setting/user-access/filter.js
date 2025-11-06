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
import { Add, SecurityUser, MenuBoard } from "iconsax-react";
import InputSearch from "components/InputSearch";
import FilterUser from "components/FilterUser";
import FilterMenu from "components/FilterMenu";
import FilterSubmenu from "components/FilterSubmenu";

export default function FilterUserAccess({
  count,
  open,
  onClose,
  data,
  setData,
  anchor = "right",
}) {
  const onResetFilterHandle = () => {
    setData({
      user_id: "",
      menu_id: "",
      submenu_id: "",
      page: 1,
      perPages: 25,
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
              spacing={1}
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <Grid item xs={12} sm={12} lg={12}>
                <InputLabel htmlFor="search-keyword">Keyword Search</InputLabel>
                <InputSearch
                  size="medium"
                  type="text"
                  value={data["keyword"]}
                  onChange={(e) =>
                    setData({ ...data, keyword: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterUser
                  value={data.user_id}
                  name={"user_id"}
                  label="User Karyawan"
                  startAdornment={<SecurityUser />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterMenu
                  value={data.menu_id}
                  name={"menu_id"}
                  label="Menu"
                  startAdornment={<MenuBoard />}
                  setData={setData}
                />
              </Grid>
              <Grid item xs={12} sm={12} lg={12}>
                <FilterSubmenu
                  value={data.submenu_id}
                  name={"submenu_id"}
                  label="Submenu"
                  startAdornment={<MenuBoard />}
                  setData={setData}
                  menuId={data.menu_id}
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
        <Typography variant="body">Filter User Access</Typography>
        <Typography variant="caption">count {count} data effected</Typography>
      </Stack>
      <IconButton color="error" onClick={onClose}>
        <Add style={{ transform: "rotate(45deg)" }} />
      </IconButton>
    </Stack>
  );
}
