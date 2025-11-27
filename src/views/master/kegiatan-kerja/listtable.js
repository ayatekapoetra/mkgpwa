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

export default function ListTableKegiatanKerja({ data }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={80}>Action</TableCell>
            <TableCell>Nama Kegiatan</TableCell>
            <TableCell>Grup Equipment</TableCell>
            <TableCell>Narasi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.data?.map((row) => (
            <TableRow 
              key={row.id} 
              hover
            >
              <TableCell>
                <IconButton variant="dashed" color="primary" component={Link} href={`/kegiatan-kerja/${row.id}`}>
                  <Edit />
                </IconButton>
              </TableCell>
              <TableCell>{row.nama || '-'}</TableCell>
              <TableCell>
                <Chip 
                  label={row.grpequipment || '-'} 
                  color={row.grpequipment === 'HE' ? 'primary' : row.grpequipment === 'DT' ? 'secondary' : 'default'} 
                  size="small"
                />
              </TableCell>
              <TableCell>{row.narasi || '-'}</TableCell>
            </TableRow>
          ))}
          {(!data?.data || data.data.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Tidak ada data kegiatan kerja
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ListTableKegiatanKerja.propTypes = {
  data: PropTypes.object
};
