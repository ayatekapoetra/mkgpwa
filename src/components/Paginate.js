'use client';

import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

const Paginate = ({
  page = 1,
  lastPage = 1,
  // perPage = 10,
  total = 0,
  maxVisible = 5,
  onPageChange
}) => {
  const currentPage = page;

  const half = Math.floor(maxVisible / 2);
  let startPage = Math.max(1, currentPage - half);
  let endPage = Math.min(lastPage, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible && startPage > 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <div>total {total} rows</div>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </Button>

        {pages.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => onPageChange(pageNumber)}
            sx={{ minWidth: 8 }}
          >
            {pageNumber}
          </Button>
        ))}

        {endPage < lastPage && (
          <IconButton disabled color="secondary">
            ...
          </IconButton>
        )}

        <Button
          variant="outlined"
          color="primary"
          onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
};

// ✅ Validasi props dengan PropTypes
Paginate.propTypes = {
  page: PropTypes.number,
  lastPage: PropTypes.number,
  perPage: PropTypes.number,
  total: PropTypes.number,
  maxVisible: PropTypes.number,
  onPageChange: PropTypes.func.isRequired
};

export default Paginate;
