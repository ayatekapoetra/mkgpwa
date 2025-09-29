import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
// import TableFooter from '@mui/material/TableFooter';
import IconButton from '@mui/material/IconButton';

import ScrollX from 'components/ScrollX';
import { TruckTick, CloseSquare } from 'iconsax-react';
import InputForm from 'components/InputForm';
import { EmptyTable } from 'components/third-party/ReactTable';

import { useTable, useFilters, useGlobalFilter, useBlockLayout, useResizeColumns } from 'react-table';

import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

const TableItems = ({ data = [], values, setFieldValue, remove, mutate }) => {
  const columns = useTableColumns(values, setFieldValue, remove, mutate);

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
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TableCell
                  key={column.id}
                  {...column.getHeaderProps()}
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
              ))}
            </TableRow>
          ))}
        </TableHead>

        <TableBody {...getTableBodyProps()}>
          {rows.length > 0 ? (
            rows.map((row) => {
              prepareRow(row);
              return (
                <TableRow key={row.id || row.index} {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.column.id} {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  ))}
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

function useTableColumns(values, setFieldValue, remove, mutate) {
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
          const { qty_do, satuan } = row.original;
          return (
            <Typography variant="body1">
              {qty_do} {satuan}
            </Typography>
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
        Header: () => <div style={{ textAlign: 'right' }}>Perintah Pickup</div>,
        id: 'perintahpickup',
        width: 180,
        maxWidth: 200,
        resizable: true,
        Cell: ({ row }) => {
          const itemId = row.original.id;
          const pickupValue = values?.items.find((item) => item.id === itemId)?.pickup || '';
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
                value={pickupValue}
                onChange={handleChange}
                startAdornment={<TruckTick />}
              />
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
          const index = values?.items.findIndex((item) => item.id === itemId);
          return (
            <IconButton
              color="error"
              onClick={() => {
                if (index !== -1) remove?.(index);
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
    [values, setFieldValue, remove, mutate]
  );
}
