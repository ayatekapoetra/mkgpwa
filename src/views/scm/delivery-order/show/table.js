import { useCallback, useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// import TableFooter from '@mui/material/TableFooter';
// import IconButton from '@mui/material/IconButton';

import ScrollX from 'components/ScrollX';
// import { TruckTick, CloseSquare } from 'iconsax-react';
// import InputForm from 'components/InputForm';
import { EmptyTable } from 'components/third-party/ReactTable';
import { Printer } from 'iconsax-react';
import axiosServices from 'utils/axios';

import { useTable, useFilters, useGlobalFilter, useBlockLayout, useResizeColumns } from 'react-table';

import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

const TableItems = ({ data = [], values, setFieldValue }) => {
  const handlePrintQrcode = useCallback(async (itemId) => {
    try {
      const response = await axiosServices.get(`/scm/delivery-order/${itemId}/print-qrcode`, {
        responseType: 'blob'
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.error('Failed to print qrcode item:', error);
    }
  }, []);

  const columns = useTableColumns(values, setFieldValue, handlePrintQrcode);

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

function useTableColumns(values, setFieldValue, onPrintQrcode) {
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
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>PRT</div>,
        id: 'print',
        width: 60,
        disableSortBy: true,
        disableFilters: true,
        Cell: ({ row }) => {
          const itemId = row.original?.id;
          const isSparePart = row.original?.barang;
          if(isSparePart){
            return (
              <Box sx={{ width: 24, textAlign: 'center' }}>
                <Tooltip title="Print">
                  <IconButton color="primary" size="small" onClick={() => itemId && onPrintQrcode?.(itemId)} disabled={!itemId}>
                    <Printer size="16" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }else{
            return null
          }
        }
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
        Header: 'Ready Pickup',
        id: 'qty_pickup',
        width: 100,
        maxWidth: 130,
        resizable: true,
        Cell: ({ row }) => {
          const { qty_pickup } = row.original;
          return <Typography sx={{textAlign: 'right'}}>{qty_pickup}</Typography>;
        }
      },
      {
        Header: 'Stn',
        accessor: 'satuan',
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
      },
      {
        Header: () => <div style={{ textAlign: 'right' }}>Harga</div>,
        accessor: 'harga',
        width: 150,
        maxWidth: 300,
        resizable: true,
        Cell: ({ row }) => {
          const { harga } = row.original;
          const nominal = Number(harga || 0);
          return <Typography sx={{ textAlign: 'right' }}>{nominal.toLocaleString('id-ID')}</Typography>;
        }
      },
      {
        Header: 'Transit Gudang',
        accessor: 'gudang.nama',
        width: 150,
        maxWidth: 300,
        resizable: true,
        Cell: ({ row }) => {
          const { gudang } = row.original;
          return <Typography>{gudang?.nama || ''}</Typography>;
        }
      },
    ],
    [onPrintQrcode]
  );
}
