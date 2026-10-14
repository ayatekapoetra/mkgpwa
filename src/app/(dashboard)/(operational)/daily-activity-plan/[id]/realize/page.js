import DailyActivityForm from 'views/operational/daily-activity/form';

export default function RealizeDailyActivityPlanPage({ params }) {
  return <DailyActivityForm headerId={params.id} mode="realize" />;
}
