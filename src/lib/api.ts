import axios from "axios";

export const API_BASE = "https://backend-b4nx.onrender.com";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("voltnode_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("voltnode_token");
      localStorage.removeItem("voltnode_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const formatNaira = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const maskDriver = (id?: string | null) => {
  if (!id) return "—";
  const s = String(id);
  return s.slice(0, 3) + "***";
};