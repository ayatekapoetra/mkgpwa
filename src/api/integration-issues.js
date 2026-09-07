import { useMemo } from 'react';
import useSWR from 'swr';

import axiosServices, { fetcher } from 'utils/axios';

const endpoint = '/integration-issues';

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  return query.toString();
}

export function useIntegrationIssues(params = {}) {
  const query = queryString(params);
  const url = `${endpoint}${query ? `?${query}` : ''}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true
  });

  return useMemo(
    () => ({
      issues: data?.rows || [],
      summary: data?.summary || { total: 0, failed: 0, blocked_mapping: 0, dead_letter: 0 },
      pagination: data?.pagination || { page: 1, per_page: 25, total: 0, last_page: 0 },
      permissions: data?.permissions || { can_read: false, can_requeue: false, can_open_mapping: false },
      issuesLoading: isLoading,
      issuesRefreshing: isValidating,
      issuesError: error,
      refreshIssues: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useIntegrationIssue(id) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(id ? `${endpoint}/${id}` : null, fetcher, {
    revalidateOnFocus: true
  });

  return useMemo(
    () => ({
      issue: data?.rows || null,
      permissions: data?.permissions || { can_read: false, can_requeue: false, can_open_mapping: false },
      issueLoading: isLoading,
      issueRefreshing: isValidating,
      issueError: error,
      refreshIssue: mutate
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function requeueIntegrationIssue(id, reason) {
  const response = await axiosServices.post(
    `${endpoint}/${id}/requeue`,
    { reason },
    { skipOfflineQueue: true }
  );
  return response.data;
}
