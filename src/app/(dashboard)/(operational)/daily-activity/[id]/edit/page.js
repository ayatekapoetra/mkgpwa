import DailyActivityForm from 'views/operational/daily-activity/form';

export default function Page({ params }) {
  return <DailyActivityForm headerId={params.id} />;
}
