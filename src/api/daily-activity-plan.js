import axiosServices from 'utils/axios';

const config = { skipOfflineQueue: true };
const payload = (response) => response.data?.data ?? response.data;
const action = async (id, name, data) => payload(await axiosServices.post(`/operation/daily-activity/${id}/${name}`, data, config));

export const saveDailyActivityPlan = (id, data) => action(id, 'save-plan', data);
export const convertDailyActivityPlan = (id, data) => action(id, 'convert-to-actual', data);
export const deleteDailyActivityPlan = (id, plan_version) => action(id, 'delete-plan', { plan_version });
export const getLastDailyActivityPlan = async (params) => payload(await axiosServices.get('/operation/daily-activity/last-plan', { ...config, params }));
