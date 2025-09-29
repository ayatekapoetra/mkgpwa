import React, { useMemo } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';

import ScrollX from 'components/ScrollX';

// REACT TABLE
import { EmptyTable } from 'components/third-party/ReactTable';
import { useTable, useFilters, useGlobalFilter, useBlockLayout } from 'react-table';
import { DefaultColumnFilter, renderFilterTypes } from 'utils/react-table';

export default function ListPickupOrder({ data, columns, paginate }) {
  const VisibleColumn = [];
  const filterTypes = useMemo(() => renderFilterTypes, []);
  const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: {
        hiddenColumns: columns.filter((col) => VisibleColumn.includes(col.accessor)).map((col) => col.accessor)
      },
      filterTypes
    },
    useBlockLayout,
    useGlobalFilter,
    useFilters
  );

  return (
    <ScrollX>
      <Table {...getTableProps()}>
        <TableHead sx={{ borderTopWidth: 2 }}>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <TableRow key={key} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column) => {
                  const { key: columnKey, ...restColumnProps } = column.getHeaderProps();
                  return (
                    <TableCell key={columnKey} {...restColumnProps}>
                      {column.render('Header')}
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
        <TableFooter>
          <TableRow>
            <TableCell colSpan={9}>{paginate || null}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </ScrollX>
  );
}
