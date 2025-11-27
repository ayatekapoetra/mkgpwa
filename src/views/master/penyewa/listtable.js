'use client';

import PropTypes from 'prop-types';
import Link from 'next/link';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

import { Edit } from 'iconsax-react';

export default function ListTablePenyewa({ data }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={80}>Action</TableCell>
            <TableCell>Kode</TableCell>
            <TableCell>Abbr</TableCell>
            <TableCell>Nama Penyewa</TableCell>
            <TableCell>Bisnis Unit</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.data?.map((row) => (
            <TableRow 
              key={row.id} 
              hover
            >
              <TableCell>
                <IconButton variant="dashed" color="primary" component={Link} href={`/penyewa/${row.id}`}>
                  <Edit />
                </IconButton>
              </TableCell>
              <TableCell>{row.kode || '-'}</TableCell>
              <TableCell>{row.abbr || '-'}</TableCell>
              <TableCell>{row.nama || '-'}</TableCell>
              <TableCell>{row.bisnis?.name || '-'}</TableCell>
              <TableCell align="center">
                <Chip 
                  label={row.aktif === 'Y' ? 'Aktif' : 'Tidak Aktif'} 
                  color={row.aktif === 'Y' ? 'success' : 'error'} 
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
          {(!data?.data || data.data.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Tidak ada data penyewa
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ListTablePenyewa.propTypes = {
  data: PropTypes.object
};
