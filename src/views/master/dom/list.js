'use client';

import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableFooter, styled, IconButton, Chip, Stack, Typography } from '@mui/material';

import { Edit, Trash } from 'iconsax-react';
import Paginate from 'components/Paginate';

const ResizeHandle = styled('div')(({ theme, isresizing }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '6px',
  backgroundColor: isresizing ? theme.palette.primary.main : 'transparent',
  cursor: 'col-resize',
  userSelect: 'none',
  touchAction: 'none',
  zIndex: 1,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.light
  }
}));

export default function ListDom({ data = { data: [] }, setParams }) {
  const tableData = useMemo(() => (Array.isArray(data.data) ? data.data : []), [data]);

  const columns = useMemo(
    () => [
      {
        header: 'ACT',
        accessorKey: 'index',
        size: 20,
        minSize: 100,
        enableResizing: true,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 20, textAlign: 'center' }}>
              <IconButton variant="dashed" color="primary" component={Link} href={`/dom/${id}/show`}>
                <Edit />
              </IconButton>
              <IconButton variant="dashed" color="error" component={Link} href={`/dom/${id}/destroy`}>
                <Trash />
              </IconButton>
            </Box>
          );
        }
      },
      {
        header: 'Kode DOM',
        accessorKey: 'kode',
        size: 200,
        minSize: 150,
        enableResizing: true,
        cell: (info) => {
          const kode = info.getValue();
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
              {kode || '-'}
            </Typography>
          );
        }
      },
      {
        header: 'Tgl Ops',
        accessorKey: 'date_ops',
        size: 120,
        minSize: 100,
        enableResizing: true,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Cargo',
        accessorKey: 'cargo_type',
        size: 90,
        minSize: 80,
        cell: (info) => {
          const cargo = info.getValue();
          const displayCargo = cargo === 'MPR' ? 'MPR' : cargo === 'B' ? 'IMN' : cargo;
          return (
            <Chip
              label={displayCargo || '-'}
              size="small"
              variant="outlined"
              color={cargo === 'MPR' ? 'primary' : 'secondary'}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          );
        }
      },
      {
        header: 'Contractor',
        accessorKey: 'contractor_code',
        size: 100,
        minSize: 80,
        cell: (info) => {
          const contractor = info.getValue();
          return (
            <Chip
              label={contractor || '-'}
              size="small"
              variant="filled"
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.7rem',
                backgroundColor: contractor === 'BTSI' ? 'success.lighter' : 'info.lighter',
                color: contractor === 'BTSI' ? 'success.dark' : 'info.dark'
              }}
            />
          );
        }
      },
      {
        header: 'Cabang',
        accessorKey: 'cabang.nama',
        size: 150,
        minSize: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Pit Source',
        accessorKey: 'pitSource.nama',
        size: 150,
        minSize: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Material',
        accessorKey: 'material.nama',
        size: 150,
        minSize: 120,
        cell: (info) => info.getValue() || '-'
      },
      {
        header: 'Truck',
        accessorKey: 'truck_type',
        size: 90,
        minSize: 80,
        cell: (info) => {
          const truck = info.getValue();
          const displayTruck = truck === '10_RODA' ? '10R' : truck === '12_RODA' ? '12R' : truck;
          return (
            <Chip
              label={displayTruck || '-'}
              size="small"
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.7rem',
                backgroundColor: 'grey.200',
                color: 'grey.800'
              }}
            />
          );
        }
      },
      {
        header: 'Ritase',
        accessorKey: 'target_ret',
        size: 120,
        minSize: 100,
        cell: ({ row }) => {
          const target = row.original.target_ret || 0;
          const current = row.original.current_ret || 0;
          const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
          
          return (
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 60 }}>
                  {current}/{target}
                </Typography>
                <Chip
                  label={`${percentage}%`}
                  size="small"
                  sx={{
                    fontSize: '0.65rem',
                    height: 18,
                    fontWeight: 700,
                    backgroundColor: 
                      percentage >= 100 ? 'success.lighter' :
                      percentage >= 75 ? 'info.lighter' :
                      percentage >= 50 ? 'warning.lighter' : 'error.lighter',
                    color: 
                      percentage >= 100 ? 'success.dark' :
                      percentage >= 75 ? 'info.dark' :
                      percentage >= 50 ? 'warning.dark' : 'error.dark'
                  }}
                />
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  backgroundColor: 'grey.200',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(percentage, 100)}%`,
                    height: '100%',
                    backgroundColor: 
                      percentage >= 100 ? 'success.main' :
                      percentage >= 75 ? 'info.main' :
                      percentage >= 50 ? 'warning.main' : 'error.main',
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
            </Stack>
          );
        }
      },
      {
        header: 'Status',
        accessorKey: 'status',
        size: 100,
        minSize: 90,
        cell: (info) => {
          const status = info.getValue();
          return (
            <Chip
              label={status || '-'}
              size="small"
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: status === 'OPEN' ? 'success.main' : 'error.main',
                    animation: status === 'OPEN' ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 }
                    }
                  }}
                />
              }
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: status === 'OPEN' ? 'success.lighter' : 'grey.200',
                color: status === 'OPEN' ? 'success.dark' : 'grey.700',
                border: '1px solid',
                borderColor: status === 'OPEN' ? 'success.main' : 'grey.400',
                '& .MuiChip-icon': {
                  ml: 1
                }
              }}
            />
          );
        }
      }
    ],
    []
  );

  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
      columnSizingInfo
    },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      minSize: 60
    }
  });

  return (
    <Paper
      sx={{
        overflowX: 'auto',
        width: '100%',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Table
        sx={{
          tableLayout: 'fixed',
          minWidth: '100%'
        }}
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  colSpan={header.colSpan}
                  sx={{
                    position: 'relative',
                    width: header.getSize(),
                    minWidth: header.column.columnDef.minSize,
                    fontWeight: 'bold',
                    backgroundColor: 'background.paper',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    padding: '12px 16px',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <ResizeHandle
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        isresizing={header.column.getIsResizing() ? 'true' : undefined}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{
                '&:last-child td': { borderBottom: 0 }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    padding: '12px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length}>
              <Paginate
                page={data.page}
                total={data.total || 0}
                lastPage={data.lastPage || 1}
                perPage={data.perPage || 10}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Paper>
  );
}
