import axios, { AxiosInstance } from "axios";
import { handleError, showErrorAlert } from "@/utils/errors";

declare module "axios" {
  interface AxiosRequestConfig {
    skipErrorAlert?: boolean;
  }
}

const DEFAULT_API_TIMEOUT_MS = 30_000;

const parseApiTimeoutMs = () => {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
  if (!raw) return DEFAULT_API_TIMEOUT_MS;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_API_TIMEOUT_MS;
};

class ApiClient {
  client: AxiosInstance;
  readonly apiBaseUrl = "/api";
  readonly timeoutMs = parseApiTimeoutMs();

  constructor() {
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.timeoutMs,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = getToken();
      const hasAuthorizationHeader = Boolean(
        config.headers?.Authorization ?? config.headers?.authorization,
      );

      if (token && !hasAuthorizationHeader) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const appError = handleError(error);

        if (appError.status === 401) {
          clearToken();
        }

        const requestUrl = axios.isAxiosError(error)
          ? (error.config?.url ?? "")
          : "";
        const isSilentAuthRequest = requestUrl.includes("/portal/me");
        const skipErrorAlert = Boolean(
          axios.isAxiosError(error) && error.config?.skipErrorAlert,
        );

        if (!isSilentAuthRequest && !skipErrorAlert) {
          void showErrorAlert(appError);
        }

        return Promise.reject(appError);
      },
    );
  }
}

const apiClient = new ApiClient();

const getCookieToken = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const getToken = () => {
  if (typeof window === "undefined") return null;

  const fromStorage = window.localStorage.getItem("access_token");
  if (fromStorage) return fromStorage;

  const fromCookie = getCookieToken();
  if (fromCookie) {
    window.localStorage.setItem("access_token", fromCookie);
    return fromCookie;
  }

  return null;
};

export const syncToken = () => {
  const token = getToken();
  if (token) {
    setToken(token);
  }
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("access_token", token);
  window.document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("access_token");
  window.document.cookie = "access_token=; path=/; max-age=0";
};

export const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

export default apiClient;
