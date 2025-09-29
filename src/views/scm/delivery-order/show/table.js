import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
// import TableFooter from '@mui/material/TableFooter';
// import IconButton from '@mui/material/IconButton';

import ScrollX from 'components/ScrollX';
// import { TruckTick, CloseSquare } from 'iconsax-react';
// import InputForm from 'components/InputForm';
import { EmptyTable } from 'components/third-party/ReactTable';

import { useTable, useFilters, useGlobalFilter, useBlockLayout, useResizeColumns } from 'react-table';

import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

const TableItems = ({ data = [], values, setFieldValue }) => {
  const columns = useTableColumns(values, setFieldValue);

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

function useTableColumns(values, setFieldValue) {
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
        Header: 'Pickup',
        id: 'qty_pickup',
        width: 100,
        maxWidth: 130,
        resizable: true,
        Cell: ({ row }) => {
          const { qty_pickup } = row.original;
          return <Typography>{qty_pickup}</Typography>;
        }
      },
      {
        Header: 'Order',
        accessor: 'kategori',
        width: 100,
        maxWidth: 150,
        resizable: true,
        Cell: ({ row }) => {
          const { satuan } = row.original;
          return <Typography variant="body1">{satuan}</Typography>;
        }
      },
      {
        Header: 'Berkas',
        accessor: 'kode_po',
        width: 150,
        maxWidth: 300,
        resizable: true,
        Cell: ({ row }) => {
          const { kode_doc } = row.original;
          return <Typography>{kode_doc}</Typography>;
        }
      }
    ],
    [values, setFieldValue]
  );
}
