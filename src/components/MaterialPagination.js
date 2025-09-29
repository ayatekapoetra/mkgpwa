import PropTypes from 'prop-types';
import { Pagination, PaginationItem, Stack } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const MaterialPagination = ({ currentPage, lastPage, onPageChange }) => {
  return (
    <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
      <Pagination
        count={lastPage}
        page={currentPage}
        onChange={(event, page) => onPageChange(page)}
        color="primary"
        shape="rounded"
        renderItem={(item) => <PaginationItem slots={{ previous: ChevronLeft, next: ChevronRight }} {...item} />}
        showFirstButton
        showLastButton
      />
    </Stack>
  );
};

// Validasi prop types
MaterialPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  lastPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
};

export default MaterialPagination;
