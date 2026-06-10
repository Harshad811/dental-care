import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise((resolve) => {
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (state._hasHydrated && state.accessToken) {
            unsubscribe();
            resolve(undefined);
          }
        });
      });
      return api(originalRequest);
    }

    isRefreshing = true;
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }
      const res = await axios.post("/api/v1/auth/refresh", { refresh_token: refreshToken });
      const { access_token, refresh_token } = res.data;
      useAuthStore.getState().setTokens(access_token, refresh_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
