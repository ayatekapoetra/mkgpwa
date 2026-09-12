import axiosServices from 'utils/axios';

const BASE = '/operation/daily-breakdown';

export async function createDailyBreakdown(payload) {
  const response = await axiosServices.post(`${BASE}/create`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function updateDailyBreakdown(id, payload) {
  const response = await axiosServices.post(`${BASE}/${id}/update`, payload, { skipOfflineQueue: true });
  return response.data?.rows || response.data;
}

export async function deleteDailyBreakdown(id) {
  const response = await axiosServices.post(`${BASE}/${id}/destroy`, {}, { skipOfflineQueue: true });
  return response.data;
}