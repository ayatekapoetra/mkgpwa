import {
  Box,
  Stack,
  Typography,
  FormControl,
  TextField,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import { useGetSubMenu } from "api/menu";

const FilterSubmenu = ({
  value = "",
  label = "Submenu",
  name = "submenu_id",
  startAdornment = null,
  setData,
  menuId = "",
}) => {
  const { data: array, dataLoading } = useGetSubMenu(menuId);

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  if (!menuId) {
    return (
      <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
        <FormControl fullWidth variant="outlined">
          <TextField label={label} disabled value="" placeholder="Pilih menu terlebih dahulu" />
        </FormControl>
      </Stack>
    );
  }

  return (
    <Stack mt={2} justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={array || []}
          value={array?.find((option) => option?.id == value) || null}
          onChange={(_, newValue) => {
            setData((prev) => ({ ...prev, [name]: newValue?.id || "" }));
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          getOptionLabel={(option) => option.submenu || option.nama || ""}
          sx={{ "& .MuiInputBase-root": { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.submenu}`}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  pr: 1,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {option.submenu || option.nama}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.url || ""}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={label}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: startAdornment && (
                    <>
                      <InputAdornment position="start">
                        {startAdornment}
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            );
          }}
        />
      </FormControl>
    </Stack>
  );
};

export default FilterSubmenu;
