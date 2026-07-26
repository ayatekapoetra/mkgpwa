import { useMemo } from 'react';

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import ScrollX from 'components/ScrollX';
import InputForm from 'components/InputForm';
import { EmptyTable } from 'components/third-party/ReactTable';

import { CloseSquare, TruckTick } from 'iconsax-react';
import { useBlockLayout, useFilters, useGlobalFilter, useResizeColumns, useTable } from 'react-table';

import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

const TableItems = ({ data = [], setFieldValue, remove }) => {
  const columns = useTableColumns(setFieldValue, remove);
  const filterTypes = useMemo(() => renderFilterTypes, []);
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
      minWidth: 50,
      width: 150,
      maxWidth: 500,
      resizable: true
    }),
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    { columns, data, defaultColumn, filterTypes },
    useBlockLayout,
    useGlobalFilter,
    useFilters,
    useResizeColumns
  );

  return (
    <ScrollX>
      <Table {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
            return (
            <TableRow key={key || headerGroup.id} {...restHeaderGroupProps}>
              {headerGroup.headers.map((column) => {
                const { key: columnKey, ...restColumnProps } = column.getHeaderProps();
                return (
                <TableCell key={columnKey || column.id} {...restColumnProps} style={{ width: column.width, position: 'relative', whiteSpace: 'nowrap' }}>
                  {column.render('Header')}
                </TableCell>
              )})}
            </TableRow>
          )})}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {rows.length > 0 ? (
            rows.map((row) => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <TableRow key={key || row.id || row.index} {...restRowProps}>
                  {row.cells.map((cell) => {
                    const { key: cellKey, ...restCellProps } = cell.getCellProps();
                    return (
                    <TableCell key={cellKey || cell.column.id} {...restCellProps}>
                      {cell.render('Cell')}
                    </TableCell>
                  )})}
                </TableRow>
              );
            })
          ) : (
            <EmptyTable msg="No Data" colSpan={headerGroups[0]?.headers?.length || 6} />
          )}
        </TableBody>
      </Table>
    </ScrollX>
  );
};

export default TableItems;

function useTableColumns(setFieldValue, remove) {
  return useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center' }}>No</div>,
        accessor: 'index',
        width: 60,
        Cell: ({ row }) => <div>{row.index + 1}.</div>
      },
      {
        Header: 'Berkas',
        accessor: 'noberkas',
        width: 180,
        Cell: ({ row }) => {
          const { noberkas, nmpemasok } = row.original;
          return (
            <Stack>
              <Typography variant="body1">{noberkas}</Typography>
              <Typography variant="caption">{nmpemasok}</Typography>
            </Stack>
          );
        }
      },
      {
        Header: 'Barang',
        accessor: 'narasi',
        width: 380,
        Cell: ({ row }) => {
          const { narasi, barang } = row.original;
          return (
            <Stack>
              <Typography variant="body1">{narasi}</Typography>
              <Typography variant="caption">{barang?.kode}</Typography>
            </Stack>
          );
        }
      },
      {
        Header: 'Ready',
        accessor: 'qty_pickup',
        width: 140,
        Cell: ({ row }) => {
          const { qty_pickup, remaining_qty, satuan } = row.original;
          return (
            <Stack>
              <Typography variant="body1">Total: {qty_pickup} {satuan}</Typography>
              <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                Sisa: {remaining_qty ?? qty_pickup} {satuan}
              </Typography>
            </Stack>
          );
        }
      },
      {
        Header: () => <div style={{ textAlign: 'right' }}>Qty Pickup</div>,
        id: 'pickup',
        width: 180,
        Cell: ({ row }) => {
          const { pickup, remaining_qty, qty_pickup, satuan } = row.original;
          return (
            <div style={{ textAlign: 'right' }}>
              <InputForm
                type="number"
                label="Qty Pickup"
                name={`pickup-${row.original.doitemid}`}
                value={pickup ?? ''}
                onChange={(e) => setFieldValue(`items.${row.index}.pickup`, e.target.value, false)}
                startAdornment={<TruckTick />}
              />
              <Typography variant="caption" color="secondary">
                Maks {remaining_qty ?? qty_pickup} {satuan}
              </Typography>
            </div>
          );
        }
      },
      {
        Header: 'Act',
        id: 'action',
        width: 60,
        Cell: ({ row }) => (
          <IconButton color="error" onClick={() => remove?.(row.index)}>
            <CloseSquare />
          </IconButton>
        )
      }
    ],
    [setFieldValue, remove]
  );
}
