import axios from "axios";
import type {
  AuthResponse,
  WatchlistItem,
  NewsArticle,
  SentimentSummary,
  SentimentHistoryPoint,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

// Add the saved JWT to every request so we don't have to pass it manually.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired (401), clear it and send the user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mp_token");
      localStorage.removeItem("mp_user");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) => {
    // The backend's login expects form-encoded data with a "username" field.
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api
      .post<AuthResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((r) => r.data);
  },
};

export const watchlistApi = {
  list: () => api.get<WatchlistItem[]>("/watchlist").then((r) => r.data),
  add: (ticker: string, notes?: string) =>
    api.post<WatchlistItem>("/watchlist", { ticker, notes }).then((r) => r.data),
  remove: (ticker: string) => api.delete(`/watchlist/${ticker}`),
};

export const stockApi = {
  news: (ticker: string) => api.get<NewsArticle[]>(`/stocks/${ticker}/news`).then((r) => r.data),
  sentiment: (ticker: string) =>
    api.get<SentimentSummary>(`/stocks/${ticker}/sentiment`).then((r) => r.data),
  history: (ticker: string) =>
    api.get<SentimentHistoryPoint[]>(`/stocks/${ticker}/history`).then((r) => r.data),
  refresh: (ticker: string) => api.post(`/stocks/${ticker}/refresh`).then((r) => r.data),
};
