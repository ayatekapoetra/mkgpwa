'use client';

import { useFilters, useGlobalFilter, useRowSelect, useSortBy, useTable } from 'react-table';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';

import ScrollX from 'components/ScrollX';

export default function ListGoodsReceipt({ columns, data, paginate }) {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useRowSelect
  );

  return (
    <ScrollX>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table
          {...getTableProps()}
          size="small"
          sx={{ minWidth: 1100, width: 'max-content', '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}
        >
          <TableHead>
            {headerGroups.map((headerGroup, gi) => (
              <TableRow key={gi} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, ci) => (
                  <TableCell key={ci} {...column.getHeaderProps([{ className: column.className }])}>
                    {column.canSort ? (
                      <TableSortLabel active={column.isSorted} direction={column.isSortedDesc ? 'desc' : 'asc'} {...column.getSortByToggleProps()}>
                        {column.render('Header')}
                      </TableSortLabel>
                    ) : (
                      column.render('Header')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {rows.map((row, ri) => {
              prepareRow(row);
              return (
                <TableRow key={ri} {...row.getRowProps()} hover>
                  {row.cells.map((cell, ci) => (
                    <TableCell key={ci} {...cell.getCellProps([{ className: cell.column.className }])}>
                      {cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns?.length || 5}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada data terima barang
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns?.length || 5}>{paginate || null}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </ScrollX>
  );
}
