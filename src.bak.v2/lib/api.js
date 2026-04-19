/**
 * Thin wrapper around fetch for the Omni backend.
 * Handles auth token, JSON parsing, error normalization.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
const TOKEN_KEY = "omni:auth:token";

// ─── Token storage ───────────────────────────────────────────────────────
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
export function clearToken() { setToken(null); }

// ─── Core fetch ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message); this.status = status; this.data = data;
  }
}

export async function api(path, { method = "GET", body, auth = true, timeout = 10_000 } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      credentials: "omit",
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      // Token expired or revoked → clear it so the app can re-auth
      if (res.status === 401) clearToken();
      const msg = (data && data.error) || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, data);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Endpoints (typed shortcuts) ─────────────────────────────────────────
export const auth = {
  nonce: () => api("/api/auth/nonce", { method: "POST", auth: false }),
  verify: (message, signature) =>
    api("/api/auth/verify", { method: "POST", auth: false, body: { message, signature } }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
};

export const watchlist = {
  list: () => api("/api/watchlist"),
  add: (coinId, symbol) => api("/api/watchlist", { method: "POST", body: { coinId, symbol } }),
  remove: (coinId) => api(`/api/watchlist/${encodeURIComponent(coinId)}`, { method: "DELETE" }),
  reorder: (coinIds) => api("/api/watchlist/reorder", { method: "PUT", body: { coinIds } }),
};

export const paper = {
  positions: (status) => api(`/api/paper/positions${status ? `?status=${status}` : ""}`),
  orders: () => api("/api/paper/orders"),
  place: (order) => api("/api/paper/orders", { method: "POST", body: order }),
  cancel: (id) => api(`/api/paper/orders/${encodeURIComponent(id)}`, { method: "DELETE" }),
  close: (id, currentMarketPrice) =>
    api(`/api/paper/positions/${encodeURIComponent(id)}/close`, {
      method: "POST", body: { currentMarketPrice },
    }),
  summary: () => api("/api/paper/summary"),
};

export const preferences = {
  get: () => api("/api/preferences"),
  update: (prefs) => api("/api/preferences", { method: "PUT", body: prefs }),
};

export const quests = {
  list: () => api("/api/quests"),
  progress: (id, delta) => api(`/api/quests/${encodeURIComponent(id)}/progress`, {
    method: "POST", body: { delta },
  }),
  claim: (id) => api(`/api/quests/${encodeURIComponent(id)}/claim`, { method: "POST" }),
};

export const health = {
  check: () => api("/api/health", { auth: false }),
};
