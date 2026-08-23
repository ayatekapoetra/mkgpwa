"use client";

import React from "react";
import Link from "next/link";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography, Button } from "@mui/material";
import { Tree, TickCircle, Calendar, Truck, Location } from "iconsax-react";
import moment from "moment";

export default function ListEquipmentProjectWaMobile({ data }) {
  const rows = Array.isArray(data?.rows?.data)
    ? data.rows.data
    : Array.isArray(data?.data?.rows)
      ? data.data.rows
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];

  const safeText = (text, fallback = "-") => (text != null && text !== "" ? text : fallback);

  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      {rows.map((row) => (
        <Card key={row.id} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="bold">
                {safeText(row.nmproject)}
              </Typography>
              <Chip
                label={row.aktif === "Y" ? "Aktif" : "Non-aktif"}
                color={row.aktif === "Y" ? "success" : "default"}
                size="small"
                icon={<TickCircle size={14} />}
              />
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Stack spacing={0.5}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tree size={14} />
                <Typography variant="body2" fontWeight="medium">
                  {safeText(row.nmproject)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Location size={14} />
                <Typography variant="caption" color="text.secondary">
                  {safeText(row.area)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Truck size={14} />
                <Typography variant="body2" fontWeight="medium">
                  {row.equipment?.kode || safeText(row.equipment_id)}
                </Typography>
                {(() => {
                  const modelManufaktur = [row.equipment?.model, row.equipment?.manufaktur].filter(Boolean).join(" - ");
                  if (!modelManufaktur) return null;
                  return (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {modelManufaktur}
                    </Typography>
                  );
                })()}
              </Stack>
              <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                  Recipients: {(() => {
                    const raw = safeText(row.recipients);
                    if (!raw || raw === "-") return "0";
                    return raw.split(",").map((s) => s.trim()).filter(Boolean).length;
                  })()} nomor
                </Typography>
                {(() => {
                  const raw = safeText(row.recipients);
                  if (!raw || raw === "-") return <Typography variant="caption" color="text.secondary">-</Typography>;
                  const recipients = raw.split(",").map((s) => s.trim()).filter(Boolean);
                  if (!recipients.length) return <Typography variant="caption" color="text.secondary">-</Typography>;
                  const visible = recipients.slice(0, 3);
                  const remaining = recipients.length - 3;
                  return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {visible.map((num, i) => (
                        <Chip key={`${num}-${i}`} label={num} size="small" variant="outlined" sx={{ borderRadius: "6px", fontFamily: "monospace", fontSize: "0.7rem" }} />
                      ))}
                      {remaining > 0 && (
                        <Chip label={`+${remaining}`} size="small" color="primary" variant="soft" sx={{ borderRadius: "6px", fontWeight: 600 }} />
                      )}
                    </Stack>
                  );
                })()}
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                <Calendar size={16} />
                <Typography variant="caption" color="text.secondary">
                  {row.created_at ? moment(row.created_at).format("DD MMM YYYY, HH:mm") : "-"}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" justifyContent="flex-end" mt={1}>
              <Button
                component={Link}
                href={`/wa-config-breakdown/${row.id}`}
                variant="outlined"
                size="small"
              >
                Detail
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}