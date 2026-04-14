import { FieldArray } from "formik";
import { Grid, IconButton, Typography, Stack } from "@mui/material";
import { Add, Trash } from "iconsax-react";
import InputForm from "components/InputForm";
import OptionSysOption from "components/OptionSysOption";

export default function RekeningFields({ values, errors, touched, handleChange, setFieldValue }) {
  return (
    <FieldArray
      name="rekening"
      render={({ push, remove }) => (
        <Stack spacing={2} sx={{ width: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Rekening Bank</Typography>
            <IconButton color="primary" onClick={() => push({ nm_bank: "", no_rekening: "", an: "" })}>
              <Add />
            </IconButton>
          </Stack>

          {(values.rekening || []).map((rek, idx) => (
            <Grid container spacing={2} key={idx} alignItems="flex-start">
              <Grid item xs={12} sm={4}>
                <OptionSysOption
                  label="Nama Bank"
                  group="bank"
                  name={`rekening[${idx}].nm_bank`}
                  value={rek.nm_bank}
                  error={errors?.rekening?.[idx]?.nm_bank}
                  touched={touched?.rekening?.[idx]?.nm_bank}
                  setFieldValue={setFieldValue}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputForm
                  label="No Rekening"
                  type="text"
                  name={`rekening[${idx}].no_rekening`}
                  errors={errors?.rekening?.[idx]?.no_rekening}
                  touched={touched?.rekening?.[idx]?.no_rekening}
                  value={rek.no_rekening}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InputForm
                  label="Atas Nama"
                  type="text"
                  name={`rekening[${idx}].an`}
                  errors={errors?.rekening?.[idx]?.an}
                  touched={touched?.rekening?.[idx]?.an}
                  value={rek.an}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton color="error" onClick={() => remove(idx)}>
                  <Trash />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </Stack>
      )}
    />
  );
}
