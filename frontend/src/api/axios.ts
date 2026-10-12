import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { store } from "../app/store";
import { env } from "../config/env";
import { logout, updateAccessToken } from "../features/auth/authSlice";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const freshToken = response.headers["x-access-token"];

    if (freshToken) {
      store.dispatch(updateAccessToken(freshToken));
    }

    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Request failed";

    if (status === 401) {
      store.dispatch(logout());
      toast.error("Session expired. Please login again.");
    } else if (status && status >= 500) {
      toast.error("Server error. Please try again.");
    } else if (message) {
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  },
);
