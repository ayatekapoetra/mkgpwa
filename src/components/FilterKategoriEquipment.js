'use client';

import { useState, useEffect } from 'react';

// MATERIAL - UI
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

// PROJECT IMPORTS
import { useGetKategoriEquipment } from 'api/kategori-equipment';

export default function FilterKategoriEquipment({ value, label, name, setData, startAdornment, ...other }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const { data, dataLoading } = useGetKategoriEquipment();

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setOptions(data);
    } else {
      // Fallback options
      setOptions([
        { id: 'DT', name: 'Dump Truck' },
        { id: 'HE', name: 'Heavy Equipment' }
      ]);
    }
  }, [data]);

  const handleChange = (event, newValue) => {
    setData((prev) => ({
      ...prev,
      [name]: newValue?.id || ''
    }));
  };

  const selectedValue = options.find((option) => option.id === value) || null;

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      getOptionLabel={(option) => option.name || ''}
      value={selectedValue}
      onChange={handleChange}
      loading={dataLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            startAdornment: startAdornment,
            endAdornment: (
              <>
                {dataLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
          {...other}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.name}
        </li>
      )}
    />
  );
}
