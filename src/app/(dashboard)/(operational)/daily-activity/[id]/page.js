import DailyActivityDetail from 'views/operational/daily-activity/detail';

export default function Page({ params }) {
  return <DailyActivityDetail id={params.id} />;
}
