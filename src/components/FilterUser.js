import {
  Box,
  Stack,
  Typography,
  FormControl,
  TextField,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import { useUserKaryawan } from "api/users";

const FilterUser = ({
  value = "",
  label = "User Karyawan",
  name = "user_id",
  startAdornment = null,
  setData,
}) => {
  const { data: array, dataLoading } = useUserKaryawan();

  if (dataLoading || !array) {
    return <div>Loading...</div>;
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
          getOptionLabel={(option) => option.nmlengkap || option.nama || ""}
          sx={{ "& .MuiInputBase-root": { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.nmlengkap}`}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  pr: 1,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {option.nmlengkap || option.nama}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.usertype || option.section}
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

export default FilterUser;
