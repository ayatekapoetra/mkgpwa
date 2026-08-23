import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment } from "@mui/material";
import { useGetProject } from "api/project";

const OptionProject = ({
  value = "",
  label = "Project",
  name = "project_id",
  error = null,
  touched = false,
  startAdornment = null,
  setFieldValue,
}) => {
  const { project: array, projectLoading: dataLoading } = useGetProject();

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
          value={options.find((option) => option?.id == value) || null}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue?.id || "");
          }}
          isOptionEqualToValue={(option, val) => option.id === val?.id}
          getOptionLabel={(option) => option.nama || ""}
          sx={{ "& .MuiInputBase-root": { py: 0.9 } }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.id}-${option.nama}`}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 1 }}>
                <Typography variant="body1">{option.nama}</Typography>
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

export default OptionProject;