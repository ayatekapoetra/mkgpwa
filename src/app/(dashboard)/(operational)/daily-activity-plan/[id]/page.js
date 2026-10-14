import DailyActivityDetail from 'views/operational/daily-activity/detail';

export default function DailyActivityPlanDetailPage({ params }) {
  return <DailyActivityDetail id={params.id} planView />;
}
