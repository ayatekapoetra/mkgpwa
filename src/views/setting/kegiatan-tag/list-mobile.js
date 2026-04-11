"use client";

import React from "react";
import Link from "next/link";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { Tag2, TickCircle, Calendar } from "iconsax-react";
import moment from "moment";

export default function ListGroupTagKegiatanMobile({ data }) {
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
              <Stack direction="row" spacing={1} alignItems="center">
                <Tag2 size={18} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {safeText(row.nmkegiatan)}
                </Typography>
              </Stack>
              <Chip
                label={row.aktif === "Y" ? "Aktif" : "Non-aktif"}
                color={row.aktif === "Y" ? "success" : "default"}
                size="small"
                icon={<TickCircle size={14} />}
              />
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Material: {safeText(row.nmmaterial)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CTG: {safeText(row.ctg)}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                <Calendar size={16} />
                <Typography variant="caption" color="text.secondary">
                  {row.created_at ? moment(row.created_at).format("DD MMM YYYY, HH:mm") : "-"}
                </Typography>
              </Stack>
            </Stack>

            {/* Action placeholder (edit/delete) can be added here if needed */}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
