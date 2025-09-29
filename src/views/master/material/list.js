import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// REACT TABLE
import { useTable } from 'react-table';
import { EmptyTable } from 'components/third-party/ReactTable';
import { DefaultColumnFilter } from 'utils/react-table';

function ListMaterial({ data, columns }) {
  const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
    defaultColumn
  });

  return (
    <Stack>
      <Table {...getTableProps()}>
        <TableHead sx={{ borderTopWidth: 2 }}>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <TableRow key={key} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column) => {
                  console.log('column.', column);

                  const { key: columnKey, ...restColumnProps } = column.getHeaderProps();
                  return (
                    <TableCell key={columnKey} {...restColumnProps}>
                      {column.render('Header')}
                      {column.canFilter ? <div>{column.render('Filter')}</div> : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableHead>

        <TableBody {...getTableBodyProps()}>
          {rows.length > 0 ? (
            rows.map((row) => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <TableRow key={key} {...restRowProps}>
                  {row.cells.map((cell) => {
                    const { key: cellKey, ...restCellProps } = cell.getCellProps();
                    return (
                      <TableCell key={cellKey} {...restCellProps}>
                        {cell.render('Cell')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <EmptyTable msg="No Data" colSpan={headerGroups[0]?.headers?.length || 12} />
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

export default ListMaterial;
