// utils/axios.js
import axios from "axios";
import { getSession } from "next-auth/react";
import { replayRequests, saveRequest } from "lib/offlineFetch";

const axiosServices = axios.create({
  baseURL:
    process.env.NEXT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: false,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

function normalizeJsonPayload(data) {
  let parsed = data;

  for (let attempt = 0; attempt < 2 && typeof parsed === "string"; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return data;
    }
  }

  return parsed && typeof parsed === "object" ? parsed : data;
}

axiosServices.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const token = session?.token?.accessToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    const contentType = config.headers?.["Content-Type"] || config.headers?.get?.("Content-Type");
    if (typeof config.data === "string" && contentType?.includes("application/json")) {
      config.data = normalizeJsonPayload(config.data);
    }

    // Prevent double "/api/api" when baseURL already has /api and url also starts with /api/
    const base = config.baseURL || axiosServices.defaults.baseURL || "";
    if (base?.endsWith("/api") && config.url?.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api\//, "/");
    }

    // Normalize accidental double slashes
    if (config.url?.startsWith("//")) {
      config.url = config.url.replace(/^\/+/, "/");
    }

    // Export/download endpoints can legitimately take much longer than normal API calls.
    if (
      typeof config.url === 'string' &&
      (config.url.includes('/export-excel') || config.url.includes('/download'))
    ) {
      config.timeout = Math.max(Number(config.timeout) || 0, 300000);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosServices.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      if (error.config?.skipOfflineQueue) {
        return Promise.reject(new Error("Fitur ini memerlukan koneksi internet"));
      }
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("🚫 Offline → simpan request ke queue");
      }
      const config = error.config;
      await saveRequest(config);
      return Promise.resolve({
        status: 0,
        message: "Request disimpan offline",
      });
    }

    if (
      error.response?.status === 401 &&
      !error.config?.skipAuthRedirect &&
      typeof window !== "undefined" &&
      !window.location.href.includes("/login")
    ) {
      window.location.pathname = "/login";
    }

    if (error.config?.responseType === 'blob') {
      return Promise.reject(error);
    }

    return Promise.reject((error.response && error.response.data) || error);
  },
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
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      console.log("Back online → replaying queued requests");
    }
    replayRequests();
  });
}
