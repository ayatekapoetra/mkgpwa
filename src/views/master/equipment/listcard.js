import Link from 'next/link';

// MATERIAL - UI
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// THIRD - PARTY
import { Edit2 } from 'iconsax-react';

const CardListEquipment = ({ data }) => {
  const list = Array.isArray(data) ? data : data?.data || [];
  return (
    <Stack>
      <Grid container spacing={2} sx={{ px: 3, mt: 1 }}>
        {list.map((val) => {
          return (
            <Grid key={val.id} item xs={12} sm={6} lg={4}>
              <CardEquipment value={val} />
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
};

export default CardListEquipment;

const CardEquipment = (props) => {
  const { value } = props;
  switch (value.model) {
    case 'SK200-10':
      var uri = `/assets/images/equipment/SK200-10.png`;
      break;
    case 'FN62FHD':
      var uri = `/assets/images/equipment/FN62FHD.png`;
      break;
    case 'BW211D40':
      var uri = `/assets/images/equipment/BW211D40.png`;
      break;
    case 'FVZ285':
      var uri = `/assets/images/equipment/FVZ285.png`;
      break;
    default:
      var uri = `/assets/images/equipment/330D.png`;
      break;
  }
  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'red' }} aria-label="recipe">
            {value.kategori}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings" component={Link} href={`/equipment/${value.id}/show`}>
            <Edit2 />
          </IconButton>
        }
        title={<Typography variant="h4">{value.kode}</Typography>}
        subheader={value.identity}
      />
      <CardMedia component="img" height="194" image={uri} alt="Paella dish" />
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Model
          </Typography>
          <Typography variant="body1">{value.model}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manufacture
          </Typography>
          <Typography variant="body1">{value.manufaktur}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Tahun Pembelian
          </Typography>
          <Typography variant="body1">{value.tahun}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Group
          </Typography>
          <Typography variant="body1">{value.group}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
