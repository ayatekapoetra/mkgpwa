'use client';

import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import {
  Box,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  styled,
  IconButton,
  Checkbox,
  Typography
} from '@mui/material';

import { Edit } from 'iconsax-react';
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

export default function ListUserAccess({ data = { data: [] }, setParams }) {
  const tableData = useMemo(() => (Array.isArray(data.data) ? data.data : []), [data]);

  const columns = useMemo(
    () => [
      {
        header: 'ACT',
        accessorKey: 'index',
        size: 20,
        minSize: 80,
        enableResizing: true,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 20, textAlign: 'center' }}>
              <IconButton variant="dashed" color="primary" component={Link} href={`/user-access/${id}/show`}>
                <Edit />
              </IconButton>
            </Box>
          );
        }
      },
      {
        header: 'Nama User',
        accessorKey: 'nmuser',
        size: 150,
        minSize: 80,
        enableResizing: true,
        cell: ({ row }) => {
          const { user, nmuser } = row.original;
          return (
            <Stack>
              <Typography variant="body">{nmuser}</Typography>
              <Typography variant="caption">{user.usertype}</Typography>
            </Stack>
          );
        }
      },
      // usertype
      {
        header: 'Menu',
        accessorKey: 'menu.name',
        size: 180,
        cell: ({ row }) => {
          const { menu, nmsubmenu } = row.original;
          return (
            <Stack>
              <Typography variant="body">{nmsubmenu}</Typography>
              <Typography variant="body2">{menu.name}</Typography>
            </Stack>
          );
        }
      },
      {
        header: 'Read',
        accessorKey: 'read',
        minSize: 70,
        size: 100,
        cell: ({ row }) => {
          const { read } = row.original;
          return <Checkbox checked={read == 'Y'} className="size-large" color={read == 'Y' ? 'error' : 'secondary'} />;
        }
      },
      {
        header: 'Add',
        accessorKey: 'insert',
        minSize: 70,
        size: 100,
        cell: ({ row }) => {
          const { insert } = row.original;
          return <Checkbox checked={insert == 'Y'} className="size-large" color={insert == 'Y' ? 'error' : 'secondary'} />;
        }
      },
      {
        header: 'Update',
        accessorKey: 'update',
        minSize: 70,
        size: 100,
        cell: ({ row }) => {
          const { update } = row.original;
          return <Checkbox checked={update == 'Y'} className="size-large" color={update == 'Y' ? 'error' : 'secondary'} />;
        }
      },
      {
        header: 'Delete',
        accessorKey: 'delete',
        minSize: 70,
        size: 100,
        cell: ({ row }) => {
          const { remove } = row.original;
          return <Checkbox checked={remove == 'Y'} className="size-large" color={remove == 'Y' ? 'error' : 'secondary'} />;
        }
      }
      // {
      //   header: 'Accept',
      //   accessorKey: 'accept',
      //   minSize: 70,
      //   size: 100,
      //   cell: ({ row }) => {
      //     const { accept } = row.original;
      //     return <Checkbox checked={accept == 'Y'} className="size-large" color={accept == 'Y' ? 'error' : 'secondary'} />;
      //   }
      // },
      // {
      //   header: 'Validate',
      //   accessorKey: 'validate',
      //   minSize: 70,
      //   size: 100,
      //   cell: ({ row }) => {
      //     const { validate } = row.original;
      //     return <Checkbox checked={validate == 'Y'} className="size-large" color={validate == 'Y' ? 'error' : 'secondary'} />;
      //   }
      // },
      // {
      //   header: 'Approve',
      //   accessorKey: 'approve',
      //   minSize: 70,
      //   size: 100,
      //   cell: ({ row }) => {
      //     const { approve } = row.original;
      //     return <Checkbox checked={approve == 'Y'} className="size-large" color={approve == 'Y' ? 'error' : 'secondary'} />;
      //   }
      // }
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
