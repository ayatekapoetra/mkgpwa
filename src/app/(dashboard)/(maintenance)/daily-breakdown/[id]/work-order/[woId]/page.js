'use client';

import WorkOrderDetail from 'views/maintenance/work-order/[id]';

export default function Page({ params }) {
  return <WorkOrderDetail woId={params.woId} breakdownId={params.id} />;
}