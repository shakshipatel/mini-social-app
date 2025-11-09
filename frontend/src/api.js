import axios from "axios";

// Use Vite's env variables. In Vite, env vars must be prefixed with VITE_ to be exposed.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({ baseURL });

// helper to set auth token for subsequent requests
export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export default api;
