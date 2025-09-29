'use client';

// REACT
import { useMemo } from 'react';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';
import ListMaterial from './list';

// THIRD - PARTY
import { Edit2 } from 'iconsax-react';
import { useQuery } from '@tanstack/react-query';
import axiosServices from 'utils/axios';

function MaterialScreen() {
  const columns = DataColumn();
  const { data = [], isLoading } = useQuery({
    queryKey: ['jenis-material'],
    queryFn: async () => {
      const res = await axiosServices.get('/api/master/material-ritase/list');
      return res.data;
    }
  });

  return (
    <MainCard title={<BtnAction />} secondary={<div>xxxx</div>} content={false}>
      {isLoading ? <h1>Loading...</h1> : <ListMaterial data={data.rows} columns={columns} />}
    </MainCard>
  );
}

function BtnAction() {
  return <Button variant="contained">Add Meterial</Button>;
}

function DataColumn() {
  const column = useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>ACT</div>,
        accessor: 'index',
        Cell: () => {
          return (
            <Box sx={{ width: 15 }}>
              <IconButton variant="dashed" color="primary" onClick={() => alert('masih dalam pengembangan...')}>
                <Edit2 />
              </IconButton>
            </Box>
          );
        }
      },
      {
        Header: 'Jenis Material',
        id: 'nama',
        accessor: 'nama',
        Cell: ({ row }) => {
          const { nama } = row.original;
          return <Typography variant="body1">{nama}</Typography>;
        }
      },
      {
        Header: 'Kategori',
        id: 'ctg',
        accessor: 'kategori',
        minWidth: 300 // lebar minimum
      },
      {
        Header: () => <div style={{ textAlign: 'right' }}>Coefisient</div>,
        id: 'coefisient',
        accessor: 'coefisien',
        Cell: ({ row }) => {
          const { coefisien } = row.original;
          return (
            <div style={{ textAlign: 'right' }}>
              <Typography variant="body1">{coefisien}</Typography>
            </div>
          );
        }
      }
    ],
    []
  );

  return column;
}

export default MaterialScreen;
