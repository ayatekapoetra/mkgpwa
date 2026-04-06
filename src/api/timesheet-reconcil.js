import axiosServices from 'utils/axios';

export const postTimesheetReconcil = async (payload) => {
  const response = await axiosServices.post('/api/operation/timesheet/reconcil', payload);
  return response.data;
};

export const getTimesheetReconcilDetail = async (id) => {
  const response = await axiosServices.get(`/api/operation/timesheet/reconcil/${id}`);
  return response.data;
};

export default postTimesheetReconcil;
