"use client";

import PropTypes from "prop-types";
import Link from "next/link";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Edit } from "iconsax-react";

export default function ListTablePemasok({ data }) {
  return (
    <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell width={80}>Action</TableCell>
            <TableCell>Pemasok</TableCell>
            <TableCell>Bisnis</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Alamat</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.data?.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <IconButton variant="dashed" color="primary" component={Link} href={`/pemasok/${row.id}`}>
                  <Edit />
                </IconButton>
              </TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary" sx={{lineHeight: .5}}>
                    {row.kode || "-"}
                  </Typography>
                  <Typography variant="body" fontWeight={600} noWrap>
                    {row.nama || "-"}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{row.bisnis?.initial || "-"}</TableCell>
              <TableCell>
                <Typography variant="subtitle2">{row.email || "-"}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">{row.phone || "-"}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">{row.alamat || "-"}</Typography>
              </TableCell>
            </TableRow>
          ))}
          {(!data?.data || data.data.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Tidak ada data pemasok
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ListTablePemasok.propTypes = {
  data: PropTypes.object,
};
