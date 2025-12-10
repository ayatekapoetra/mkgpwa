// utils/axios-api.js - Khusus untuk API routes
import axios from 'utils/axios';

const axiosServices = axios.create({
  baseURL: process.env.NEXT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: false,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImRhdGEiOnsiZXhwaXJlc0luIjoiN2QifSwiaWF0IjoxNzU4NTIyMTY0fQ.nUGAAm-ZcJnVgbKekNMDsiA-76ltIei5HdUs6jJcVzg`
  }
});

axiosServices.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject((error.response && error.response.data) || error);
  }
);

export default axiosServices;