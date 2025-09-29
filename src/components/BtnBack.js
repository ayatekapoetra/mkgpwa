import Link from 'next/link';
import { Button, Typography } from '@mui/material';

import { ArrowCircleLeft2 } from 'iconsax-react';

export default function BtnBack({ href }) {
  return (
    <Button color="secondary" component={Link} href={href} startIcon={<ArrowCircleLeft2 variant="Bold" />}>
      <Typography vaiant="body1"> Back</Typography>
    </Button>
  );
}
