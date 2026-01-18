import axiosServices from 'utils/axios';

export const endpoints = {
  forgotPassword: '/auth/forgot-password',
  validateToken: '/auth/reset-password',
  resetPassword: '/auth/reset-password'
};

export const forgotPassword = async (phone) => {
  const response = await axiosServices.post(endpoints.forgotPassword, { phone });
  return response.data;
};

export const validateResetToken = async (token) => {
  const response = await axiosServices.get(`${endpoints.validateToken}/${token}`);
  return response.data;
};

export const resetPassword = async (token, password, password_confirmation) => {
  const response = await axiosServices.post(endpoints.resetPassword, {
    token,
    password,
    password_confirmation
  });
  return response.data;
};
