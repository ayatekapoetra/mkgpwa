'use client';

import WorkOrderDetail from 'views/maintenance/work-order/[id]';

export default function Page({ params }) {
  return <WorkOrderDetail woId={params.id} backHref="/daily-work-order" listHref="/daily-work-order" listTitle="Daily Work Order" />;
}
