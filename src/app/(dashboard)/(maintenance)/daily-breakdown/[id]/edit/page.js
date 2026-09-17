'use client';

import BreakdownForm from 'views/maintenance/breakdown/form';

export default function Page({ params }) {
  return <BreakdownForm headerId={params.id} />;
}