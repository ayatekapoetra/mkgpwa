"use client";

import { Fragment, useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { Shop } from "iconsax-react";

import SupplierRecommendationDialog from "./SupplierRecommendationDialog";
import {
  getBarangDisplayName,
  getBarangInfoFields,
  getBarangPrimaryCode,
} from "../utils";

/** Shows rich spare-part identity details so users can confirm the correct item. */
export default function SparepartInfoPanel({
  barang,
  quantity,
  unit,
  equipment,
  dense = false,
  showTitle = true,
  showSupplierRecommendation = false,
}) {
  const [recommendationOpen, setRecommendationOpen] = useState(false);

  if (!barang) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          px: 2,
          py: dense ? 1.25 : 2,
          bgcolor: "background.default",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Pilih sparepart untuk menampilkan kode, part number, manufaktur,
          brand, dan satuan.
        </Typography>
      </Box>
    );
  }

  const fields = getBarangInfoFields(barang);
  const primaryCode = getBarangPrimaryCode(barang);
  const displayName = getBarangDisplayName(barang);
  const orderUnit = unit || barang.satuan || barang.stn || "";

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 2,
        py: dense ? 1.5 : 2,
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={dense ? 1.25 : 1.75}>
        {showTitle && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ sm: "flex-start" }}
            spacing={1}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Identitas Sparepart
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} noWrap={false}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {primaryCode}
                {barang.num_part ? ` · PN ${barang.num_part}` : ""}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {quantity != null && quantity !== "" && (
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={`Qty: ${quantity}`}
                />
              )}
              {equipment?.kode && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Unit: ${equipment.kode}`}
                />
              )}
            </Stack>
          </Stack>
        )}

        {!showTitle && (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {(unit || barang.satuan || barang.stn) && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`Satuan: ${unit || barang.satuan || barang.stn}`}
              />
            )}
            {quantity != null && quantity !== "" && (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`Qty: ${quantity}`}
              />
            )}
          </Stack>
        )}

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(12, minmax(0, 1fr))",
            },
            gap: dense ? 1 : 1.5,
          }}
        >
          {fields.map((field) => (
            <Fragment key={field.key}>
              <Box
                sx={{
                  minWidth: 0,
                  gridColumn: {
                    xs: "span 1",
                    sm: `span ${
                      field.key === "num_part" && showSupplierRecommendation
                        ? 4
                        : field.colSpan
                          ? field.colSpan * 4
                          : 4
                    }`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={field.emphasis ? 700 : 500}
                  sx={{ wordBreak: "break-word" }}
                >
                  {field.value}
                </Typography>
              </Box>
              {field.key === "num_part" && showSupplierRecommendation && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                    gridColumn: { xs: "span 2", sm: "span 4" },
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Shop size={17} />}
                    disabled={!orderUnit}
                    onClick={() => setRecommendationOpen(true)}
                  >
                    Saran Pemasok Murah
                  </Button>
                </Box>
              )}
            </Fragment>
          ))}
        </Box>
      </Stack>
      <SupplierRecommendationDialog
        open={recommendationOpen}
        onClose={() => setRecommendationOpen(false)}
        barang={barang}
        orderUnit={orderUnit}
      />
    </Box>
  );
}
