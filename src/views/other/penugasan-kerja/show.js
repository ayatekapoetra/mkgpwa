'use client';

import { Fragment } from 'react';

// HOOK
import useUser from 'hooks/useUser';
import UpdatePenugasanKerja from './show/admin';
import MyPenugasanKerja from './show/mytask';

export default function ShowPenugasanKerja() {
  const user = useUser();

  return <Fragment>{['developer', 'administrator'].includes(user.role) ? <UpdatePenugasanKerja /> : <MyPenugasanKerja />}</Fragment>;
}
