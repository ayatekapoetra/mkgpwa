"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";

/** Shows partial-selection controls for validation or approval mode. */
export default function SelectionToolbar({
  mode,
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
}) {
  const isValidation = mode === "validate";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: isValidation ? "warning.lighter" : "info.lighter",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        gap={1}
      >
        <Box>
          <Typography fontWeight={700}>
            {isValidation
              ? "Pilih item yang akan divalidasi"
              : "Pilih item yang akan di-approve"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedCount} dari {totalCount} item dipilih.{" "}
            {isValidation
              ? "Item lain tetap menunggu validasi."
              : "PO hanya dibuat untuk item terpilih."}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={onSelectAll}>
            Pilih Semua
          </Button>
          <Button size="small" color="secondary" onClick={onClear}>
            Kosongkan
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
