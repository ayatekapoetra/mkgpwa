import NotificationDetailScreen from 'views/notifications/detail';

export const metadata = { title: 'Notification Detail' };

export default function NotificationDetailPage({ params }) {
  return <NotificationDetailScreen uuid={params.uuid} />;
}
