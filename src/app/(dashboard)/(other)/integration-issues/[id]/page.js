'use client';

import { useParams } from 'next/navigation';

import IntegrationIssueDetailScreen from 'views/integration-issues/show';

export default function Page() {
  const params = useParams();
  return <IntegrationIssueDetailScreen issueId={params.id} />;
}
