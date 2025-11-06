"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
} from "@mui/material";

import {
  Tag2,
  Edit,
  Calendar,
  Trash,
  Building4,
  Android,
  Location,
} from "iconsax-react";

import Paginate from "components/Paginate";
import moment from "moment";
import IconButton from "components/@extended/IconButton";

export default function ListGroupTagMobile({ data, setParams }) {
  const tableData = useMemo(() => {
    const rows = data?.data?.rows || data?.data || data?.rows || data;
    return Array.isArray(rows) ? rows : [];
  }, [data]);

  const getKegiatanBadge = (kegiatan) => {
    const colorMap = {
      rental: "primary",
      barging: "success",
      mining: "warning",
      explorasi: "info",
    };
    return (
      <Chip
        label={kegiatan?.toUpperCase() || "-"}
        color={colorMap[kegiatan] || "default"}
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mx: "1em" }}>
      {tableData.map((row) => {
        return (
          <Card
            key={row.id}
            sx={{
              boxShadow: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 6,
              },
              mt: 1,
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                p: 2,
                color: "white",
                position: "relative",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {row.kegiatan?.toUpperCase() || "-"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, lineHeight: 1.2 }}
                  >
                    Group Tag Timesheet
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                    component={Link}
                    href={`/lokasikerja-tag/${row.id}/edit`}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(255, 0, 0, 0.2)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 0, 0, 0.3)",
                      },
                    }}
                  >
                    <Trash />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>

            <CardContent sx={{ pb: 2, position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: "-20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
              >
                {getKegiatanBadge(row.kegiatan)}
              </Box>

              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box
                  sx={{
                    backgroundColor: "action.hover",
                    p: 1.5,
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Tag2 size={20} sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Jenis Kegiatan
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {row.kegiatan?.toUpperCase() || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Building4 size={18} sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cabang
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {row.cabang?.nama || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Android size={18} sx={{ color: "success.main" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Penyewa
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {row.penyewa?.nama || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Divider />

                <Box
                  sx={{
                    backgroundColor: "info.lighter",
                    p: 1.5,
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Location size={20} sx={{ color: "info.main", mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Lokasi Kerja (Pit)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {row?.pitkerja?.nama || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Calendar size={16} sx={{ color: "info.main" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dibuat
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {moment(row.created_at).format("DD MMM YYYY, HH:mm")}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      <Box sx={{ mt: 2 }}>
        <Paginate
          page={data?.data?.page || data?.page || 1}
          total={data?.data?.total || data?.total || 0}
          lastPage={data?.data?.lastPage || data?.lastPage || 1}
          perPage={data?.data?.perPage || data?.perPage || 25}
          onPageChange={(newPage) =>
            setParams((prev) => ({ ...prev, page: newPage }))
          }
        />
      </Box>
    </Box>
  );
}
