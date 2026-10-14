import DailyActivityForm from 'views/operational/daily-activity/form';

export default function EditDailyActivityPlanPage({ params }) {
  return <DailyActivityForm headerId={params.id} mode="plan" />;
}
