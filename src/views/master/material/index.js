'use client';

// REACT
import { useMemo, useState } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import FilterListIcon from '@mui/icons-material/FilterList';

// COMPONENTS
import MainCard from 'components/MainCard';
import ListMaterial from './list';
import FilterMaterial from './filter';

// THIRD - PARTY
import { Edit2 } from 'iconsax-react';
import { useQuery } from '@tanstack/react-query';
import axiosServices from 'utils/axios';

function MaterialScreen() {
  const columns = DataColumn();
  const [openFilter, setOpenFilter] = useState(false);
  const [params, setParams] = useState({
    nama: '',
    kategori: ''
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ['jenis-material', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.nama) queryParams.append('nama', params.nama);
      if (params.kategori) queryParams.append('kategori', params.kategori);
      
      const url = `/master/material-ritase/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const res = await axiosServices.get(url);
      return res.data;
    }
  });

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  const filteredData = useMemo(() => {
    if (!data.rows) return [];
    
    let filtered = data.rows;
    
    if (params.nama) {
      filtered = filtered.filter(item => 
        item.nama?.toLowerCase().includes(params.nama.toLowerCase())
      );
    }
    
    if (params.kategori) {
      filtered = filtered.filter(item => 
        item.kategori?.toLowerCase().includes(params.kategori.toLowerCase())
      );
    }
    
    return filtered;
  }, [data.rows, params]);

  return (
    <MainCard 
      title={<BtnAction />} 
      secondary={
        <Stack direction="row" gap={1}>
          <IconButton aria-label="filter" variant="dashed" color="primary" onClick={toggleFilterHandle}>
            <FilterListIcon />
          </IconButton>
        </Stack>
      } 
      content={false}
    >
      <FilterMaterial 
        data={params} 
        setData={setParams} 
        open={openFilter} 
        count={filteredData.length} 
        onClose={toggleFilterHandle} 
      />
      {isLoading ? <h1>Loading...</h1> : <ListMaterial data={filteredData} columns={columns} />}
    </MainCard>
  );
}

function BtnAction() {
  return <Button variant="contained">Add Material</Button>;
}

function DataColumn() {
  const column = useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>ACT</div>,
        accessor: 'index',
        Cell: ({ row }) => {
          const materialId = row.original?.id ?? row.original?.material_id;
          return (
            <Box sx={{ width: 15 }}>
              <IconButton
                variant="dashed"
                color="primary"
                component={materialId ? Link : undefined}
                href={materialId ? `/material/${materialId}` : undefined}
                disabled={!materialId}
              >
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
