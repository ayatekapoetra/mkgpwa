import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from "@mui/material";
import { useGetArea } from "api/area";

const OptionArea = ({
  value = "",
  label = "Area",
  name = "area",
  error = null,
  touched = false,
  startAdornment = null,
  setFieldValue,
}) => {
  const { area: array, areaLoading: dataLoading } = useGetArea();

  const options = Array.isArray(array) ? array : [];

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          fullWidth
          options={options}
          value={value || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue || "");
          }}
          isOptionEqualToValue={(option, val) => option === val}
          getOptionLabel={(option) => option || ""}
          sx={{ "& .MuiInputBase-root": { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 1 }}>
                <Typography variant="body1">{option}</Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={touched && Boolean(error)}
              helperText={touched && error}
              InputProps={{
                ...params.InputProps,
                startAdornment: startAdornment && (
                  <>
                    <InputAdornment position="start">{startAdornment}</InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </FormControl>
    </Stack>
  );
};

export default OptionArea;