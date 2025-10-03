// utils/axios.js
import axios from 'axios';
import { getSession } from 'next-auth/react';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const axiosServices = axios.create({
  baseURL: process.env.NEXT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: false,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosServices.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      if (session?.token?.accessToken) {
        config.headers['Authorization'] = `Bearer ${session.token.accessToken}`;
      } else {
        // Fallback to provided token
        config.headers['Authorization'] =
          `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImRhdGEiOnsiZXhwaXJlc0luIjoiN2QifSwiaWF0IjoxNzU4NTIyMTY0fQ.nUGAAm-ZcJnVgbKekNMDsiA-76ltIei5HdUs6jJcVzg`;
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

axiosServices.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('🚫 Offline → simpan request ke queue');
      }
      const config = error.config;
      await saveRequest(config);
      return Promise.resolve({ status: 0, message: 'Request disimpan offline' });
    }

    if (error.response?.status === 401 && typeof window !== 'undefined' && !window.location.href.includes('/login')) {
      window.location.pathname = '/login';
    }
    return Promise.reject((error.response && error.response.data) || error);
  }
);

export default axiosServices;

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.get(url, { ...config });

  return res.data;
};

export const fetcherPost = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.post(url, { ...config });

  return res.data;
};

// Saat browser online kembali → replay queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Back online → replaying queued requests');
    }
    replayRequests();
  });
}
