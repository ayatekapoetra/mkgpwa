import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
// import TableFooter from '@mui/material/TableFooter';
import IconButton from '@mui/material/IconButton';

import ScrollX from 'components/ScrollX';
import { TruckTick, CloseSquare } from 'iconsax-react';
import InputForm from 'components/InputForm';
import { EmptyTable } from 'components/third-party/ReactTable';

import { useTable, useFilters, useGlobalFilter, useBlockLayout, useResizeColumns } from 'react-table';

import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

const TableItems = ({ data = [], setFieldValue, remove, mutate }) => {
  const columns = useTableColumns(setFieldValue, remove, mutate);

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
    {
      columns,
      data,
      defaultColumn,
      filterTypes
    },
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
                <TableCell
                  key={columnKey || column.id}
                  {...restColumnProps}
                  style={{
                    width: column.width,
                    position: 'relative',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.render('Header')}
                  {column.canResize && (
                    <div
                      {...column.getResizerProps()}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${column.Header}`}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: '5px',
                        cursor: 'col-resize',
                        zIndex: 1,
                        userSelect: 'none'
                      }}
                    />
                  )}
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
            <EmptyTable msg="No Data" colSpan={headerGroups[0]?.headers?.length || 12} />
          )}
        </TableBody>
      </Table>
    </ScrollX>
  );
};

export default TableItems;

function useTableColumns(setFieldValue, remove, mutate) {
  return useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center' }}>No</div>,
        accessor: 'index',
        width: 60,
        maxWidth: 100,
        resizable: true,
        Cell: ({ row }) => <div>{row.index + 1}.</div>
      },
      {
        Header: 'Narasi',
        accessor: 'narasi',
        width: 400,
        maxWidth: 600,
        minWidth: 200,
        resizable: true,
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
        Header: 'Order',
        accessor: 'kategori',
        width: 150,
        maxWidth: 300,
        resizable: true,
        Cell: ({ row }) => {
          const { qty_do, remaining_qty, satuan } = row.original;
          return (
            <Stack>
              <Typography variant="body1">
                Total: {qty_do} {satuan}
              </Typography>
              <Typography variant="caption" color="secondary">
                Sisa DO: {remaining_qty ?? qty_do} {satuan}
              </Typography>
            </Stack>
          );
        }
      },
      {
        Header: 'Berkas',
        accessor: 'kode_po',
        width: 150,
        maxWidth: 300,
        resizable: true,
        Cell: ({ row }) => {
          const { noberkas } = row.original;
          return <Typography>{noberkas}</Typography>;
        }
      },
      {
        Header: 'Pickup?',
        id: 'is_pickup',
        width: 140,
        maxWidth: 160,
        resizable: true,
        Cell: ({ row }) => {
          const { is_pickup } = row.original;
          const checked = is_pickup === 'Y';

          return (
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  size="small"
                  checked={checked}
                  onChange={(e) => {
                    const nextValue = e.target.checked ? 'Y' : 'N';
                    setFieldValue(`items.${row.index}.is_pickup`, nextValue, false);
                  }}
                />
              }
              label={checked ? 'Ya' : 'Tidak'}
            />
          );
        }
      },
      {
        Header: () => <div style={{ textAlign: 'right' }}>Qty DO</div>,
        id: 'perintahpickup',
        width: 180,
        maxWidth: 200,
        resizable: true,
        Cell: ({ row }) => {
          const itemId = row.original.id;
          const { satuan, remaining_qty, qty_do, pickup, is_pickup } = row.original;
          const handleChange = (e) => {
            setFieldValue(`items.${row.index}.pickup`, e.target.value, false);
          };
          return (
            <div style={{ textAlign: 'right' }}>
              <InputForm
                type="number"
                label="Qty Pickup"
                name={`pickup-${itemId}`}
                placeholder="Pickup"
                value={pickup ?? ''}
                onChange={handleChange}
                startAdornment={<TruckTick />}
              />
              <Typography variant="caption" color="secondary">
                Maks {remaining_qty ?? qty_do} {satuan} • {is_pickup === 'Y' ? 'Butuh pickup barang' : 'Tanpa pickup barang'}
              </Typography>
            </div>
          );
        }
      },
      {
        Header: 'Act',
        id: 'action',
        width: 60,
        maxWidth: 100,
        resizable: false,
        Cell: ({ row }) => {
          const itemId = row.original.id;
          return (
            <IconButton
              color="error"
              onClick={() => {
                remove?.(row.index);
                mutate?.((currentData) => {
                  const result = currentData.rows.map((m) => (m.id === itemId ? { ...m, selected: !m.selected } : m));
                  return { ...currentData, rows: result };
                }, false);
              }}
            >
              <CloseSquare />
            </IconButton>
          );
        }
      }
    ],
    [setFieldValue, remove, mutate]
  );
}
