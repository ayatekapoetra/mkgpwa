import { Box, Stack, Typography, FormControl, TextField, Autocomplete, InputAdornment, Chip, Divider } from "@mui/material";
import { usePublicEquipment } from "api/equipment";

const OptionEquipmentMulti = ({
  value = [],
  label = "Equipment",
  name = "equipment_ids",
  error = null,
  touched = false,
  startAdornment = null,
  filterParams = null,
  setFieldValue,
}) => {
  const { data: array, dataLoading } = usePublicEquipment(filterParams);

  const options = Array.isArray(array) ? array : [];
  const sortedOptions = [...options].sort((a, b) => (a.manufaktur || "Lainnya").localeCompare(b.manufaktur || "Lainnya"));

  if (dataLoading) {
    return <div>Loading...</div>;
  }

  const selectedValue = sortedOptions.filter((option) => {
    if (!value || !Array.isArray(value)) return false;
    return value.map(String).includes(String(option.id));
  });

  return (
    <Stack justifyContent="flex-start" alignItems="flex-start">
      <FormControl fullWidth variant="outlined">
        <Autocomplete
          multiple
          fullWidth
          options={sortedOptions}
          value={selectedValue}
          onChange={(e, newValue) => {
            setFieldValue(name, newValue.map((v) => v.id));
          }}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          getOptionLabel={(option) => option.kode || ""}
          groupBy={(option) => option.manufaktur || "Lainnya"}
          renderGroup={(params) => (
            <li key={params.key}>
              <Box sx={{ p: 1, bgcolor: "primary.main", mt: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "white" }}>
                  MANUFAKTUR {(params.group || "Lainnya").toUpperCase()}
                </Typography>
              </Box>
              <ul style={{ paddingLeft: 0, marginTop: 2, listStyle: "none" }}>{params.children}</ul>
            </li>
          )}
          sx={{ "& .MuiInputBase-root": { py: 0.9 } }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps}>
                <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 1 }}>
                  <Stack spacing={0.1} sx={{ width: "100%" }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                        {option.kode}
                      </Typography>
                      {option.manufaktur && (
                        <Chip label={option.manufaktur} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                      {option.model || "-"}
                    </Typography>
                  </Stack>
                </Box>
                <Divider sx={{ my: 0.5 }} />
              </li>
            );
          }}
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

export default OptionEquipmentMulti;