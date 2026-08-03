import { useMemo } from 'react';
import useSWR, { mutate as mutateCache } from 'swr';

import axiosServices from 'utils/axios';

export const endpoints = {
  admin: '/app-notifications/admin',
  access: '/app-notifications/admin/access',
  users: '/app-notifications/admin/users',
  audienceOptions: '/app-notifications/admin/audience-options',
  audienceRecipients: '/app-notifications/admin/audience-recipients',
  inbox: '/app-notifications/inbox',
  unreadCount: '/app-notifications/unread-count'
};

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: false
};

const notificationFetcher = async (url) => {
  const response = await axiosServices.get(url, {
    validateStatus: (status) => (status >= 200 && status < 300) || status === 403
  });
  if (response.status === 403) {
    const error = new Error(response.data?.message || 'Forbidden');
    error.status = 403;
    throw error;
  }
  return response.data;
};

const unwrap = (payload) => payload?.data ?? payload ?? null;

const normalizeList = (payload, defaults = {}) => {
  const root = payload || {};
  const nested = root?.data && !Array.isArray(root.data) ? root.data : null;
  const rows = Array.isArray(root)
    ? root
    : root.rows || root.items || (Array.isArray(root.data) ? root.data : null) || nested?.rows || nested?.items || [];
  const meta = root.meta || nested?.meta || root.pagination || nested?.pagination || root;

  return {
    rows,
    total: Number(meta.total ?? root.total ?? rows.length),
    page: Number(meta.current_page ?? meta.currentPage ?? meta.page ?? defaults.page ?? 1),
    perPage: Number(meta.per_page ?? meta.perPage ?? defaults.perPage ?? 25),
    lastPage: Number(meta.last_page ?? meta.lastPage ?? Math.max(1, Math.ceil((meta.total ?? rows.length) / (defaults.perPage || 25))))
  };
};

const queryKey = (url, params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `${url}?${suffix}` : url;
};

const useNormalizedList = (url, params, enabled = true) => {
  const key = enabled ? queryKey(url, params) : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, notificationFetcher, swrOptions);

  return useMemo(
    () => ({
      ...normalizeList(data, params),
      dataLoading: isLoading,
      dataError: error,
      dataValidating: isValidating,
      mutate
    }),
    [data, error, isLoading, isValidating, mutate, params]
  );
};

export function useNotificationAdminAccess() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(endpoints.access, notificationFetcher, swrOptions);
  return useMemo(
    () => ({ access: unwrap(data), dataLoading: isLoading, dataError: error, dataValidating: isValidating, mutate }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useNotificationUsers(params, enabled = true) {
  return useNormalizedList(endpoints.users, params, enabled);
}

export function useNotificationAudienceOptions(audienceType, enabled = true) {
  return useNormalizedList(endpoints.audienceOptions, { audience_type: audienceType }, enabled && Boolean(audienceType));
}

export function useNotificationHistory(params) {
  return useNormalizedList(endpoints.admin, params);
}

export function useNotificationAdminDetail(uuid) {
  const { data, error, isLoading, mutate } = useSWR(uuid ? `${endpoints.admin}/${uuid}` : null, notificationFetcher, swrOptions);
  return { data: unwrap(data), dataLoading: isLoading, dataError: error, mutate };
}

export function useNotificationInbox(params, enabled = true) {
  return useNormalizedList(endpoints.inbox, params, enabled);
}

export function useNotificationInboxDetail(uuid) {
  const { data, error, isLoading, mutate } = useSWR(uuid ? queryKey(`${endpoints.inbox}/${uuid}`, { app: 'web' }) : null, notificationFetcher, swrOptions);
  return { data: unwrap(data), dataLoading: isLoading, dataError: error, mutate };
}

export function useNotificationUnreadCount() {
  const key = queryKey(endpoints.unreadCount, { app: 'web' });
  const { data, error, isLoading, mutate } = useSWR(key, notificationFetcher, {
    ...swrOptions,
    refreshInterval: 60000
  });
  const value = unwrap(data);
  return {
    unreadCount: Number(value?.unread_count ?? value?.unreadCount ?? value?.count ?? value ?? 0),
    dataLoading: isLoading,
    dataError: error,
    mutate
  };
}

export async function createNotification(payload) {
  const response = await axiosServices.post(endpoints.admin, payload, { skipOfflineQueue: true });
  await mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.admin));
  return unwrap(response.data);
}

export async function getNotificationAudienceRecipients(params) {
  const response = await axiosServices.get(endpoints.audienceRecipients, { params });
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload) ? payload : [];
}

export async function retryNotification(uuid) {
  const response = await axiosServices.post(`${endpoints.admin}/${uuid}/retry`, {}, { skipOfflineQueue: true });
  await mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.admin));
  return unwrap(response.data);
}

export async function markNotificationRead(uuid) {
  const response = await axiosServices.post(`${endpoints.inbox}/${uuid}/read`, {}, { skipOfflineQueue: true, params: { app: 'web' } });
  await Promise.all([
    mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.inbox)),
    mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.unreadCount))
  ]);
  return unwrap(response.data);
}

export async function markAllNotificationsRead() {
  const response = await axiosServices.post(`${endpoints.inbox}/read-all`, {}, { skipOfflineQueue: true, params: { app: 'web' } });
  await Promise.all([
    mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.inbox)),
    mutateCache((key) => typeof key === 'string' && key.startsWith(endpoints.unreadCount))
  ]);
  return unwrap(response.data);
}
